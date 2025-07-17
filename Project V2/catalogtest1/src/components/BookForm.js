import React, { useEffect, useState } from 'react';
import { TextField, Button, Grid } from '@mui/material';
import { addBook, getBooks, updateBook } from '../services/bookService';
import { useSnackbar } from 'notistack';
import { useNavigate, useParams } from 'react-router-dom';

export default function BookForm({ edit }) {
  const { enqueueSnackbar } = useSnackbar();
  const nav = useNavigate();
  const { id } = useParams();
  const [book, setBook] = useState({ title:'', author:'', genre:'', year:0, coverUrl:'' });

  useEffect(() => {
    async function fetchBookForEdit() { // Define an async function inside useEffect
      if (edit && id) {
        try {
          const res = await getBooks();
          const b = res.data.find(x => x.id === +id);
          if (b) {
            setBook(b);
          } else {
            enqueueSnackbar('Book not found!', { variant: 'error' });
            nav('/mybooks'); // Redirect if book not found
          }
        } catch (error) {
          console.error("Failed to fetch book for edit:", error);
          enqueueSnackbar('Failed to load book for editing.', { variant: 'error' });
        }
      }
    }
    fetchBookForEdit(); // Call the async function immediately
  }, [edit, id, nav, enqueueSnackbar]); // Add nav and enqueueSnackbar to dependencies as they are external dependencies

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (edit) {
        await updateBook(book.id, book);
        enqueueSnackbar('Updated', { variant: 'info' });
      } else {
        await addBook(book);
        enqueueSnackbar('Added', { variant: 'success' });
      }
      nav('/mybooks');
    } catch (error) {
      console.error("Failed to save book:", error);
      enqueueSnackbar('Failed to save book.', { variant: 'error' });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        {['title','author','genre','coverUrl'].map(f => (
          <Grid item xs={12} md={6} key={f}>
            <TextField fullWidth label={f.charAt(0).toUpperCase() + f.slice(1)}
              value={book[f]} onChange={e => setBook({ ...book, [f]: e.target.value })} />
          </Grid>
        ))}
        <Grid item xs={12} md={6}>
          <TextField fullWidth type="number" label="Year"
            value={book.year} onChange={e => setBook({ ...book, year: parseInt(e.target.value)||0 })} />
        </Grid>
        <Grid item xs={12}>
          <Button type="submit" variant="contained" color="primary">{edit ? 'Update' : 'Add'} Book</Button>
        </Grid>
      </Grid>
    </form>
  );
}