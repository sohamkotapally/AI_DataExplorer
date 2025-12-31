from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain_ollama import ChatOllama
from langchain_community.utilities import SQLDatabase
from langchain.chains import create_sql_query_chain
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

# Allow React to talk to this Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Connect to Database (UPDATE YOUR PASSWORD HERE)
# Format: mysql+mysqlconnector://root:YOUR_PASSWORD@localhost:3306/retail_db
mysql_uri = "mysql+mysqlconnector://root:admin@localhost:3306/retail_db"
db = SQLDatabase.from_uri(mysql_uri)

# 2. Initialize Ollama (Llama 3)
llm = ChatOllama(model="llama3", temperature=0)

# 3. Create Chain
chain = create_sql_query_chain(llm, db)

class QueryRequest(BaseModel):
    question: str

@app.post("/ask")
async def ask_database(request: QueryRequest):
    try:
        # Get SQL from LLM
        generated_sql = chain.invoke({"question": request.question})
        cleaned_sql = generated_sql.strip().replace("```sql", "").replace("```", "")
        
        # Run SQL on DB
        result = db.run(cleaned_sql)
        
        return {"query": cleaned_sql, "result": result}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)