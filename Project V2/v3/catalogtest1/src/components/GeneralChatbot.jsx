import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, Button, Paper, CircularProgress, Fab, Zoom } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import { styled } from '@mui/system';

// Custom styled components for a cleaner UI
const ChatBox = styled(Box)({
  flexGrow: 1,
  overflowY: 'auto',
  padding: '16px',
  backgroundColor: '#f5f5f5',
  borderRadius: '8px',
  marginBottom: '16px',
});

const MessageBubble = styled(Box)(({ owner }) => ({
  marginBottom: '8px',
  padding: '12px',
  borderRadius: '16px',
  maxWidth: '80%',
  wordBreak: 'break-word',
  alignSelf: owner === 'user' ? 'flex-end' : 'flex-start',
  backgroundColor: owner === 'user' ? '#1976d2' : '#e0e0e0',
  color: owner === 'user' ? '#fff' : '#000',
  borderTopRightRadius: owner === 'user' ? '4px' : '16px',
  borderTopLeftRadius: owner === 'user' ? '16px' : '4px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
}));

// This is the reusable Chatbot component
const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: crypto.randomUUID(),
      sender: 'bot',
      text: "Hello! I am a general conversational bot. Ask me anything!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const chatContainerRef = useRef(null);

  // Scroll to the bottom of the chat when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Function to handle the user's message submission
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    // Add user's message to the chat
    const userMessage = input;
    setMessages(prevMessages => [...prevMessages, { id: crypto.randomUUID(), sender: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("API key is undefined. Please check your .env file and restart the server.");
      const botMessage = { id: crypto.randomUUID(), sender: 'bot', text: "The API key is missing. Please ensure it is configured correctly." };
      setMessages(prevMessages => [...prevMessages, botMessage]);
      setIsLoading(false);
      return;
    }

    try {
      const prompt = `You are a helpful and friendly assistant. Please provide a concise and accurate response to the following query:
      User message: "${userMessage}"`;
      
      const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      };
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      const botResponseText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response. Please try again.";
      
      const botMessage = { id: crypto.randomUUID(), sender: 'bot', text: botResponseText };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error) {
      console.error("Error processing message:", error);
      const botMessage = { id: crypto.randomUUID(), sender: 'bot', text: "An error occurred while processing your request. Please try again." };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    }
    setIsLoading(false);
  };

  return (
    <>
      <Zoom in={isOpen} style={{ transitionDelay: isOpen ? '100ms' : '0ms' }}>
        <Paper elevation={8} sx={{
          position: 'fixed',
          bottom: '96px', // Positioned above the Fab
          left: '24px', // Aligned with the Fab
          width: '90%',
          maxWidth: '400px',
          height: 'calc(100vh - 120px)', // Uses a responsive height to prevent the title from being hidden
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0px 10px 25px rgba(0,0,0,0.2)',
          zIndex: 100
        }}>
          {/* Chatbot Header */}
          <Box sx={{ p: 2, backgroundColor: '#1976d2', color: '#fff', borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
              BookPal
            </Typography>
          </Box>

          {/* Message display area */}
          <ChatBox ref={chatContainerRef}>
            {messages.map(msg => (
              <Box key={msg.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                <MessageBubble owner={msg.sender}>
                  <Typography variant="body1">
                    {msg.text}
                  </Typography>
                </MessageBubble>
              </Box>
            ))}
            {isLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={24} sx={{ color: '#bdbdbd', mr: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Bot is typing...
                </Typography>
              </Box>
            )}
          </ChatBox>
          
          {/* User input form */}
          <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, borderTop: '1px solid #e0e0e0', display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter' && !isLoading) {
                  handleSendMessage(e);
                }
              }}
              disabled={isLoading}
              sx={{ mr: 1, '& .MuiOutlinedInput-root': { borderRadius: '25px', paddingRight: '8px' } }}
            />
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={isLoading}
              sx={{ borderRadius: '50%', minWidth: '56px', height: '56px' }}
            >
              <SendIcon />
            </Button>
          </Box>
        </Paper>
      </Zoom>
      
      {/* Floating Action Button to toggle the chatbot */}
      <Fab
        color="primary"
        aria-label="chat"
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 101,
          transition: 'all 0.3s ease-in-out'
        }}
      >
        <ChatBubbleIcon />
      </Fab>
    </>
  );
};

export default Chatbot;
