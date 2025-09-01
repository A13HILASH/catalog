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
  const [book, setBook] = useState({ 
    title: '', 
    authors: '', 
    genres: '', 
    year: 0, 
    coverUrl: '' 
  });
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

    // Function to sanitize the input string, replacing " and " with "," and trimming whitespace.
    const sanitizeInput = (inputString) => {
      if (!inputString) return '';
      return inputString
        .replace(/\s+and\s+/gi, ',') // Replace " and " with a comma, case-insensitive
        .split(',')
        .map(item => item.trim()) // Trim whitespace from each item
        .filter(item => item.length > 0) // Remove any empty strings
        .join(', ');
    };

    try {
      const bookToSave = {
        ...book,
        // Sanitize the author and genre strings before sending to the backend
        authors: sanitizeInput(book.authors),
        genres: sanitizeInput(book.genres),
      };

      if (edit) {
        await updateBook(book.id, bookToSave);
        enqueueSnackbar('Book updated successfully!', { variant: 'success' });
      } else {
        await addBook(bookToSave);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pt-24 pb-12">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          {edit ? 'EDIT BOOK' : 'ADD NEW BOOK'}
        </h1>
        <div className="w-32 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mx-auto mb-4"></div>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto">
          {edit ? 'Update your book details with our modern form' : 'Add a new book to your collection with style'}
        </p>
      </div>

      <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
        <Card 
          elevation={0}
          sx={{ 
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'visible'
          }}
        >
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box 
                    sx={{ 
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      background: edit 
                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' 
                        : 'linear-gradient(135deg, #10b981, #059669)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 3,
                      boxShadow: edit
                        ? '0 10px 25px rgba(99, 102, 241, 0.25)'
                        : '0 10px 25px rgba(16, 185, 129, 0.25)'
                    }}
                  >
                    {edit ? <EditIcon sx={{ color: 'white', fontSize: 24 }} /> : <AddIcon sx={{ color: 'white', fontSize: 24 }} />}
                  </Box>
                  <Box>
                    <Typography 
                      variant="h4" 
                      component="div" 
                      sx={{ 
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #1e293b, #475569)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        color: 'transparent',
                        marginBottom: 0.5
                      }}
                    >
                      {edit ? 'Edit Book' : 'Add New Book'}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#64748b',
                        fontWeight: 500
                      }}
                    >
                      {edit ? 'Update the book details below' : 'Fill in the details to add a new book to your collection'}
                    </Typography>
                  </Box>
                </Box>
                
                <IconButton 
                  onClick={handleCancel} 
                  aria-label="cancel"
                  sx={{
                    width: 48,
                    height: 48,
                    backgroundColor: 'rgba(148, 163, 184, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(148, 163, 184, 0.2)',
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.2s'
                  }}
                >
                  <ArrowBackIcon sx={{ color: '#64748b' }} />
                </IconButton>
              </Box>
            }
            sx={{
              padding: 4,
              paddingBottom: 2
            }}
          />
          
          <Divider sx={{ opacity: 0.1, marginX: 4 }} />
          
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={4}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Book Title"
                    value={book.title}
                    onChange={e => setBook({ ...book, title: e.target.value })}
                    required
                    variant="outlined"
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: '16px',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#6366f1',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#6366f1',
                          borderWidth: '2px',
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: '#64748b',
                        fontWeight: 600,
                        '&.Mui-focused': {
                          color: '#6366f1'
                        }
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Authors (comma-separated)"
                    value={book.authors}
                    onChange={e => setBook({ ...book, authors: e.target.value })}
                    required
                    variant="outlined"
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: '16px',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8b5cf6',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8b5cf6',
                          borderWidth: '2px',
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: '#64748b',
                        fontWeight: 600,
                        '&.Mui-focused': {
                          color: '#8b5cf6'
                        }
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Genres (comma-separated)"
                    value={book.genres}
                    onChange={e => setBook({ ...book, genres: e.target.value })}
                    required
                    variant="outlined"
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: '16px',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#ec4899',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#ec4899',
                          borderWidth: '2px',
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: '#64748b',
                        fontWeight: 600,
                        '&.Mui-focused': {
                          color: '#ec4899'
                        }
                      }
                    }}
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
                    inputProps={{ min: 1800, max: new Date().getFullYear() }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: '16px',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#10b981',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#10b981',
                          borderWidth: '2px',
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: '#64748b',
                        fontWeight: 600,
                        '&.Mui-focused': {
                          color: '#10b981'
                        }
                      }
                    }}
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
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: '16px',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#f59e0b',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#f59e0b',
                          borderWidth: '2px',
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: '#64748b',
                        fontWeight: 600,
                        '&.Mui-focused': {
                          color: '#f59e0b'
                        }
                      }
                    }}
                  />
                </Grid>
                
                {/* Cover Preview */}
                {book.coverUrl && (
                  <Grid item xs={12}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      p: 3,
                      backgroundColor: 'rgba(248, 250, 252, 0.8)',
                      borderRadius: '16px',
                      border: '2px dashed rgba(148, 163, 184, 0.3)'
                    }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="subtitle2" sx={{ color: '#64748b', marginBottom: 2, fontWeight: 600 }}>
                          Cover Preview
                        </Typography>
                        <img
                          src={book.coverUrl}
                          alt="Book Cover Preview"
                          style={{
                            maxHeight: '200px',
                            maxWidth: '150px',
                            objectFit: 'cover',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                            border: '2px solid rgba(255, 255, 255, 0.5)'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </Box>
                    </Box>
                  </Grid>
                )}
                
                <Grid item xs={12} sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 4, opacity: 0.1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <Button
                      type="button"
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={handleCancel}
                      disabled={loading}
                      sx={{ 
                        borderRadius: '16px',
                        px: 4,
                        py: 2,
                        fontWeight: 'bold',
                        textTransform: 'none',
                        fontSize: '16px',
                        borderColor: '#e2e8f0',
                        color: '#64748b',
                        backgroundColor: 'rgba(248, 250, 252, 0.8)',
                        backdropFilter: 'blur(10px)',
                        border: '2px solid rgba(226, 232, 240, 0.5)',
                        '&:hover': {
                          borderColor: '#cbd5e1',
                          backgroundColor: 'rgba(241, 245, 249, 0.9)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={edit ? <SaveIcon /> : <AddIcon />}
                      disabled={loading}
                      sx={{ 
                        borderRadius: '16px',
                        px: 6,
                        py: 2,
                        fontWeight: 'bold',
                        textTransform: 'none',
                        fontSize: '16px',
                        background: edit 
                          ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' 
                          : 'linear-gradient(135deg, #10b981, #059669)',
                        boxShadow: edit
                          ? '0 10px 25px rgba(99, 102, 241, 0.25)'
                          : '0 10px 25px rgba(16, 185, 129, 0.25)',
                        '&:hover': {
                          background: edit
                            ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                            : 'linear-gradient(135deg, #059669, #047857)',
                          transform: 'translateY(-2px)',
                          boxShadow: edit
                            ? '0 20px 40px rgba(99, 102, 241, 0.4)'
                            : '0 20px 40px rgba(16, 185, 129, 0.4)'
                        },
                        '&:disabled': {
                          background: 'linear-gradient(135deg, #94a3b8, #64748b)',
                          opacity: 0.6
                        },
                        transition: 'all 0.2s ease-in-out',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {loading ? (
                        <>
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              border: '2px solid rgba(255, 255, 255, 0.3)',
                              borderTop: '2px solid white',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite',
                              marginRight: 1,
                              '@keyframes spin': {
                                '0%': { transform: 'rotate(0deg)' },
                                '100%': { transform: 'rotate(360deg)' }
                              }
                            }}
                          />
                          Saving...
                        </>
                      ) : (
                        edit ? 'Update Book' : 'Add Book'
                      )}
                      
                      {/* Animated background effect */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                          transition: 'left 0.6s',
                          '&:hover': {
                            left: '100%'
                          }
                        }}
                      />
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
        
        {/* Floating elements for visual appeal */}
        <Box
          sx={{
            position: 'fixed',
            top: '20%',
            right: '10%',
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            opacity: 0.1,
            animation: 'float 6s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(-20px)' }
            },
            zIndex: 0
          }}
        />
        <Box
          sx={{
            position: 'fixed',
            bottom: '20%',
            left: '10%',
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            opacity: 0.1,
            animation: 'float 8s ease-in-out infinite reverse',
            zIndex: 0
          }}
        />
        <Box
          sx={{
            position: 'fixed',
            top: '40%',
            left: '5%',
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ec4899, #be185d)',
            opacity: 0.05,
            animation: 'float 10s ease-in-out infinite',
            zIndex: 0
          }}
        />
      </Box>
    </div>
  );
}