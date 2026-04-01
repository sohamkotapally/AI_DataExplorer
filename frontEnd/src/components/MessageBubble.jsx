import { Zap, User, Terminal, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import DataVisualization, { DataTable } from './DataVisualization'

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

          {msg.tableData && msg.visualize === true && (
            <DataVisualization tableData={msg.tableData} />
          )}

          {msg.tableData && msg.visualize !== true && (
            <motion.div
              className="inline-table-wrapper"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.35 }}
            >
              <DataTable tableData={msg.tableData} />
            </motion.div>
          )}

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
