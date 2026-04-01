import { useRef, useEffect } from 'react'
import { Send, Zap, BarChart3, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import MessageBubble from './MessageBubble'
import EmptyState from './EmptyState'

function ChatArea({ activeChat, input, setInput, handleSend, handleKeyDown, loading, onUploadComplete, visualize, setVisualize }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChat, loading])

  return (
    <div className="main-chat">
      <div className="chat-display">
        <AnimatePresence mode="wait">
          {activeChat.messages.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
              transition={{ duration: 0.35 }}
            >
              <EmptyState 
                onSuggestionClick={handleSend} 
                onUploadComplete={onUploadComplete}
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeChat.id}
              initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(6px)' }}
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {activeChat.messages.map((msg, index) => (
                <MessageBubble key={index} msg={msg} index={index} />
              ))}

              <AnimatePresence>
                {loading && (
                  <motion.div
                    className="message-row ai"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <div className="message-content">
                      <motion.div 
                        className="avatar ai"
                        animate={{ boxShadow: ['0 0 0px rgba(108,92,231,0.3)', '0 0 16px rgba(108,92,231,0.6)', '0 0 0px rgba(108,92,231,0.3)'] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Zap size={16} />
                      </motion.div>
                      <div className="loading-dots">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <motion.div 
        className="input-area"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="input-container">
          <motion.button
            className={`viz-toggle ${visualize ? 'active' : ''}`}
            onClick={() => setVisualize(!visualize)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            title={visualize ? 'Charts enabled — click to disable' : 'Click to enable data visualizations'}
          >
            <div className="toggle-checkbox">
              <AnimatePresence mode="wait">
                {visualize && (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Check size={10} strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <BarChart3 size={14} />
            <span className="viz-toggle-label">Visualize</span>
          </motion.button>

          <input
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Nexus anything about your data..."
            disabled={loading}
          />
          <motion.button 
            className="send-btn" 
            onClick={() => handleSend()} 
            disabled={loading || !input.trim()}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            <Send size={16} />
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

export default ChatArea
