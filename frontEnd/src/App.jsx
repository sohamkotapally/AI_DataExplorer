import { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import './App.css'

function App() {
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem('retail-chat-history');
    return saved ? JSON.parse(saved) : [{ id: Date.now(), title: 'New Chat', messages: [] }];
  });

  const [activeId, setActiveId] = useState(chats[0].id);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [visualize, setVisualize] = useState(false);

  useEffect(() => {
    localStorage.setItem('retail-chat-history', JSON.stringify(chats));
  }, [chats]);

  const activeChat = chats.find(c => c.id === activeId) || chats[0];

  const handleSend = async (textOverride) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    setInput('');
    setLoading(true);

    const newMessage = { role: 'user', content: textToSend };

    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === activeId) {
        const newTitle = chat.messages.length === 0 ? textToSend.slice(0, 30) : chat.title;
        return {
          ...chat,
          title: newTitle,
          messages: [...chat.messages, newMessage]
        };
      }
      return chat;
    }));

    try {
      const res = await axios.post('http://localhost:8000/ask', {
        question: textToSend
      });

      let aiContent = '';
      let sqlQuery = '';
      let tableData = null;

      if (res.data.error) {
        aiContent = `⚠️ Error: ${res.data.error}`;
      } else {
        aiContent = res.data.answer;
        sqlQuery = res.data.query;
        tableData = res.data.table_data || null;
      }

      const aiMessage = { role: 'ai', content: aiContent, sql: sqlQuery, tableData, visualize };

      setChats(prevChats => prevChats.map(chat =>
        chat.id === activeId
          ? { ...chat, messages: [...chat.messages, aiMessage] }
          : chat
      ));
    } catch (error) {
      setChats(prevChats => prevChats.map(chat =>
        chat.id === activeId
          ? { ...chat, messages: [...chat.messages, { role: 'ai', content: "⚠️ Server Error: I couldn't reach the backend." }] }
          : chat
      ));
    }
    setLoading(false);
  };

  const startNewChat = () => {
    const newChat = { id: Date.now(), title: 'New Chat', messages: [] };
    setChats([newChat, ...chats]);
    setActiveId(newChat.id);
  };

  const deleteChat = (e, id) => {
    e.stopPropagation();
    const filtered = chats.filter(c => c.id !== id);
    if (filtered.length === 0) {
      const fresh = { id: Date.now(), title: 'New Chat', messages: [] };
      setChats([fresh]);
      setActiveId(fresh.id);
    } else {
      setChats(filtered);
      if (id === activeId) setActiveId(filtered[0].id);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleUploadComplete = (fileInfo) => {
    setUploadedFile(fileInfo);
  };

  const handleClearFile = async () => {
    try {
      await axios.post('http://localhost:8000/clear-upload');
      setUploadedFile(null);
    } catch (error) {
      console.error('Failed to clear file:', error);
      setUploadedFile(null);
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        chats={chats}
        activeId={activeId}
        setActiveId={setActiveId}
        startNewChat={startNewChat}
        deleteChat={deleteChat}
        uploadedFile={uploadedFile}
        onClearFile={handleClearFile}
      />
      <ChatArea
        activeChat={activeChat}
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        handleKeyDown={handleKeyDown}
        loading={loading}
        onUploadComplete={handleUploadComplete}
        visualize={visualize}
        setVisualize={setVisualize}
      />
    </div>
  )
}

export default App