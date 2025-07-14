import React, { useEffect, useState } from 'react';
import { getBooks, addBook, updateBook, deleteBook } from './services/bookService';
import BookList from './components/BookList';
import BookForm from './components/BookForm';
import CohereChatbot from './chatbot/CohereChatbot';
import './App.css';

function App() {
  const [books, setBooks] = useState([]);
  const [currentBook, setCurrentBook] = useState(null);
  const [search, setSearch] = useState("");

  const loadBooks = async () => {
    const res = await getBooks();
    setBooks(res.data);
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const handleSave = async (book) => {
    if (book.id) {
      await updateBook(book.id, book);
    } else {
      await addBook(book);
    }
    setCurrentBook(null);
    loadBooks();
  };

  const handleDelete = async (id) => {
    await deleteBook(id);
    loadBooks();
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container main-layout">
      {/* Left: Chatbot */}
      <CohereChatbot books={books} loadBooks={loadBooks} />

      {/* Right: Book form + list */}
      <div className="right-panel">
        <h1>Book Catalog</h1>

        <input
          type="text"
          placeholder="Search by title"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-box"
        />

        <BookForm onSave={handleSave} currentBook={currentBook} />
        <BookList books={filteredBooks} onEdit={setCurrentBook} onDelete={handleDelete} />
      </div>
    </div>
  );
}

export default App;
