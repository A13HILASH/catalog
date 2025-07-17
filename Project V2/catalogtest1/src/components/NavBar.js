import React from 'react';
import { AppBar, Toolbar, Button } from '@mui/material';
import { Link } from 'react-router-dom';

export default function NavBar() {
  return (
    <AppBar position="fixed">
      <Toolbar>
        <Button color="inherit" component={Link} to="/">Search</Button>
        <Button color="inherit" component={Link} to="/add">Add Book</Button>
        <Button color="inherit" component={Link} to="/mybooks">My Books</Button>
      </Toolbar>
    </AppBar>
  );
}
