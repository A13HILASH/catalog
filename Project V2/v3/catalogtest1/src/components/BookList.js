import React, { useEffect, useState, useCallback } from 'react'; // Added useCallback
import {
  Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, TextField, TableSortLabel, TablePagination, Grid, Button
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { getBooks, deleteBook } from '../services/bookService';

export default function BookList() {
  const { enqueueSnackbar } = useSnackbar();
  const nav = useNavigate();
  const [books, setBooks] = useState([]);
  const [filter, setFilter] = useState('');
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('title');
  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  // Wrapped getBooks fetch in a useCallback for stability in useEffect dependency
  const fetchBooks = useCallback(async () => {
    try {
      const r = await getBooks();
      setBooks(r.data);
    } catch (error) {
      console.error("Failed to fetch books:", error);
      enqueueSnackbar("Failed to load books.", { variant: 'error' });
    }
  }, [enqueueSnackbar]); // enqueueSnackbar is a dependency here

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]); // Now fetchBooks is a dependency

  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(filter.toLowerCase()) ||
    b.author.toLowerCase().includes(filter.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const x = a[orderBy], y = b[orderBy];
    return order === 'asc' ? (x > y ? 1 : -1) : (x < y ? 1 : -1);
  });

  const paginated = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleDelete = async (id) => {
    try {
      await deleteBook(id);
      enqueueSnackbar('Book deleted', { variant: 'info' });
      fetchBooks(); // Re-fetch books after deletion
    } catch (error) {
      console.error("Error deleting book:", error);
      enqueueSnackbar('Failed to delete book.', { variant: 'error' });
    }
  };

  return (
    <>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={12} sm={8}>
          <TextField
            fullWidth
            label="Filter by title or author"
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

      <Table>
        <TableHead>
          <TableRow>
            {['title','author','genre','year'].map(c => (
              <TableCell key={c}>
                <TableSortLabel
                  active={orderBy===c} direction={order}
                  onClick={() => {
                    const isAsc = orderBy===c && order==='asc';
                    setOrder(isAsc ? 'desc' : 'asc');
                    setOrderBy(c);
                  }}>
                  {c.charAt(0).toUpperCase()+c.slice(1)}
                </TableSortLabel>
              </TableCell>
            ))}
            <TableCell>Edit</TableCell>
            <TableCell>Delete</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginated.map(bk => (
            <TableRow key={bk.id}>
              <TableCell>{bk.title}</TableCell>
              <TableCell>{bk.author}</TableCell>
              <TableCell>{bk.genre}</TableCell>
              <TableCell>{bk.year}</TableCell>
              <TableCell><IconButton onClick={() => nav(`/edit/${bk.id}`)}><Edit /></IconButton></TableCell>
              <TableCell><IconButton color="error" onClick={() => handleDelete(bk.id)}><Delete /></IconButton></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TablePagination
        component="div" count={filtered.length} page={page}
        onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} rowsPerPageOptions={[]}
      />
    </>
  );
}