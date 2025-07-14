import React, { useState, useEffect } from 'react';
import './BookForm.css';

export default function BookForm({ onSave, currentBook }) {
  const [book, setBook] = useState({ title: '', author: '', year: '' });

  useEffect(() => {
    if (currentBook) setBook(currentBook);
  }, [currentBook]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(book);
    setBook({ title: '', author: '', year: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="book-form">
      <input value={book.title} onChange={e => setBook({ ...book, title: e.target.value })} placeholder="Title" />
      <input value={book.author} onChange={e => setBook({ ...book, author: e.target.value })} placeholder="Author" />
      <input type="number" value={book.year} onChange={e => setBook({ ...book, year: parseInt(e.target.value) })} placeholder="Year" />
      <button type="submit">Save</button>
    </form>
  );
}
