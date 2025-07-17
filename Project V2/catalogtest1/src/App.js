import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import SearchBooks from './components/SearchBooks';
import BookForm from './components/BookForm';
import BookList from './components/BookList';

export default function App() {
  console.log("App mounted");

  const bgStyle = {
    minHeight: '100vh',
    backgroundImage: `url('/books-bg.jpg')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '64px'
  };
  const containerStyle = {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: '2rem',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '1200px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
  };

  return (
    <Router>
      <NavBar />
      <div style={bgStyle}>
        <div style={containerStyle}>
          <Routes>
            <Route path="/" element={<SearchBooks />} />
            <Route path="/add" element={<BookForm />} />
            <Route path="/mybooks" element={<BookList />} />
            <Route path="/edit/:id" element={<BookForm edit />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
