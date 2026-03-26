import { Zap, User, Terminal, AlertTriangle, Table } from 'lucide-react'
import { motion } from 'framer-motion'

function DataTable({ tableData }) {
  if (!tableData?.columns?.length || !tableData?.rows?.length) return null

  return (
    <motion.div
      className="result-table-wrapper"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.35 }}
    >
      <div className="result-table-header">
        <Table size={12} />
        <span>Query Results</span>
        <span className="result-table-count">{tableData.rows.length} row{tableData.rows.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="result-table-scroll">
        <table className="result-table">
          <thead>
            <tr>
              {tableData.columns.map((col, i) => (
                <th key={i}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

function MessageBubble({ msg, index }) {
  const isError = msg.content?.startsWith('⚠️')

  return (
    <motion.div
      className={`message-row ${msg.role}`}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="message-content">
        <motion.div 
          className={`avatar ${msg.role}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15, delay: index * 0.04 + 0.1 }}
        >
          {msg.role === 'ai' ? <Zap size={16} /> : <User size={16} />}
        </motion.div>
        <div className="message-body">
          <div className={`message-author ${msg.role}`}>
            {msg.role === 'ai' ? 'Nexus' : 'You'}
          </div>

          {isError ? (
            <motion.div
              className="error-card"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              <div className="error-card-header">
                <AlertTriangle size={16} />
                <span>Something went wrong</span>
              </div>
              <div className="error-card-body">
                {msg.content.replace('⚠️ ', '').replace('⚠️', '')}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              className="message-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {msg.content}
            </motion.div>
          )}

          {msg.tableData && <DataTable tableData={msg.tableData} />}

          {msg.sql && (
            <motion.div
              className="sql-block"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.35 }}
            >
              <div className="sql-label">
                <Terminal size={12} />
                <span>Generated SQL</span>
              </div>
              <pre><code>{msg.sql}</code></pre>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default MessageBubble
