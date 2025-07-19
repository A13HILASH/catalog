import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import axios from 'axios';
import { Button, TextField, Grid, Card, CardMedia, CardContent, Typography, Box } from '@mui/material';
import { addBook, getBooks } from '../services/bookService';
import { useSnackbar } from 'notistack';
import FloatingChatbot from './FloatingChatbot';

export default function SearchBooks() {
  const { enqueueSnackbar } = useSnackbar();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [myBooks, setMyBooks] = useState([]);

  // Function to load books from your backend API
  // Wrapped in useCallback to prevent unnecessary re-creations, helpful for useEffect dependency
  const loadMyBooks = useCallback(async () => {
    try {
      const response = await getBooks();
      setMyBooks(response.data);
    } catch (error) {
      console.error("Error loading My Books:", error);
      enqueueSnackbar("Failed to load your books.", { variant: 'error' });
    }
  }, [enqueueSnackbar]); // enqueueSnackbar is stable, but good to include if it changes

  // Load books when the component mounts
  useEffect(() => {
    loadMyBooks();
  }, [loadMyBooks]); // Added loadMyBooks to dependency array

  const search = async () => {
    if (!query) return;
    try {
      const res = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`);
      setResults(res.data.items || []);
    } catch (error) {
      console.error("Error searching Google Books:", error);
      enqueueSnackbar("Failed to search Google Books.", { variant: 'error' });
    }
  };

  const handleAdd = async (v) => {
    const exists = myBooks.find(b => b.openLibraryId === v.id);
    if (exists) {
      enqueueSnackbar('Already in My Books', { variant: 'warning' });
      return;
    }
    const vol = v.volumeInfo;
    try {
      await addBook({
        openLibraryId: v.id,
        title: vol.title,
        author: (vol.authors || []).join(', '),
        genre: (vol.categories?.[0] || null),
        year: parseInt(vol.publishedDate || '0'),
        coverUrl: vol.imageLinks?.thumbnail
      });
      enqueueSnackbar('Book added', { variant: 'success' });
      setResults(prev => prev.filter(x => x.id !== v.id));
      loadMyBooks();
    } catch (error) {
      console.error("Error adding book:", error);
      enqueueSnackbar('Failed to add book.', { variant: 'error' });
    }
  };

  return (
    <>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={9}>
          <TextField
            fullWidth variant="outlined"
            placeholder="Search books..."
            value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Button variant="contained" onClick={search} fullWidth>Search</Button>
        </Grid>
      </Grid>
      <Grid container spacing={2} sx={{ marginTop: 2 }}>
        {results.map(v => (
          <Grid item xs={12} md={6} key={v.id}>
            <Card>
              {v.volumeInfo.imageLinks?.thumbnail &&
                <CardMedia component="img" sx={{ height: 160, objectFit: 'contain' }} image={v.volumeInfo.imageLinks.thumbnail} alt={v.volumeInfo.title} />}
              <CardContent>
                <Typography variant="h6">{v.volumeInfo.title}</Typography>
                <Typography variant="body2" color="textSecondary">{(v.volumeInfo.authors || []).join(', ')}</Typography>
                {v.volumeInfo.publishedDate && <Typography variant="body2">Published: {v.volumeInfo.publishedDate}</Typography>}
                {v.volumeInfo.categories?.[0] && <Typography variant="body2">Genre: {v.volumeInfo.categories[0]}</Typography>}
              </CardContent>
              <Box sx={{ p: 2, pt: 0 }}>
                <Button variant="outlined" fullWidth onClick={() => handleAdd(v)}>Add to My Books</Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <FloatingChatbot books={myBooks} loadBooks={loadMyBooks} />
    </>
  );
}