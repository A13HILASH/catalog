import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button, TextField, Grid, Card, CardMedia, CardContent, Typography, Box, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { addBook, getBooks } from '../services/bookService';
import { useSnackbar } from 'notistack';
import FloatingChatbot from './FloatingChatbot';

// Define a list of predefined popular search terms for popular recommendations
const popularSearches = ['fiction', 'science fiction', 'fantasy', 'mystery', 'thriller'];
const maxRecommendedBooks = 5; //CHANGE HERE RECOM BOOK COUNT

export default function SearchBooks() {
  const { enqueueSnackbar } = useSnackbar();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [myBooks, setMyBooks] = useState([]);
  const [popularPicks, setPopularPicks] = useState([]);
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false); // New state for related books loading
  const [open, setOpen] = useState(false); // State to manage the dialog open/close
  const [selectedBook, setSelectedBook] = useState(null); // State to hold the book for details view

  // Function to load books from backend API
  const loadMyBooks = useCallback(async () => {
    try {
      const response = await getBooks();
      setMyBooks(response.data);
    } catch (error) {
      console.error("Error loading My Books:", error);
      enqueueSnackbar("Failed to load your books.", { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  // Load user's books when the component mounts
  useEffect(() => {
    loadMyBooks();
  }, [loadMyBooks]);

  // Fetch popular books based on hardcoded search terms
  useEffect(() => {
    const fetchPopularPicks = async () => {
      setIsLoadingRecommendations(true);
      const allPopular = [];
      for (const term of popularSearches) {
        try {
          const res = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(term)}&maxResults=${maxRecommendedBooks}`);
          if (res.data.items) {
            allPopular.push(...res.data.items);
          }
        } catch (error) {
          console.error(`Failed to fetch recommendations for term: ${term}`, error);
        }
      }
      const shuffled = allPopular.sort(() => 0.5 - Math.random());
      setPopularPicks(shuffled.slice(0, maxRecommendedBooks));
      setIsLoadingRecommendations(false);
    };

    fetchPopularPicks();
  }, []);

  // Function to fetch related books based on a single genre
  const fetchRelatedBooks = async (genre) => {
    setIsLoadingRelated(true);
    try {
      if (genre) {
        console.log(`Found genre for related search: ${genre}`); 
        const relatedRes = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=subject:${encodeURIComponent(genre)}&maxResults=${maxRecommendedBooks}`);
        console.log("Related books API response:", relatedRes.data.items || []); 
        setRelatedBooks(relatedRes.data.items || []);
      } else {
        setRelatedBooks([]);
      }
    } catch (error) {
      console.error("Error fetching related books:", error);
      setRelatedBooks([]);
    } finally {
      setIsLoadingRelated(false);
    }
  };

  const search = async () => {
    if (!query) return;
    try {
      // Fetch user's search results
      const res = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`);
      setResults(res.data.items || []);

      // Get the genre of the first search result to find related books
      if (res.data.items && res.data.items.length > 0) {
        const primaryBook = res.data.items[0];
        const genre = primaryBook.volumeInfo.categories?.[0];
        
        if (genre) {
          // Call the new function to fetch related books
          fetchRelatedBooks(genre);
        } else {
          setRelatedBooks([]); // Clear related books if no genre is found
        }
      } else {
        setRelatedBooks([]); // Clear related books if no search results
      }

    } catch (error) {
      console.error("Error searching books:", error);
      enqueueSnackbar("Failed to search books. Please try again later.", { variant: 'error' });
      setRelatedBooks([]);
    }
  };

  const handleAdd = async (book) => {
    // Check if the book is already in the user's collection
    if (myBooks.find(b => b.title === book.volumeInfo.title && b.author === (book.volumeInfo.authors || []).join(', '))) {
      enqueueSnackbar("This book is already in your collection.", { variant: 'warning' });
      return;
    }

    // Create a new book object based on the Google Books API response
    const newBook = {
      title: book.volumeInfo.title,
      author: (book.volumeInfo.authors || []).join(', '),
      genre: (book.volumeInfo.categories && book.volumeInfo.categories[0]) || 'N/A',
      year: book.volumeInfo.publishedDate ? parseInt(book.volumeInfo.publishedDate.substring(0, 4), 10) : 0,
    };
    try {
      await addBook(newBook);
      enqueueSnackbar("Book added successfully!", { variant: 'success' });
      loadMyBooks(); // Reload the list of books to reflect the change
    } catch (error) {
      console.error("Error adding book:", error);
      enqueueSnackbar("Failed to add book.", { variant: 'error' });
    }
  };

  // Function to open the details dialog
  const handleDetailsClick = (book) => {
    setSelectedBook(book);
    setOpen(true);
  };

  // Function to close the details dialog
  const handleClose = () => {
    setOpen(false);
    setSelectedBook(null);
  };

  const renderBookCard = (book) => (
    <Grid item xs={12} sm={6} md={4} lg={3} key={book.id}>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 450 }}>
        <CardMedia
          component="img"
          sx={{ height: 160, objectFit: 'contain', padding: 2 }}
          image={book.volumeInfo.imageLinks?.thumbnail || "https://placehold.co/128x192/E0E0E0/424242?text=No+Image"}
          alt={book.volumeInfo.title}
        />
        <CardContent sx={{ flexGrow: 1, minHeight: 120 }}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: '2',
              WebkitBoxOrient: 'vertical',
            }}
          >
            {book.volumeInfo.title}
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{
              mt: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: '2',
              WebkitBoxOrient: 'vertical',
            }}
          >
            Authors: {(book.volumeInfo.authors || []).join(', ') || 'Unknown'}
          </Typography>
          {book.volumeInfo.publishedDate && (
            <Typography variant="body2" sx={{ mt: 1 }}>Published: {book.volumeInfo.publishedDate.substring(0, 4)}</Typography>
          )}
          {book.volumeInfo.categories?.[0] && (
            <Typography variant="body2">Genre: {book.volumeInfo.categories[0]}</Typography>
          )}
        </CardContent>
        <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1, flexDirection: 'column' }}>
          <Button variant="outlined" fullWidth onClick={() => handleAdd(book)}>Add to My Books</Button>
          <Button variant="text" fullWidth onClick={() => handleDetailsClick(book)}>View Details</Button>
        </Box>
      </Card>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Search Input Section */}
      <Grid container spacing={2} alignItems="center" sx={{ mb: 4 }}>
        <Grid item xs={12} sm={9}>
          <TextField
            fullWidth
            label="Search books..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Button variant="contained" onClick={search} fullWidth sx={{ py: '14px' }}>Search</Button>
        </Grid>
      </Grid>

      {/* Main Search Results */}
      {results.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h2" sx={{ mb: 2 }}>Search Results</Typography>
          <Grid container spacing={2}>
            {results.map(renderBookCard)}
          </Grid>
        </Box>
      )}

      {/* Related Books Section */}
      {relatedBooks.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" component="h2" sx={{ mb: 2 }}>You might also like...</Typography>
          {isLoadingRelated ? (
             <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
               <CircularProgress />
             </Box>
          ) : (
            <Grid container spacing={2}>
              {relatedBooks.map(renderBookCard)}
            </Grid>
          )}
        </Box>
      )}

      {/* Popular Picks Section (Hardcoded) */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h2" sx={{ mb: 2 }}>Popular Picks</Typography>
        {isLoadingRecommendations ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {popularPicks.map(renderBookCard)}
          </Grid>
        )}
      </Box>

      <FloatingChatbot books={myBooks} loadBooks={loadMyBooks} />

      {/* Book Details Dialog */}
      {selectedBook && (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>{selectedBook.volumeInfo.title}</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <img
                  src={selectedBook.volumeInfo.imageLinks?.thumbnail || "https://placehold.co/128x192/E0E0E0/424242?text=No+Image"}
                  alt={selectedBook.volumeInfo.title}
                  style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <Typography variant="h6">Author: {(selectedBook.volumeInfo.authors || []).join(', ')}</Typography>
                <Typography variant="body1">Genre: {(selectedBook.volumeInfo.categories && selectedBook.volumeInfo.categories[0]) || 'N/A'}</Typography>
                <Typography variant="body1">Published: {selectedBook.volumeInfo.publishedDate || 'N/A'}</Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6">Description:</Typography>
                  <Typography variant="body2" dangerouslySetInnerHTML={{ __html: selectedBook.volumeInfo.description || 'No description available.' }} />
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">Close</Button>
            <Button onClick={() => { handleAdd(selectedBook); handleClose(); }} color="primary" variant="contained">Add to My Books</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
