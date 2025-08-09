import React, { useState, useRef, useEffect } from 'react';
import { IconButton, TextField, Box, Paper, Typography, CircularProgress, Avatar } from '@mui/material';
import { Send } from '@mui/icons-material';
import { 
  callCohereAPI, 
  executeBookOperation,
} from './cohereUtils';

// This is the core chat component.
const CohereChatBot = ({ mode, onModeChange }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: `Hello! I'm your AI assistant. You are in **${mode === 'general' ? 'General Chat' : 'Book Management'}** mode. What's next?`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Use useEffect to reset the chat when the mode changes
  useEffect(() => {
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: `Hello! I'm your AI assistant. You are in **${mode === 'general' ? 'General Chat' : 'Book Management'}** mode. What's next?`,
        timestamp: new Date()
      }
    ]);
    setConversationHistory([]);
  }, [mode]);

  const addMessage = (type, content) => {
    const newMessage = {
      id: Date.now(),
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const handleSubmit = async (e) => {
    // This function handles both form submission and the Enter key press
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage;
    setInputMessage('');
    
    // Add user message to UI
    addMessage('user', userMessage);
    
    // Add user message to conversation history for AI context
    setConversationHistory(prev => [...prev, { role: 'user', message: userMessage }]);

    setIsLoading(true);

    try {
      if (mode === 'book_management') {
        const aiResponse = await callCohereAPI(userMessage, conversationHistory, mode);
        const operationResult = await executeBookOperation(aiResponse);
        addMessage('bot', operationResult.message);
      } else {
        const aiResponse = await callCohereAPI(userMessage, conversationHistory, mode);
        addMessage('bot', aiResponse);
      }
    } catch (error) {
      console.error('Error during handleSubmit:', error);
      addMessage('bot', `Sorry, I encountered an error. Please try again.\n\n${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#f0f2f5' }}>
      {/* Messages */}
      <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
        {messages.map(msg => (
          <Box key={msg.id} sx={{ display: 'flex', justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start', mb: 2 }}>
            {msg.type === 'bot' && (
              <Avatar sx={{ bgcolor: 'white', mr: 1 }}>
                <img
                  src="https://placehold.co/40x40/7b4397/ffffff?text=AI"
                  alt="Bot Avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Avatar>
            )}
            <Paper 
              elevation={1} 
              sx={{ 
                p: 1.5, 
                maxWidth: '75%', 
                bgcolor: msg.type === 'user' ? '#7b4397' : 'white',
                color: msg.type === 'user' ? 'white' : 'text.primary',
                borderRadius: '20px',
                borderBottomLeftRadius: msg.type === 'bot' ? '5px' : '20px',
                borderBottomRightRadius: msg.type === 'user' ? '5px' : '20px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
            >
              <Typography 
                variant="body2" 
                dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} 
              />
              <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', color: msg.type === 'user' ? 'rgba(255,255,255,0.7)' : 'text.secondary', mt: 0.5 }}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Paper>
          </Box>
        ))}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2, alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'white', mr: 1 }}>
              <img
                src="https://placehold.co/40x40/7b4397/ffffff?text=AI"
                alt="Bot Avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Avatar>
            <CircularProgress size={24} sx={{ color: '#7b4397' }} />
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box sx={{ p: 1, borderTop: 1, borderColor: '#e0e0e0', bgcolor: 'white', display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          size="small"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSubmit(e);
            }
          }}
          placeholder="Type your message..."
          disabled={isLoading}
          sx={{
            mr: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px',
              '& fieldset': {
                borderColor: '#e0e0e0',
              },
              '&:hover fieldset': {
                borderColor: '#c0c0c0',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#7b4397',
              },
            },
          }}
        />
        <IconButton
          color="primary"
          onClick={handleSubmit}
          disabled={isLoading || !inputMessage.trim()}
        >
          <Send />
        </IconButton>
      </Box>
    </Box>
  );
};

export default CohereChatBot;
