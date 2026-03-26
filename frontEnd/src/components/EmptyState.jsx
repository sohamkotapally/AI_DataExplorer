import { Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import FileUpload from './FileUpload'

const suggestions = [
  { emoji: '💰', title: 'Pricing Analysis', query: 'What is the most expensive product?' },
  { emoji: '🏆', title: 'Top Rankings', query: 'List the top 5 products by price' },
  { emoji: '📊', title: 'Inventory Stats', query: 'Count how many products we have' },
  { emoji: '🔍', title: 'Search', query: "Find products with 'Pro' in the name" },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 }
  }
}

const item = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 250, damping: 20 } }
}

function EmptyState({ onSuggestionClick, onUploadComplete }) {
  return (
    <div className="empty-state">
      <motion.div
        className="hero-section"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <motion.div 
          className="hero-icon"
          animate={{ 
            boxShadow: ['0 0 20px rgba(108,92,231,0.2)', '0 0 40px rgba(108,92,231,0.45)', '0 0 20px rgba(108,92,231,0.2)']
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Zap size={30} />
        </motion.div>
        <h1 className="logo-text">Nexus</h1>
        <p className="hero-subtitle">Your AI-powered data companion</p>
      </motion.div>

      {/* File Upload */}
      <FileUpload onUploadComplete={onUploadComplete} />

      {/* Divider */}
      <motion.div 
        className="empty-divider"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.25, duration: 0.5 }}
      >
        <span>or try a sample question</span>
      </motion.div>

      {/* Suggestions */}
      <motion.div
        className="suggestions-grid"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {suggestions.map((s, i) => (
          <motion.div
            key={i}
            className="suggestion-card"
            variants={item}
            whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSuggestionClick(s.query)}
          >
            <div className="suggestion-emoji">{s.emoji}</div>
            <div className="suggestion-heading">{s.title}</div>
            <div className="suggestion-sub">"{s.query}"</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

export default EmptyState
