import React, { useEffect, useState } from 'react';
import { 
  TextField, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider,
  Typography,
  Box,
  IconButton,
  InputAdornment
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { addBook, getBooks, updateBook } from '../services/bookService';
import { useSnackbar } from 'notistack';
import { useNavigate, useParams } from 'react-router-dom';

export default function BookForm({ edit }) {
  const { enqueueSnackbar } = useSnackbar();
  const nav = useNavigate();
  const { id } = useParams();
  const [book, setBook] = useState({ title: '', author: '', genre: '', year: 0, coverUrl: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchBookForEdit() {
      if (edit && id) {
        setLoading(true);
        try {
          const res = await getBooks();
          const b = res.data.find(x => x.id === +id);
          if (b) {
            setBook(b);
          } else {
            enqueueSnackbar('Book not found!', { variant: 'error' });
            nav('/mybooks');
          }
        } catch (error) {
          console.error("Failed to fetch book for edit:", error);
          enqueueSnackbar('Failed to load book for editing.', { variant: 'error' });
        } finally {
          setLoading(false);
        }
      }
    }
    fetchBookForEdit();
  }, [edit, id, nav, enqueueSnackbar]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (edit) {
        await updateBook(book.id, book);
        enqueueSnackbar('Book updated successfully!', { variant: 'success' });
      } else {
        await addBook(book);
        enqueueSnackbar('Book added successfully!', { variant: 'success' });
      }
      nav('/mybooks');
    } catch (error) {
      console.error("Failed to save book:", error);
      enqueueSnackbar('Failed to save book. Please try again.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    nav('/mybooks');
  };

  return (
    <Box sx={{ 
      maxWidth: 800, 
      mx: 'auto', 
      mt: 4, 
      p: 2,
      animation: 'fadeIn 0.5s ease-in-out'
    }}>
      <Card elevation={6} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <CardHeader
          title={
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              {edit ? (
                <>
                  <EditIcon sx={{ mr: 2, color: 'primary.main' }} />
                  Edit Book
                </>
              ) : (
                <>
                  <AddIcon sx={{ mr: 2, color: 'primary.main' }} />
                  Add New Book
                </>
              )}
            </Typography>
          }
          subheader={
            <Typography variant="body2" color="text.secondary">
              {edit ? 'Update the book details below' : 'Fill in the details to add a new book to your collection'}
            </Typography>
          }
          action={
            <IconButton onClick={handleCancel} aria-label="cancel">
              <ArrowBackIcon />
            </IconButton>
          }
          sx={{
            background: 'linear-gradient(135deg, #0306af8d 0%, #0306af97 0%)',
            pb: 2
          }}
        />
        <Divider />
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Book Title"
                  value={book.title}
                  onChange={e => setBook({ ...book, title: e.target.value })}
                  required
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Author"
                  value={book.author}
                  onChange={e => setBook({ ...book, author: e.target.value })}
                  required
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Genre"
                  value={book.genre}
                  onChange={e => setBook({ ...book, genre: e.target.value })}
                  required
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Publication Year"
                  value={book.year === 0 ? '' : book.year}
                  onChange={e =>
                    setBook({
                      ...book,
                      year: e.target.value === '' ? 0 : parseInt(e.target.value, 10),
                    })
                  }
                  required
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{ min: 1800, max: new Date().getFullYear() }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Cover Image URL"
                  value={book.coverUrl}
                  onChange={e => setBook({ ...book, coverUrl: e.target.value })}
                  variant="outlined"
                  placeholder="https://example.com/book-cover.jpg"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Divider sx={{ mb: 3 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    type="button"
                    variant="outlined"
                    color="secondary"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    disabled={loading}
                    sx={{ 
                      borderRadius: 2, 
                      px: 4, 
                      py: 1.5,
                      fontWeight: 'bold'
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={edit ? <SaveIcon /> : <AddIcon />}
                    disabled={loading}
                    sx={{ 
                      borderRadius: 2, 
                      px: 4, 
                      py: 1.5,
                      fontWeight: 'bold',
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #1976D2 30%, #0288D1 90%)',
                      }
                    }}
                  >
                    {loading ? 'Saving...' : (edit ? 'Update Book' : 'Add Book')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
      
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Box>
  );
}