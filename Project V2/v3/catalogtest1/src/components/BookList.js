import React, { useEffect, useState, useCallback, useMemo } from "react";
import { getBooks, deleteBook } from "../services/bookService";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import BookDetailModal from "./BookDetailModal"; // Import the modal component
import '../index.css';

// This component now accepts the 'selectedGenres' prop from App.js
export default function BookListTailwind({ selectedGenres }) {
  const { enqueueSnackbar } = useSnackbar();
  const nav = useNavigate();

  const [books, setBooks] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  
  // Modal state
  const [selectedBook, setSelectedBook] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const rowsPerPage = 9;
  const fallbackImage = "https://via.placeholder.com/400x300?text=No+Cover";

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getBooks();
      const fetchedBooks = r.data.map(book => {
        let genresArray = [];
        if (typeof book.genres === 'string') {
          genresArray = book.genres.split(',').map(g => g.trim());
        }
        return {
          ...book,
          genres: genresArray
        };
      });
      setBooks(fetchedBooks);
    } catch (error) {
      enqueueSnackbar("Failed to load books.", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const filteredBooks = useMemo(() => {
    let currentBooks = books;

    if (selectedGenres && selectedGenres.length > 0) {
      currentBooks = currentBooks.filter(book =>
        Array.isArray(book.genres) && book.genres.some(g => selectedGenres.includes(g))
      );
    }

    const text = filter.toLowerCase();
    return currentBooks.filter((b) => {
      const genreString = Array.isArray(b.genres) ? b.genres.join(', ') : '';
      return [b.title, b.authors, genreString, String(b.year || "")]
        .filter(Boolean)
        .some((f) => f.toLowerCase().includes(text));
    });
  }, [books, selectedGenres, filter]);

  const paginatedBooks = useMemo(() => {
    return filteredBooks.slice(0, (page + 1) * rowsPerPage);
  }, [filteredBooks, page, rowsPerPage]);

  const confirmDelete = (book) => {
    setBookToDelete(book);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!bookToDelete) return;
    setDeletingId(bookToDelete.id);
    try {
      await deleteBook(bookToDelete.id);
      enqueueSnackbar("Book deleted", { variant: "info" });
      fetchBooks();
    } catch (error) {
      enqueueSnackbar("Failed to delete book.", { variant: "error" });
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setBookToDelete(null);
    }
  };

  // Handle book card click to open modal
  const handleBookClick = (book) => {
    // Transform the book data to match the Google Books API format expected by the modal
    const transformedBook = {
      volumeInfo: {
        title: book.title,
        subtitle: book.subtitle || '',
        authors: Array.isArray(book.authors) ? book.authors : [book.authors],
        publisher: book.publisher || '',
        publishedDate: book.year || book.publishedDate || '',
        pageCount: book.pageCount || book.pages || '',
        language: book.language || 'en',
        categories: Array.isArray(book.genres) ? book.genres : [book.genres].filter(Boolean),
        description: book.description || book.summary || '',
        imageLinks: {
          thumbnail: book.coverUrl || fallbackImage
        },
        previewLink: book.openLibraryId || '',
        bookUrl: book.bookUrl || '' // Add bookUrl field for Cloudinary markdown content
      }
    };
    
    setSelectedBook(transformedBook);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedBook(null);
  };

  return (
    <div className="min-h-screen pt-28">
      {/* Search and Add Book Section */}
      <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl shadow-slate-200/50 p-6 mb-8 border border-white/20">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search your library..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm"
            />
          </div>
          
          <button
            onClick={() => nav("/add")}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-indigo-500/25 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add New Book</span>
          </button>
        </div>
        
        {/* Results counter */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Showing <span className="font-semibold text-indigo-600">{paginatedBooks.length}</span> of{' '}
            <span className="font-semibold text-indigo-600">{filteredBooks.length}</span> books
          </p>
          {selectedGenres.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500">Filtered by:</span>
              <div className="flex flex-wrap gap-1">
                {selectedGenres.map(genre => (
                  <span key={genre} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Page Title */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          EXPLORE BOOKS
        </h1>
        <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mx-auto"></div>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: rowsPerPage }).map((_, i) => (
            <div
              key={i}
              className="bg-white/60  rounded-2xl shadow-lg animate-pulse border border-white/20"
            >
              <div className="h-56 bg-gradient-to-br from-slate-200 to-slate-300 rounded-t-2xl"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-200 rounded-lg"></div>
                <div className="h-3 bg-slate-200 rounded-lg w-3/4"></div>
                <div className="flex justify-end space-x-2 mt-4">
                  <div className="h-8 w-12 bg-slate-200 rounded-lg"></div>
                  <div className="h-8 w-16 bg-slate-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedBooks.map((book, index) => (
            <div
              key={book.id}
              className="group bg-white/70 rounded-2xl shadow-lg hover:shadow-2xl border border-white/20 overflow-hidden flex flex-col transition-all duration-300 transform hover:scale-[1.02] hover:rotate-1 cursor-pointer"
              style={{
                animationDelay: `${index * 100}ms`
              }}
              onClick={() => handleBookClick(book)} // Add click handler for the entire card
            >
              <div className="relative w-full h-56 overflow-hidden rounded-t-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
                <img
                  src={book.coverUrl || fallbackImage}
                  alt={book.title}
                  onError={(e) => (e.target.src = fallbackImage)}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Genre badges */}
                {Array.isArray(book.genres) && book.genres.length > 0 && (
                  <div className="absolute top-3 left-3 z-20">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-indigo-600 text-xs font-medium rounded-full">
                      {book.genres[0]}
                    </span>
                  </div>
                )}

                {/* Book type indicator */}
                {book.bookUrl && book.bookUrl.includes('cloudinary.com') && (
                  <div className="absolute top-3 right-3 z-20">
                    <span className="px-2 py-1 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-full flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span>READ</span>
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-5 flex flex-col flex-grow">
                <h3
                  className="text-lg font-bold text-slate-800 mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors duration-200"
                  title={book.title}
                >
                  {book.title}
                </h3>
                <p
                  className="text-sm text-slate-600 mb-3 line-clamp-1"
                  title={book.authors}
                >
                  by {book.authors} • {book.year}
                </p>
                
                <div className="flex-grow"></div>
                
                <div className="flex justify-end items-center space-x-2 mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click when clicking edit
                      nav(`/edit/${book.id}`);
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click when clicking delete
                      confirmDelete(book);
                    }}
                    disabled={deletingId === book.id}
                    className="px-3 py-2 bg-red-100 hover:bg-red-500 text-red-600 hover:text-white text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 group"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>{deletingId === book.id ? "..." : "Delete"}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {paginatedBooks.length < filteredBooks.length && (
        <div className="flex justify-center mt-12">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-8 py-4 bg-white/70 backdrop-blur-lg hover:bg-white/90 text-slate-700 font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border border-white/20 flex items-center space-x-2"
          >
            <span>Load More Books</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* Book Detail Modal */}
      <BookDetailModal
        open={modalOpen}
        handleClose={handleModalClose}
        book={selectedBook}
      />

      {/* Delete Confirmation Modal */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md w-full border border-white/20 transform scale-100 animate-in fade-in duration-200">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Book</h3>
              <p className="text-slate-600 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-slate-800">"{bookToDelete?.title}"</span>? This action cannot be undone.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setDeleteDialogOpen(false)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deletingId !== null}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/25"
                >
                  {deletingId === bookToDelete?.id ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Deleting...</span>
                    </div>
                  ) : (
                    "Delete Book"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}