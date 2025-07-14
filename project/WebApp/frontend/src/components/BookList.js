import React from 'react';
import './BookList.css';

export default function BookList({ books, onEdit, onDelete }) {
  return (
    <ul className="book-list">
      {books.map(book => (
        <li key={book.id} className="book-item">
          <div>
            <strong>{book.title}</strong> by {book.author} ({book.year})
          </div>
          <div>
            <button onClick={() => onEdit(book)}>Edit</button>
            <button onClick={() => onDelete(book.id)}>Delete</button>
          </div>
        </li>
      ))}
    </ul>
  );
}