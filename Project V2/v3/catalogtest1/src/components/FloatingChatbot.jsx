import React, { useState } from 'react';
import { Fab, Paper, Box, IconButton, Typography } from '@mui/material'; // Added Typography import
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import CohereChatbot from './CohereChatbot';
import { useSnackbar } from 'notistack';

function FloatingChatbot({ books, loadBooks }) {
  const [isOpen, setIsOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 1000,
      }}
    >
      {isOpen && (
        <Paper
          elevation={5}
          sx={{
            position: 'absolute',
            bottom: 72,
            right: 0,
            width: { xs: '90vw', sm: 350 },
            height: 450,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: 'background.paper',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 1,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <Typography variant="h6" sx={{ ml: 1 }}>
              BookPal {/* <--- CHANGE HERE TOO */}
            </Typography>
            <IconButton onClick={toggleChat} color="inherit" size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <CohereChatbot books={books} loadBooks={loadBooks} enqueueSnackbar={enqueueSnackbar} />
          </Box>
        </Paper>
      )}

      <Fab color="primary" aria-label="chat" onClick={toggleChat}>
        <ChatIcon />
      </Fab>
    </Box>
  );
}

export default FloatingChatbot;