import React, { useState } from 'react';
import { Fab, Paper, Box, IconButton, Typography, useTheme, Button } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import BookOutlinedIcon from '@mui/icons-material/BookOutlined';
import CohereChatbot from './CohereChatbot';

// This is the floating chatbot component that toggles the chat window
// and positions it on the bottom right of the screen.
function FloatingChatbot({ books, loadBooks }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('general'); // 'general' or 'book_management'
  const theme = useTheme();

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };
  
  const handleModeChange = (newMode) => {
    setMode(newMode);
  };

  return (
    <>
      {/* Chat Window - positioned separately from FAB */}
      {isOpen && (
        <Paper
          elevation={5}
          sx={{
            position: 'fixed',
            bottom: '88px', // Space for FAB (72px) + margin (16px)
            right: '16px',
            width: { xs: 'calc(100vw - 32px)', sm: '400px' },
            height: 'calc(100dvh - 120px)', // Use dvh (dynamic viewport height) to exclude browser UI
            maxHeight: '600px', // Set a reasonable max height
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: 'background.paper',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: theme.zIndex.modal, // Higher z-index to ensure it's above everything
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              background: 'linear-gradient(45deg, #7b4397 30%, #dc2430 90%)',
              color: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              flexShrink: 0,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {/* Bot Avatar */}
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                }}
              >
                <img
                  src="https://placehold.co/40x40/7b4397/ffffff?text=AI"
                  alt="Bot Avatar"
                  style={{ borderRadius: '50%' }}
                />
              </Box>
              <Box>
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                  BookBot Assistant
                </Typography>
                <Typography variant="caption" component="div" sx={{ display: 'flex', alignItems: 'center', mt: -0.5, opacity: 0.8 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4caf50', mr: 0.5 }} />
                  Online now
                </Typography>
              </Box>
            </Box>
            
            {/* Mode Toggles and Close Button */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                sx={{
                  bgcolor: mode === 'general' ? '#fff' : 'transparent',
                  color: mode === 'general' ? 'primary.main' : '#fff',
                  '&:hover': {
                    bgcolor: mode === 'general' ? '#fff' : 'rgba(255,255,255,0.1)',
                  },
                }}
                onClick={() => handleModeChange('general')}
              >
                <ChatIcon fontSize="small" sx={{ mr: 0.5 }} /> Chat
              </Button>
              <Button
                variant="contained"
                size="small"
                sx={{
                  bgcolor: mode === 'book_management' ? '#fff' : 'transparent',
                  color: mode === 'book_management' ? 'primary.main' : '#fff',
                  '&:hover': {
                    bgcolor: mode === 'book_management' ? '#fff' : 'rgba(255,255,255,0.1)',
                  },
                }}
                onClick={() => handleModeChange('book_management')}
              >
                <BookOutlinedIcon fontSize="small" sx={{ mr: 0.5 }} /> Books
              </Button>
              <IconButton onClick={toggleChat} color="inherit" size="small" sx={{ ml: 1 }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
          
          {/* Chat Content */}
          <Box sx={{ flexGrow: 1, overflow: 'hidden', minHeight: 0 }}>
            <CohereChatbot books={books} loadBooks={loadBooks} mode={mode} onModeChange={handleModeChange} />
          </Box>
        </Paper>
      )}

      {/* Floating Action Button - positioned separately */}
      <Fab 
        color="primary" 
        aria-label="chat" 
        onClick={toggleChat}
        sx={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          zIndex: theme.zIndex.fab,
        }}
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </Fab>
    </>
  );
}

export default FloatingChatbot;