import { useState, useRef, useCallback } from 'react'
import { Upload, FileSpreadsheet, Check, AlertCircle, Loader } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.tsv', '.json']
const ACCEPTED_MIME = [
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/tab-separated-values',
  'application/json',
]

function FileUpload({ onUploadComplete }) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null) // { success, message }
  const inputRef = useRef(null)

  const isValidFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    return ACCEPTED_EXTENSIONS.includes(ext)
  }

  const uploadFile = useCallback(async (file) => {
    if (!isValidFile(file)) {
      setUploadResult({ success: false, message: `Unsupported file type. Use: ${ACCEPTED_EXTENSIONS.join(', ')}` })
      return
    }

    setUploading(true)
    setUploadResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await axios.post('http://localhost:8000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000, // 2 minute timeout for large files + LLM chain init
      })

      if (res.data.error) {
        setUploadResult({ success: false, message: res.data.error })
      } else {
        setUploadResult({ success: true, message: `${res.data.filename} loaded — ${res.data.rows} rows, ${res.data.columns} columns` })
        onUploadComplete?.(res.data)
      }
    } catch (err) {
      const message = err.code === 'ECONNABORTED'
        ? 'Upload timed out. The file may be too large or the server is busy.'
        : 'Upload failed. Is the backend running?'
      setUploadResult({ success: false, message })
    }

    setUploading(false)
  }, [onUploadComplete])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) {
      uploadFile(e.dataTransfer.files[0])
    }
  }, [uploadFile])

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }, [])

  const handleFileSelect = (e) => {
    if (e.target.files?.[0]) {
      uploadFile(e.target.files[0])
    }
  }

  return (
    <motion.div
      className={`file-upload-zone ${dragActive ? 'drag-active' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      whileHover={{ scale: 1.01 }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <AnimatePresence mode="wait">
        {uploading ? (
          <motion.div key="uploading" className="upload-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Loader size={24} className="spin" />
            <span>Uploading & parsing...</span>
          </motion.div>
        ) : uploadResult ? (
          <motion.div key="result" className="upload-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {uploadResult.success ? <Check size={24} className="upload-success-icon" /> : <AlertCircle size={24} className="upload-error-icon" />}
            <span className={uploadResult.success ? 'upload-success-text' : 'upload-error-text'}>
              {uploadResult.message}
            </span>
          </motion.div>
        ) : (
          <motion.div key="idle" className="upload-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="upload-icon-wrapper">
              {dragActive ? <FileSpreadsheet size={28} /> : <Upload size={24} />}
            </div>
            <div className="upload-text-group">
              <span className="upload-primary-text">
                {dragActive ? 'Drop your file here' : 'Upload a data file'}
              </span>
              <span className="upload-secondary-text">
                CSV, XLSX, XLS, TSV, or JSON
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default FileUpload
