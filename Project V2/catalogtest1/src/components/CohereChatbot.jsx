import React, { useState, useRef, useEffect } from 'react';
import { addBook, updateBook, deleteBook } from '../services/bookService';
import { callCohere } from './cohereUtils';
import { Typography, TextField, Button, Box } from '@mui/material';

function CohereChatbot({ books, loadBooks, enqueueSnackbar }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const chatBoxRef = useRef(null);

  // Define help replies for different intents
  const helpReplies = {
    add: 'To add a book, type: Add book titled "Book Name" by Author Name in Genre, published in 2020.',
    delete: 'To delete a book, type: Delete book titled "Book Name" or by author "Author Name".',
    update: 'To update a book, say: Change the title of "Old Title" to "New Title" or update genre/year.',
    search: 'To search for books, type: Find books by "Author Name", genre, or books published after 2000.'
  };

  // Scroll to bottom of chat box on new messages
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(m => [...m, { role: 'user', text: userMessage }]);
    setInput('');

    try {
      const parsedIntents = await callCohere(userMessage);

      for (const { intent, data } of parsedIntents) {
        let botResponse = '';
        if (intent === 'help') {
          const helpTopic = userMessage.toLowerCase().includes('add') ? 'add' :
                           userMessage.toLowerCase().includes('delete') ? 'delete' :
                           userMessage.toLowerCase().includes('update') ? 'update' :
                           userMessage.toLowerCase().includes('search') ? 'search' : null;
          botResponse = helpTopic ? helpReplies[helpTopic] : 'I can help with adding, updating, deleting, or searching for books. What do you need assistance with?';
          setMessages(m => [...m, { role: 'bot', text: botResponse }]);
          continue;
        }

        if (!data) {
          botResponse = "I couldn't understand that. Please try rephrasing.";
          setMessages(m => [...m, { role: 'bot', text: botResponse }]);
          continue;
        }

        if (intent === 'add') {
          if (!data.title || !data.author) {
            botResponse = 'To add a book, I need at least a title and an author.';
            setMessages(m => [...m, { role: 'bot', text: botResponse }]);
            continue;
          }
          const exists = books.find(b =>
              b.title?.toLowerCase() === data.title?.toLowerCase() &&
              b.author?.toLowerCase() === data.author?.toLowerCase()
          );
          if (exists) {
              botResponse = `"${data.title}" by ${data.author} is already in your catalogue.`;
              enqueueSnackbar(botResponse, { variant: 'warning' });
              setMessages(m => [...m, { role: 'bot', text: botResponse }]);
              continue;
          }
          await addBook(data);
          botResponse = `Added "${data.title}" by ${data.author}.`;
          enqueueSnackbar(botResponse, { variant: 'success' });
          setMessages(m => [...m, { role: 'bot', text: botResponse }]);
          loadBooks();
        } else if (intent === 'update') {
          if (!data.query && !data.title) {
            botResponse = 'Please specify the book to update, e.g., "update the genre of Sapiens to History".';
            setMessages(m => [...m, { role: 'bot', text: botResponse }]);
            continue;
          }
          if (!data.fieldsToUpdate || Object.keys(data.fieldsToUpdate).length === 0) {
            botResponse = 'What do you want to update? Please specify fields like title, author, genre, or year.';
            setMessages(m => [...m, { role: 'bot', text: botResponse }]);
            continue;
          }

          let bookToUpdate = books.find(b => b.title?.toLowerCase() === data.title?.toLowerCase());
          if (!bookToUpdate && data.query) {
              bookToUpdate = books.find(b =>
                  b.title?.toLowerCase().includes(data.query.toLowerCase()) ||
                  b.author?.toLowerCase().includes(data.query.toLowerCase())
              );
          }

          if (bookToUpdate) {
            const updatedBook = { ...bookToUpdate, ...data.fieldsToUpdate };
            await updateBook(updatedBook.id, updatedBook);
            botResponse = `Updated "${updatedBook.title}".`;
            enqueueSnackbar(botResponse, { variant: 'info' });
            setMessages(m => [...m, { role: 'bot', text: botResponse }]);
            loadBooks();
          } else {
            botResponse = `Could not find a book matching "${data.title || data.query}".`;
            enqueueSnackbar(botResponse, { variant: 'warning' });
            setMessages(m => [...m, { role: 'bot', text: botResponse }]);
          }
        } else if (intent === 'delete') {
          if (!data.title && !data.author && !data.query) {
            botResponse = 'Please specify the book to delete, e.g., "Delete Sapiens".';
            setMessages(m => [...m, { role: 'bot', text: botResponse }]);
            continue;
          }

          let bookToDelete = null;
          if (data.title) {
              bookToDelete = books.find(b => b.title?.toLowerCase() === data.title?.toLowerCase());
          }
          if (!bookToDelete && data.author) {
              bookToDelete = books.find(b => b.author?.toLowerCase() === data.author?.toLowerCase());
          }
          if (!bookToDelete && data.query) {
              bookToDelete = books.find(b =>
                  b.title?.toLowerCase().includes(data.query.toLowerCase()) ||
                  b.author?.toLowerCase().includes(data.query.toLowerCase())
              );
          }

          if (bookToDelete) {
            await deleteBook(bookToDelete.id);
            botResponse = `Deleted "${bookToDelete.title}".`;
            enqueueSnackbar(botResponse, { variant: 'info' });
            setMessages(m => [...m, { role: 'bot', text: botResponse }]);
            loadBooks();
          } else {
            botResponse = `Could not find a book matching "${data.title || data.author || data.query}".`;
            enqueueSnackbar(botResponse, { variant: 'warning' });
            setMessages(m => [...m, { role: 'bot', text: botResponse }]);
          }
        } else if (intent === 'search') {
          let results = books;

          if (data.title) {
              results = results.filter(b => b.title?.toLowerCase().includes(data.title.toLowerCase()));
          }
          if (data.author) {
              results = results.filter(b => b.author?.toLowerCase().includes(data.author.toLowerCase()));
          }
          if (data.genre) {
              results = results.filter(b => b.genre?.toLowerCase() === data.genre.toLowerCase());
          }
          if (data.year) {
              results = results.filter(b => b.year === data.year);
          }
          if (data.query) {
              const queryLower = data.query.toLowerCase();
              results = results.filter(b =>
                  b.title?.toLowerCase().includes(queryLower) ||
                  b.author?.toLowerCase().includes(queryLower) ||
                  b.genre?.toLowerCase().includes(queryLower)
              );
          }
          if (data.range) {
            results = results.filter(b => {
                const year = b.year;
                const matchesRange = (!data.range.after || year >= data.range.after) &&
                                     (!data.range.before || year <= data.range.before);
                return matchesRange;
            });
          }

          if (results.length) {
            const text = results.map(b => `- "${b.title}" by ${b.author} (${b.year || 'N/A'}) [${b.genre || 'N/A'}]`).join('\\n');
            setMessages(m => [...m, { role: 'bot', text: `Found ${results.length} book(s):\\n${text}` }]);
          } else {
            setMessages(m => [...m, { role: 'bot', text: 'No matching books found.' }]);
          }
        } else {
            setMessages(m => [...m, { role: 'bot', text: "I'm not sure how to respond to that. Try asking for 'help'." }]);
        }
      }
    } catch (error) {
      console.error("Error handling input:", error);
      enqueueSnackbar(error.message || "Something went wrong with the chatbot. Please try again.", { variant: 'error' });
      setMessages(m => [...m, { role: 'bot', text: error.message || "Something went wrong. Please try again." }]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <Box className="chat-container" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="h6" component="h3" sx={{ p: 1, borderBottom: '1px solid #eee' }}>
        Book Chatbot
      </Typography>
      <Box className="chat-box" ref={chatBoxRef} sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
        {messages.map((msg, idx) => (
          <Box key={idx} sx={{
            mb: 1,
            p: 1,
            borderRadius: 1,
            bgcolor: msg.role === 'user' ? 'primary.light' : 'grey.200',
            color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
            wordBreak: 'break-word',
          }}>
            <Typography variant="body2">
              <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.text}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ p: 1, borderTop: '1px solid #eee', display: 'flex' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          size="small"
          sx={{ mr: 1 }}
        />
        <Button variant="contained" onClick={handleSend}>Send</Button>
      </Box>
    </Box>
  );
}

export default CohereChatbot;