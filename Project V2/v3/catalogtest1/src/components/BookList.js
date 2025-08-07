import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, TextField, TableSortLabel, TablePagination,
  Grid, Button, Avatar, CircularProgress, Backdrop,
  Dialog, DialogTitle, DialogContent, DialogActions, Typography,
  List, ListItem, ListItemText
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { getBooks, deleteBook } from '../services/bookService';
import axios from 'axios';
import BookDetailModal from './BookDetailModal';

export default function BookList() {
  const { enqueueSnackbar } = useSnackbar();
  const nav = useNavigate();
  const [books, setBooks] = useState([]);
  const [filter, setFilter] = useState('');
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('title');
  const [page, setPage] = useState(0);
  const rowsPerPage = 5;
  const [selectedBook, setSelectedBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  
  // New state for the authors/genres modal
  const [listModalOpen, setListModalOpen] = useState(false);
  const [listModalTitle, setListModalTitle] = useState('');
  const [listModalItems, setListModalItems] = useState([]);
  
  // Fallback image for missing book covers
  const fallbackImage = 'https://via.placeholder.com/40x60?text=No+Cover';

  // Helper function to format a list of authors or genres with a clickable 'more' option
  const formatList = (listString, title) => {
    if (!listString) return null;
    const items = listString.split(',').map(item => item.trim());
    
    // If there are more than 2 items, return a span with a clickable link
    if (items.length > 2) {
      return (
        <span>
          {items.slice(0, 2).join(', ')} 
          <Typography
            component="span"
            onClick={(e) => {
              e.stopPropagation();
              setListModalTitle(title);
              setListModalItems(items);
              setListModalOpen(true);
            }}
            sx={{
              textDecoration: 'underline',
              cursor: 'pointer',
              color: 'primary.main',
              marginLeft: '4px',
              '&:hover': {
                color: 'primary.dark'
              }
            }}
          >
            & {items.length - 2} more
          </Typography>
        </span>
      );
    } 
    // If there are exactly 2 items, join with ' & '
    else if (items.length === 2) {
      return items.join(' & ');
    }
    // For 1 item or other cases, join with ', '
    return items.join(', ');
  };

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getBooks();
      setBooks(r.data);
    } catch (error) {
      console.error("Failed to fetch books:", error);
      enqueueSnackbar("Failed to load books.", { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const filteredBooks = useMemo(() => {
    const text = filter.toLowerCase();
    return books.filter(b => {
      const authorMatch = b.authors ? b.authors.toLowerCase().includes(text) : false;
      const genreMatch = b.genres ? b.genres.toLowerCase().includes(text) : false;
      const titleMatch = b.title ? b.title.toLowerCase().includes(text) : false;
      const yearMatch = b.year ? String(b.year).includes(text) : false;

      return titleMatch || authorMatch || genreMatch || yearMatch;
    });
  }, [books, filter]);

  const sortedBooks = useMemo(() => {
    return [...filteredBooks].sort((a, b) => {
      const x = a[orderBy], y = b[orderBy];
      if (typeof x === 'string' && typeof y === 'string') {
        return order === 'asc' ? x.localeCompare(y) : y.localeCompare(x);
      }
      return order === 'asc' ? (x > y ? 1 : -1) : (x < y ? 1 : -1);
    });
  }, [filteredBooks, order, orderBy]);

  const paginatedBooks = useMemo(() => {
    return sortedBooks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sortedBooks, page, rowsPerPage]);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteBook(id);
      enqueueSnackbar('Book deleted', { variant: 'info' });
      fetchBooks();
    } catch (error) {
      console.error("Error deleting book:", error);
      enqueueSnackbar('Failed to delete book.', { variant: 'error' });
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setBookToDelete(null);
    }
  };

  const openDeleteDialog = (book) => {
    setBookToDelete(book);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setBookToDelete(null);
  };

  const closeListModal = () => {
    setListModalOpen(false);
    setListModalTitle('');
    setListModalItems([]);
  };

  const fetchGoogleBookById = async (googleId) => {
    if (!googleId) return;
    setLoadingDetail(true);
    try {
      const res = await axios.get(`https://www.googleapis.com/books/v1/volumes/${googleId}`);
      setSelectedBook(res.data);
    } catch (err) {
      console.error('Failed to fetch book details:', err);
      enqueueSnackbar('Could not load book details', { variant: 'error' });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = fallbackImage;
  };

  return (
    <>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={12} sm={8}>
          <TextField
            fullWidth
            label="Filter by title, author, genre or year"
            variant="outlined"
            value={filter}
            onChange={e => { setFilter(e.target.value); setPage(0); }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button variant="contained" fullWidth onClick={() => nav('/add')}>
            Add New Book
          </Button>
        </Grid>
      </Grid>

      {loading ? (
        <Grid container justifyContent="center" sx={{ mt: 4 }}>
          <CircularProgress />
        </Grid>
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cover</TableCell>
                {['title', 'authors', 'genres', 'year'].map(c => (
                  <TableCell key={c}>
                    <TableSortLabel
                      active={orderBy === c}
                      direction={order}
                      onClick={() => {
                        const isAsc = orderBy === c && order === 'asc';
                        setOrder(isAsc ? 'desc' : 'asc');
                        setOrderBy(c);
                      }}
                    >
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell>Edit</TableCell>
                <TableCell>Delete</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedBooks.length > 0 ? (
                paginatedBooks.map(bk => (
                  <TableRow
                    key={bk.id}
                    hover
                    onClick={() => fetchGoogleBookById(bk.openLibraryId)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Avatar
                        variant="square"
                        src={bk.coverUrl || fallbackImage}
                        alt={bk.title}
                        sx={{ width: 40, height: 60 }}
                        onError={handleImageError}
                      />
                    </TableCell>
                    <TableCell>{bk.title}</TableCell>
                    <TableCell>{formatList(bk.authors, "Authors")}</TableCell>
                    <TableCell>{formatList(bk.genres, "Genres")}</TableCell>
                    <TableCell>{bk.year}</TableCell>
                    <TableCell>
                      <IconButton
                        onClick={e => {
                          e.stopPropagation();
                          nav(`/edit/${bk.id}`);
                        }}
                      >
                        <Edit />
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="error"
                        onClick={e => {
                          e.stopPropagation();
                          openDeleteDialog(bk);
                        }}
                        disabled={deletingId === bk.id}
                      >
                        {deletingId === bk.id ? <CircularProgress size={20} /> : <Delete />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body1" color="text.secondary">
                      No books found. Try adjusting your filter.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredBooks.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[]}
          />
        </>
      )}

      {/* Authors/Genres List Modal */}
      <Dialog open={listModalOpen} onClose={closeListModal} PaperProps={{ sx: { borderRadius: 4, width: '90%', maxWidth: '400px' } }}>
        <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white' }}>
          {listModalTitle}
        </DialogTitle>
        <DialogContent dividers>
          <List>
            {listModalItems.map((item, index) => (
              <ListItem key={index}>
                <ListItemText primary={item} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ padding: 2 }}>
          <Button onClick={closeListModal} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete "{bookToDelete?.title}" by {bookToDelete?.authors}?
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button 
            onClick={() => handleDelete(bookToDelete.id)} 
            color="error"
            disabled={deletingId !== null}
          >
            {deletingId === bookToDelete?.id ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Backdrop for book details */}
      <Backdrop open={loadingDetail} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <BookDetailModal
        open={!!selectedBook}
        book={selectedBook}
        handleClose={() => setSelectedBook(null)}
      />
    </>
  );
}
