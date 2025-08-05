import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, TextField, TableSortLabel, TablePagination,
  Grid, Button, Avatar, CircularProgress, Backdrop,
  Dialog, DialogTitle, DialogContent, DialogActions, Typography
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
  
  // Fallback image for missing book covers
  const fallbackImage = 'https://via.placeholder.com/40x60?text=No+Cover';

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

  // Memoize filtered, sorted, and paginated data
  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const text = filter.toLowerCase();
      return (
        b.title.toLowerCase().includes(text) ||
        b.author.toLowerCase().includes(text) ||
        b.genre.toLowerCase().includes(text) ||
        String(b.year).includes(text)
      );
    });
  }, [books, filter]);

  const sortedBooks = useMemo(() => {
    return [...filteredBooks].sort((a, b) => {
      const x = a[orderBy], y = b[orderBy];
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
                {['title', 'author', 'genre', 'year'].map(c => (
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
                    <TableCell>{bk.author}</TableCell>
                    <TableCell>{bk.genre}</TableCell>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete "{bookToDelete?.title}" by {bookToDelete?.author}?
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