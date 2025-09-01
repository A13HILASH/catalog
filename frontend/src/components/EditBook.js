import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBook, updateBook } from '../services/bookService';
import { useSnackbar } from 'notistack';

// Import the new custom hooks
import useDescriptionGenerator from './useDescriptionGenerator';
import useImageGenerator from './useImageGenerator';

export default function EditBook() {
  const { enqueueSnackbar } = useSnackbar();
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Helper function to update the book state from the hooks
  const updateBookState = (name, value) => {
    setBook(prev => ({ ...prev, [name]: value }));
  };

  // Use the custom hooks to handle AI generation and state.
  // We'll initialize them after the book data is fetched.
  const {
    description,
    generatingDescription,
    generateDescription,
    refineDescription,
    handleDescriptionUndo,
    handleDescriptionRedo,
    historyIndex,
    descriptionHistoryLength,
    handleUpdateDescription,
    setDescriptionHistory,
    setHistoryIndex
  } = useDescriptionGenerator(book?.description, updateBookState);

  const {
    generatingCover,
    generateCover,
    undoImage,
    redoImage,
    imageHistoryIndex,
    imageHistoryLength,
    setImageHistory,
    setImageHistoryIndex
  } = useImageGenerator(book?.coverUrl, updateBookState);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await getBook(id);
        const bookData = response.data;
        
        // Convert arrays to comma-separated strings for form inputs
        const processedBook = {
          ...bookData,
          authors: Array.isArray(bookData.authors) ? bookData.authors.join(', ') : bookData.authors || '',
          genres: Array.isArray(bookData.genres) ? bookData.genres.join(', ') : bookData.genres || '',
          moods: Array.isArray(bookData.moods) ? bookData.moods.join(', ') : bookData.moods || '',
          description: bookData.description || '',
          coverUrl: bookData.coverUrl || '',
          openLibraryId: bookData.openLibraryId || '',
          year: bookData.year || ''
        };
        
        setBook(processedBook);
        
        // Initialize description history with the fetched description
        setDescriptionHistory([processedBook.description]);
        setHistoryIndex(0);

        // Initialize image history with the fetched coverUrl if it exists
        if (processedBook.coverUrl) {
          setImageHistory([processedBook.coverUrl]);
          setImageHistoryIndex(0);
        } else {
          setImageHistory([]);
          setImageHistoryIndex(-1);
        }

      } catch (error) {
        console.error("Error fetching book:", error);
        enqueueSnackbar('Failed to load book.', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id, enqueueSnackbar, setDescriptionHistory, setHistoryIndex, setImageHistory, setImageHistoryIndex]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'description') {
      // The description hook handles its own state updates
      handleUpdateDescription(value);
    } else {
      updateBookState(name, value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!book) return;
    setSubmitting(true);
    
    // Create the payload matching the exact Swagger API specification
    const bookDataToUpdate = {
      title: book.title || '',
      authors: book.authors || '',
      genres: book.genres || '',
      moods: book.moods || '',
      year: book.year ? parseInt(book.year) : 0,
      coverUrl: book.coverUrl || '',
      openLibraryId: book.openLibraryId || '',
      description: description || '', // Use the description from the hook
    };
    
    try {
      await updateBook(id, bookDataToUpdate);
      enqueueSnackbar('Book updated successfully!', { variant: 'success' });
      navigate('/mybooks');
    } catch (error) {
      console.error("Error updating book:", error);
      enqueueSnackbar('Failed to update book.', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex justify-center items-center pt-20">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-600 animate-spin animation-delay-150"></div>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Loading Book Details
          </h2>
          <p className="text-slate-600">Please wait while we fetch your book...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex justify-center items-center pt-20">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Book Not Found</h2>
          <p className="text-slate-600 mb-6">The book you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/mybooks')}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
          >
            Back to My Books
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pt-20 pb-12">
      <div className="max-w-7xl mx-auto p-6">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            EDIT BOOK
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Update your book details and enhance with AI-powered tools
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Description Tools */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 p-6 border border-white/20 h-fit">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Description Studio</h2>
              </div>
              
              <div className="space-y-4">
                <label className="block text-slate-700 text-sm font-semibold mb-2" htmlFor="description">
                  Book Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  value={description}
                  onChange={handleChange}
                  rows="8"
                  className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm resize-none"
                  placeholder="Enter book description or generate with AI..."
                ></textarea>
                
                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleDescriptionUndo}
                    disabled={historyIndex === 0 || generatingDescription}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span>Undo</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDescriptionRedo}
                    disabled={historyIndex === descriptionHistoryLength - 1 || generatingDescription}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6" />
                    </svg>
                    <span>Redo</span>
                  </button>
                </div>
                
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => generateDescription(book)}
                    disabled={generatingDescription || !book.title}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-green-500/25"
                  >
                    {generatingDescription ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Generate Description</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={refineDescription}
                    disabled={generatingDescription || !description}
                    className="w-full px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-yellow-500/25"
                  >
                    {generatingDescription ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Refining...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        <span>Refine Description</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Main Form */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-white/20">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Book Details</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {[
                  { name: 'title', label: 'Book Title', type: 'text', required: true, placeholder: 'Enter the book title...' },
                  { name: 'authors', label: 'Authors', type: 'text', required: false, placeholder: 'Author names (comma separated)' },
                  { name: 'genres', label: 'Genres', type: 'text', required: false, placeholder: 'Fiction, Mystery, Romance...' },
                  { name: 'moods', label: 'Moods', type: 'text', required: false, placeholder: 'Dark, Humorous, Inspiring...' },
                  { name: 'year', label: 'Publication Year', type: 'number', required: false, placeholder: '2024' },
                  { name: 'openLibraryId', label: 'Open Library ID', type: 'text', required: false, placeholder: 'OL123456M' }
                ].map((field, index) => (
                  <div key={field.name} style={{ animationDelay: `${index * 100}ms` }}>
                    <label className="block text-slate-700 text-sm font-semibold mb-2" htmlFor={field.name}>
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type={field.type}
                      id={field.name}
                      name={field.name}
                      value={book[field.name] || ''}
                      onChange={handleChange}
                      required={field.required}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm"
                    />
                  </div>
                ))}

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={submitting || generatingDescription || generatingCover}
                    className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Updating Book...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Update Book</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right: Cover Generator */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 p-6 border border-white/20 h-fit">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Cover Studio</h2>
              </div>
              
              {/* Cover Preview */}
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-4 mb-6 flex items-center justify-center min-h-[300px] border-2 border-dashed border-slate-300">
                {book.coverUrl ? (
                  <div className="relative group">
                    <img 
                      src={book.coverUrl} 
                      alt="Book Cover" 
                      className="max-h-[280px] max-w-[200px] object-cover rounded-xl shadow-2xl transition-transform duration-300 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                ) : (
                  <div className="text-center text-slate-500">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">No cover generated yet</p>
                    <p className="text-xs mt-1">Generate or upload a cover image</p>
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <button
                onClick={() => generateCover(book)}
                disabled={generatingCover || !book.title || !book.authors}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4 flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/25"
              >
                {generatingCover ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating Cover...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Generate Cover</span>
                  </>
                )}
              </button>

              {/* Undo/Redo Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={undoImage}
                  disabled={imageHistoryIndex <= 0}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <span>Undo</span>
                </button>
                <button
                  onClick={redoImage}
                  disabled={imageHistoryIndex >= imageHistoryLength - 1}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6" />
                  </svg>
                  <span>Redo</span>
                </button>
              </div>

              {/* Manual URL Input */}
              <div>
                <label className="block text-slate-700 text-sm font-semibold mb-2" htmlFor="coverUrl">
                  Cover Image URL
                </label>
                <input
                  type="text"
                  id="coverUrl"
                  name="coverUrl"
                  value={book.coverUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/cover.jpg"
                  className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}