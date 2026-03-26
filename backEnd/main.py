from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from langchain_ollama import ChatOllama
from langchain_community.utilities import SQLDatabase
from langchain.chains import create_sql_query_chain
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import pandas as pd
import sqlite3
import tempfile
import os
import io
import re


def clean_sql_quotes(sql):
    """Fix mixed quoting issues the LLM generates for SQLite.
    
    Handles patterns like:
      `"name"`  →  name
      `"data"`  →  data
      "name"    →  name  (for SQLite compatibility)
      `name`    →  name
    """
    sql = re.sub(r'`"([^"]+)"`', r'\1', sql)
    sql = re.sub(r'"([^"]+)"', r'\1', sql)
    sql = re.sub(r'`([^`]+)`', r'\1', sql)
    return sql

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mysql_uri = "mysql+mysqlconnector://root:admin@localhost:3306/retail_db"

db = None
llm = None
chain = None

uploaded_db = None       
uploaded_chain = None   
uploaded_file_info = None  


def get_llm():
    """Lazily initialize the LLM."""
    global llm
    if llm is None:
        llm = ChatOllama(model="llama3", temperature=0)
    return llm


def get_default_db_and_chain():
    """Lazily initialize the default MySQL database and chain."""
    global db, chain
    if db is None:
        db = SQLDatabase.from_uri(mysql_uri)
    if chain is None:
        chain = create_sql_query_chain(get_llm(), db)
    return db, chain

class QueryRequest(BaseModel):
    question: str


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Accept CSV/XLSX/XLS/TSV/JSON and load into a temp SQLite database."""
    global uploaded_db, uploaded_chain, uploaded_file_info

    try:
        filename = file.filename.lower()
        contents = await file.read()

        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(contents))
        elif filename.endswith('.tsv'):
            df = pd.read_csv(io.BytesIO(contents), sep='\t')
        elif filename.endswith('.json'):
            df = pd.read_json(io.BytesIO(contents))
        else:
            return {"error": f"Unsupported file type: {filename}"}

        df.columns = [
            col.strip().replace(' ', '_').replace('(', '').replace(')', '').replace('-', '_')
            for col in df.columns
        ]

        tmp_dir = tempfile.mkdtemp()
        db_path = os.path.join(tmp_dir, "uploaded_data.db")
        conn = sqlite3.connect(db_path)
        table_name = "data"
        df.to_sql(table_name, conn, if_exists="replace", index=False)
        conn.close()

        sqlite_uri = f"sqlite:///{db_path}"
        uploaded_db = SQLDatabase.from_uri(sqlite_uri)
        uploaded_chain = create_sql_query_chain(get_llm(), uploaded_db)

        uploaded_file_info = {
            "filename": file.filename,
            "rows": len(df),
            "columns": len(df.columns),
            "column_names": list(df.columns),
        }

        return {
            "filename": file.filename,
            "rows": len(df),
            "columns": len(df.columns),
            "column_names": list(df.columns),
            "message": "File uploaded and ready for queries."
        }

    except Exception as e:
        return {"error": f"Failed to process file: {str(e)}"}


@app.get("/upload-status")
async def upload_status():
    """Check if a file is currently loaded."""
    if uploaded_file_info:
        return {"loaded": True, **uploaded_file_info}
    return {"loaded": False}


@app.post("/ask")
async def ask_database(request: QueryRequest):
    try:
        if uploaded_chain:
            active_chain = uploaded_chain
            active_db = uploaded_db
        else:
            active_db, active_chain = get_default_db_and_chain()

        generated_response = active_chain.invoke({"question": request.question})

        if "SQLQuery:" in generated_response:
            cleaned_sql = generated_response.split("SQLQuery:")[1]
        else:
            cleaned_sql = generated_response

        cleaned_sql = cleaned_sql.replace("```sql", "").replace("```", "").strip()

        if uploaded_chain:
            cleaned_sql = clean_sql_quotes(cleaned_sql)

        if not cleaned_sql.upper().startswith("SELECT"):
             return {"error": "The AI failed to generate a valid SQL query."}

        raw_result = active_db.run(cleaned_sql)

        table_data = None
        try:
            from sqlalchemy import text
            engine = active_db._engine
            with engine.connect() as conn:
                result = conn.execute(text(cleaned_sql))
                columns = list(result.keys())
                rows = [list(str(v) for v in row) for row in result.fetchall()]
                if columns and rows:
                    table_data = {"columns": columns, "rows": rows[:100]}  
        except Exception:
            pass  

        summary_prompt = (
            f"User Question: {request.question}\n"
            f"Database Raw Data: {raw_result}\n"
            f"Please answer the user's question in a single, friendly, natural language sentence based on the raw data. "
            f"Do not mention 'decimal' or technical terms."
        )
        natural_answer = get_llm().invoke(summary_prompt).content

        return {
            "query": cleaned_sql,
            "raw": raw_result,
            "answer": natural_answer,
            "table_data": table_data,
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)