import React, { useEffect, useState, useCallback, useMemo } from "react";
import { getBooks, deleteBook } from "../services/bookService";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import '../index.css';

export default function BookListTailwind() {
  const { enqueueSnackbar } = useSnackbar();
  const nav = useNavigate();

  const [books, setBooks] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);

  const rowsPerPage = 9;
  const fallbackImage = "https://via.placeholder.com/400x300?text=No+Cover";

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getBooks();
      setBooks(r.data);
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
    const text = filter.toLowerCase();
    return books.filter((b) =>
      [b.title, b.authors, b.genres, String(b.year || "")]
        .filter(Boolean)
        .some((f) => f.toLowerCase().includes(text))
    );
  }, [books, filter]);

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

  return (
    // Main container with a clean background color.
    <div className="bg-white dark:bg-gray-900 transition-colors">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search books..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={() => nav("/add")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
        >
          Add New Book
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">EXPLORE BOOKS</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: rowsPerPage }).map((_, i) => (
            <div
              key={i}
              className="h-80 bg-gray-200 dark:bg-gray-700 animate-pulse"
            ></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedBooks.map((book) => (
            <div
              key={book.id}
              className="bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
            >
              <div className="relative w-full h-48 sm:h-56 overflow-hidden">
                <img
                  src={book.coverUrl || fallbackImage}
                  alt={book.title}
                  onError={(e) => (e.target.src = fallbackImage)}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300"
                />
              </div>
              
              <div className="p-4 flex flex-col flex-grow">
                <h3
                  className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate mb-1"
                  title={book.title}
                >
                  {book.title}
                </h3>
                <p
                  className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2"
                  title={book.authors}
                >
                  {book.authors} ({book.year})
                </p>
                <div className="flex-grow"></div> 
                
                <div className="flex justify-end items-center mt-4">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        nav(`/edit/${book.id}`);
                      }}
                      className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(book);
                      }}
                      disabled={deletingId === book.id}
                      className="px-3 py-1 text-xs border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === book.id ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {paginatedBooks.length < filteredBooks.length && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium transition"
          >
            Load More
          </button>
        </div>
      )}

      {deleteDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 shadow-lg p-6 max-w-sm w-full border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Confirm Deletion</h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{bookToDelete?.title}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deletingId !== null}
                className="px-4 py-2 border border-red-500 bg-red-500 hover:bg-red-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {deletingId === bookToDelete?.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
