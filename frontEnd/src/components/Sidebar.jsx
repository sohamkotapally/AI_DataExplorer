import { Plus, MessageSquare, Trash2, Zap, FileSpreadsheet } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function Sidebar({ chats, activeId, setActiveId, startNewChat, deleteChat, uploadedFile }) {
  return (
    <motion.div 
      className="sidebar"
      initial={{ x: -280, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
    >
      {/* Brand */}
      <div className="sidebar-brand">
        <motion.div 
          className="sidebar-brand-icon"
          whileHover={{ rotate: 15, scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Zap size={18} />
        </motion.div>
        <span className="sidebar-brand-text">Nexus</span>
      </div>

      {/* New Chat Button */}
      <motion.button 
        className="new-chat-btn" 
        onClick={startNewChat}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <Plus size={16} />
        <span>New Chat</span>
      </motion.button>

      {/* Uploaded File Badge */}
      <AnimatePresence>
        {uploadedFile && (
          <motion.div 
            className="uploaded-file-badge"
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <FileSpreadsheet size={14} />
            <div className="uploaded-file-info">
              <span className="uploaded-file-name">{uploadedFile.filename}</span>
              <span className="uploaded-file-rows">{uploadedFile.rows} rows · {uploadedFile.columns} cols</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat History */}
      <div className="sidebar-label">Recent</div>
      <div className="history-list">
        <AnimatePresence>
          {chats.map((chat, i) => (
            <motion.div
              key={chat.id}
              layout
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24, height: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
              onClick={() => setActiveId(chat.id)}
              className={`history-item ${chat.id === activeId ? 'active' : ''}`}
              whileHover={{ x: 4 }}
            >
              <div className="history-item-left">
                <MessageSquare size={14} />
                <span className="history-item-title">{chat.title}</span>
              </div>
              
              {chat.id === activeId && (
                <motion.div
                  initial={{ opacity: 0, scale: 0, rotate: -90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="delete-btn"
                  onClick={(e) => deleteChat(e, chat.id)}
                >
                  <Trash2 size={13} />
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default Sidebar
