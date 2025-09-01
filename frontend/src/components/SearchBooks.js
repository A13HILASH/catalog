import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import FloatingChatbot from './FloatingChatbot';
import { addBook, getBooks } from '../services/bookService';
import {
  Search as SearchIcon,
  Info as InfoIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  AutoAwesome as AutoAwesomeIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Book as BookIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  LibraryBooks as LibraryBooksIcon,
  LocalLibrary as LocalLibraryIcon
} from '@mui/icons-material';

const genreOptions = [
  'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery',
  'Thriller', 'Romance', 'Historical Fiction', 'Biography', 'Autobiography',
  'Self-Help', 'Horror', 'Young Adult', 'Children\'s', 'Poetry', 'Drama',
  'Adventure', 'Crime', 'Science', 'History', 'Philosophy'
];

const moodOptions = [
  'Happy', 'Sad', 'Exciting', 'Relaxing', 'Thoughtful', 'Funny',
  'Scary', 'Romantic', 'Inspiring', 'Dark', 'Uplifting', 'Melancholic',
  'Adventurous', 'Mysterious', 'Nostalgic', 'Hopeful'
];

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index} className={value === index ? 'block' : 'hidden'}>
    {value === index && <div className="p-0">{children}</div>}
  </div>
);

export default function SearchBooks() {
  const { enqueueSnackbar } = useSnackbar();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [myBooks, setMyBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [genreFilter, setGenreFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const timeoutRef = useRef(null);

  // AI Recommendation states
  const [recommendationQuery, setRecommendationQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Fallback image for missing book covers
  const fallbackImage = 'https://via.placeholder.com/180x250?text=No+Cover';

  const loadMyBooks = useCallback(async () => {
    try {
      const response = await getBooks();
      setMyBooks(response.data);
    } catch (error) {
      console.error("Error loading My Books:", error);
      enqueueSnackbar("Failed to load your books.", { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    loadMyBooks();
  }, [loadMyBooks]);

  // Debounce search input
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  const search = async (page = 1) => {
    if (!debouncedQuery && !genreFilter && !authorFilter) return;

    setLoading(true);
    try {
      let searchQuery = debouncedQuery;

      // Add filters to the search query
      if (authorFilter) {
        searchQuery += `+inauthor:${authorFilter}`;
      }
      if (genreFilter) {
        searchQuery += `+subject:${genreFilter}`;
      }

      const startIndex = (page - 1) * itemsPerPage;
      const res = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&startIndex=${startIndex}&maxResults=${itemsPerPage}`
      );

      setResults(res.data.items || []);
      setTotalResults(res.data.totalItems || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error searching Google Books:", error);
      enqueueSnackbar("Failed to search Google Books.", { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debouncedQuery || genreFilter || authorFilter) {
      search(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, genreFilter, authorFilter]);

  const handlePageChange = (_, page) => {
    search(page);
  };

  const handleAdd = async (v) => {
    const exists = myBooks.find(b => b.openLibraryId === v.id);
    if (exists) {
      enqueueSnackbar('Already in My Books', { variant: 'warning' });
      return;
    }
    const vol = v.volumeInfo;
    try {
      await addBook({
        openLibraryId: v.id,
        title: vol.title,
        authors: (vol.authors || []).join(', '),
        genres: (vol.categories || []).map(category =>
          category.replace(/\s*&\s*/g, ', ')
        ).join(', '),
        year: parseInt(vol.publishedDate || '0'),
        coverUrl: vol.imageLinks?.thumbnail
      });
      enqueueSnackbar('Book added successfully!', { variant: 'success' });
      setResults(prev => prev.filter(x => x.id !== v.id));
      loadMyBooks();
    } catch (error) {
      console.error("Error adding book:", error);
      enqueueSnackbar('Failed to add book.', { variant: 'error' });
    }
  };

  const openDetails = (book) => {
    setSelectedBook(book);
  };

  const closeDetails = () => {
    setSelectedBook(null);
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = fallbackImage;
  };

  // AI Recommendation function
  const handleGetRecommendations = async () => {
    if (!recommendationQuery.trim() && !selectedGenre && !selectedMood) {
      enqueueSnackbar('Please provide at least one preference', { variant: 'warning' });
      return;
    }
    setLoadingRecommendations(true);
    try {
      const prompt = `I'm looking for book recommendations with the following preferences:
        ${selectedGenre ? `Genre: ${selectedGenre}` : ''}
        ${selectedMood ? `Mood: ${selectedMood}` : ''}
        ${recommendationQuery ? `Additional details: ${recommendationQuery}` : ''}
        
        Please recommend 5 books that match these preferences. For each book, provide:
        1. Title
        2. Author
        3. Brief description (1-2 sentences)
        4. Main genre
        
        Format your response as a JSON array with objects containing: title, author, description, genre.
      `;
      const response = await axios.post(
        'https://api.cohere.ai/v1/generate',
        {
          model: 'command',
          prompt: prompt,
          max_tokens: 800,
          temperature: 0.7,
          k: 0,
          stop_sequences: [],
          return_likelihoods: 'NONE'
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_COHERE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      // Extract the JSON from the response
      const generatedText = response.data.generations[0].text;
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const recommendationsData = JSON.parse(jsonMatch[0]);
        setRecommendations(recommendationsData);
      } else {
        // Fallback if JSON parsing fails
        const fallbackRecommendations = [
          {
            title: "The Great Gatsby",
            author: "F. Scott Fitzgerald",
            description: "A classic novel about the American Dream set in the Jazz Age.",
            genre: "Fiction"
          },
          {
            title: "To Kill a Mockingbird",
            author: "Harper Lee",
            description: "A powerful story of racial injustice and childhood innocence.",
            genre: "Fiction"
          }
        ];
        setRecommendations(fallbackRecommendations);
        enqueueSnackbar('Using fallback recommendations', { variant: 'info' });
      }
    } catch (error) {
      console.error("Error getting recommendations:", error);
      enqueueSnackbar('Failed to get recommendations. Please try again.', { variant: 'error' });

      // Fallback recommendations
      const fallbackRecommendations = [
        {
          title: "The Great Gatsby",
          author: "F. Scott Fitzgerald",
          description: "A classic novel about the American Dream set in the Jazz Age.",
          genre: "Fiction"
        },
        {
          title: "To Kill a Mockingbird",
          author: "Harper Lee",
          description: "A powerful story of racial injustice and childhood innocence.",
          genre: "Fiction"
        }
      ];
      setRecommendations(fallbackRecommendations);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleSearchRecommendedBook = (title, author) => {
    setQuery(`${title} ${author}`);
    setGenreFilter('');
    setAuthorFilter('');
    setTabValue(0); // Switch to search tab
    // This will trigger the debounced search automatically
  };

  const clearFilters = () => {
    setQuery('');
    setGenreFilter('');
    setAuthorFilter('');
    setResults([]);
    setTotalResults(0);
  };

  const clearRecommendations = () => {
    setRecommendationQuery('');
    setSelectedGenre('');
    setSelectedMood('');
    setRecommendations([]);
  };

  const handleTabChange = (_, newValue) => {
    setTabValue(newValue);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 min-h-screen pt-4 pb-8 container mx-auto px-4 lg:px-8">
      {/* Header Section */}
      <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl shadow-slate-200/50 p-6 mb-8 border border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <LocalLibraryIcon className="mr-2 text-3xl text-indigo-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Book Catalogue
            </h1>
          </div>
          <div className="relative">
            <span className="absolute -top-3 -right-3 inline-flex items-center justify-center px-3 py-1 text-xs font-bold leading-none text-white bg-indigo-500 rounded-full shadow-md">
              {myBooks.length}
            </span>
            <div className="flex items-center bg-indigo-100 px-4 py-2 rounded-xl border border-indigo-200">
              <LibraryBooksIcon className="mr-2 text-xl text-indigo-600" />
              <span className="text-sm text-indigo-700 font-semibold">My Books</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for navigation */}
      <div className="bg-white/70 backdrop-blur-lg mb-8 rounded-2xl overflow-hidden border border-white/20 shadow-xl shadow-slate-200/50">
        <div className="flex">
          <button
            className={`flex-1 flex items-center justify-center p-5 font-medium text-sm transition-all duration-300 ${tabValue === 0 ? 'text-indigo-600 bg-indigo-50/50 border-b-2 border-indigo-600' : 'text-slate-600 hover:bg-slate-50/50'}`}
            onClick={() => handleTabChange(null, 0)}
          >
            <SearchIcon className="mr-2 text-lg" />
            Search Books
          </button>
          <button
            className={`flex-1 flex items-center justify-center p-5 font-medium text-sm transition-all duration-300 ${tabValue === 1 ? 'text-indigo-600 bg-indigo-50/50 border-b-2 border-indigo-600' : 'text-slate-600 hover:bg-slate-50/50'}`}
            onClick={() => handleTabChange(null, 1)}
          >
            <AutoAwesomeIcon className="mr-2 text-lg" />
            AI Recommendations
          </button>
        </div>
      </div>

      {/* Search Tab */}
      <TabPanel value={tabValue} index={0}>
        {/* Search Section */}
        <div className="bg-white/70 backdrop-blur-lg p-6 mb-8 rounded-2xl border border-white/20 shadow-xl shadow-slate-200/50">
          <h2 className="text-2xl font-bold text-slate-800 mb-1">
            Discover Your Next Favorite Book
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Search by title, author, or keywords to find the perfect book
          </p>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="col-span-12 md:col-span-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="text-slate-400 text-lg" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-10 py-3 text-sm rounded-xl bg-white/80 border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm"
                  placeholder="Search books, authors, or keywords..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-700"
                  >
                    <ClearIcon className="text-lg" />
                  </button>
                )}
              </div>
            </div>

            <div className="col-span-12 md:col-span-4">
              <button
                className="w-full px-6 py-3 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                onClick={() => search(1)}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <SearchIcon className="mr-2" /> Search Books
                  </span>
                )}
              </button>
            </div>

            <div className="col-span-12">
              <button
                className="flex items-center text-indigo-600 text-sm font-medium hover:bg-indigo-50/50 px-2 py-1 rounded-md transition-colors"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FilterIcon className="mr-1 text-base" />
                {showFilters ? 'Hide Filters' : 'Advanced Filters'}
              </button>
            </div>

            {showFilters && (
              <>
                <div className="col-span-12 md:col-span-6">
                  <div className="relative">
                    <label className="absolute -top-2 left-3 bg-white/80 px-1 text-xs text-slate-500">Genre</label>
                    <select
                      className="w-full pl-3 pr-10 py-3 text-sm rounded-xl bg-white/80 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      value={genreFilter}
                      onChange={e => setGenreFilter(e.target.value)}
                    >
                      <option value="">All Genres</option>
                      {genreOptions.map((genre) => (
                        <option key={genre} value={genre}>{genre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="col-span-12 md:col-span-6">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BookIcon className="text-slate-400 text-lg" />
                    </div>
                    <label className="absolute -top-2 left-3 bg-white/80 px-1 text-xs text-slate-500">Author</label>
                    <input
                      type="text"
                      className="w-full pl-10 pr-10 py-3 text-sm rounded-xl bg-white/80 border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      placeholder="Filter by author"
                      value={authorFilter}
                      onChange={e => setAuthorFilter(e.target.value)}
                    />
                    {authorFilter && (
                      <button
                        onClick={() => setAuthorFilter('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-700"
                      >
                        <ClearIcon className="text-lg" />
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {(query || genreFilter || authorFilter) && (
              <div className="col-span-12">
                <button
                  className="flex items-center text-sm font-medium text-slate-600 bg-white/80 border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                  onClick={clearFilters}
                >
                  <RefreshIcon className="mr-1 text-base" />
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg animate-pulse border border-white/20">
                <div className="h-52 bg-gradient-to-br from-slate-200 to-slate-300 rounded-t-2xl"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-200 rounded-lg"></div>
                  <div className="h-3 bg-slate-200 rounded-lg w-3/4"></div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <div className="h-8 w-1/2 bg-slate-200 rounded-lg"></div>
                    <div className="h-8 w-1/2 bg-slate-200 rounded-lg"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-white/70 backdrop-blur-lg border-2 border-dashed border-indigo-200 shadow-xl shadow-slate-200/50">
            <LocalLibraryIcon className="text-6xl text-indigo-400 mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              No books found
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Try a different search term or filter, or get AI recommendations
            </p>
            <button
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-indigo-500/25 flex items-center space-x-2"
              onClick={() => setTabValue(1)}
            >
              <AutoAwesomeIcon className="mr-2 text-lg" /> Get AI Recommendations
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium text-slate-800">
                <span className="font-bold text-indigo-600">{totalResults.toLocaleString()}</span> books found
              </h2>
              <p className="text-sm text-slate-600">
                Page {currentPage} of {Math.ceil(totalResults / itemsPerPage)}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {results.map((v) => {
                const vol = v.volumeInfo;
                const isInMyBooks = myBooks.some(b => b.openLibraryId === v.id);

                return (
                  <div key={v.id} className="group bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg hover:shadow-2xl border border-white/20 overflow-hidden flex flex-col transition-all duration-300 transform hover:scale-[1.02] hover:rotate-1">
                    <div className="relative w-full h-52 overflow-hidden rounded-t-2xl">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
                      <img
                        src={vol.imageLinks?.thumbnail || fallbackImage}
                        alt={vol.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={handleImageError}
                      />
                      {vol.categories && (
                        <div className="absolute top-3 left-3 z-20">
                          <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-indigo-600 text-xs font-medium rounded-full">
                            {vol.categories[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-grow p-4">
                      <h3 className="text-base font-bold text-slate-800 truncate mb-1 group-hover:text-indigo-600 transition-colors duration-200">
                        {vol.title}
                      </h3>
                      {vol.authors && (
                        <p className="text-sm text-slate-600 truncate mb-2">
                          by {vol.authors.join(', ')}
                        </p>
                      )}
                      
                      {vol.averageRating && (
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            i < Math.floor(vol.averageRating) ?
                              <StarIcon key={i} className="text-base text-yellow-400" /> :
                              <StarBorderIcon key={i} className="text-base text-slate-300" />
                          ))}
                          <span className="text-xs text-slate-600 ml-1 font-medium">
                            {vol.averageRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 p-4 pt-0">
                      <button
                        className="flex-1 flex items-center justify-center text-sm font-medium text-slate-600 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                        onClick={() => openDetails(v)}
                      >
                        <InfoIcon className="mr-1 text-base" /> Details
                      </button>
                      <button
                        className={`flex-1 flex items-center justify-center text-sm font-medium px-3 py-2 rounded-xl transition-colors ${isInMyBooks ? 'bg-green-100 text-green-600 border border-green-300' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'}`}
                        onClick={() => handleAdd(v)}
                        disabled={isInMyBooks}
                      >
                        {isInMyBooks ? (
                          <>
                            <FavoriteIcon className="mr-1 text-base" /> Added
                          </>
                        ) : (
                          <>
                            <FavoriteBorderIcon className="mr-1 text-base" /> Add
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalResults > itemsPerPage && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center space-x-2">
                  <button
                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-white/80 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
                    onClick={() => handlePageChange(null, currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Prev
                  </button>
                  <span className="text-sm text-slate-600 px-4">Page {currentPage} of {Math.ceil(totalResults / itemsPerPage)}</span>
                  <button
                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-white/80 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
                    onClick={() => handlePageChange(null, currentPage + 1)}
                    disabled={currentPage === Math.ceil(totalResults / itemsPerPage)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </TabPanel>

      {/* AI Recommendations Tab */}
      <TabPanel value={tabValue} index={1}>
        <div className="bg-white/70 backdrop-blur-lg p-6 rounded-2xl h-[calc(100vh-250px)] flex flex-col border border-white/20 shadow-xl shadow-slate-200/50">
          <div className="flex-shrink-0 mb-6 pb-4 border-b border-white/20">
            <div className="flex items-center mb-2">
              <AutoAwesomeIcon className="mr-2 text-3xl text-indigo-600" />
              <h2 className="text-2xl font-bold text-slate-800">AI-Powered Recommendations</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Describe your reading preferences and let our AI recommend books tailored just for you!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <textarea
                  className="w-full p-3 text-sm rounded-xl bg-white/80 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none placeholder-slate-400"
                  rows="2"
                  placeholder="Describe what you're looking for (e.g., A story about space exploration with strong female characters)"
                  value={recommendationQuery}
                  onChange={(e) => setRecommendationQuery(e.target.value)}
                ></textarea>
              </div>

              <div>
                <div className="relative">
                  <label className="absolute -top-2 left-3 bg-white/80 px-1 text-xs text-slate-500">Genre</label>
                  <select
                    className="w-full pl-3 pr-10 py-3 text-sm rounded-xl bg-white/80 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                  >
                    <option value="">Any Genre</option>
                    {genreOptions.map((genre) => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="relative">
                  <label className="absolute -top-2 left-3 bg-white/80 px-1 text-xs text-slate-500">Mood</label>
                  <select
                    className="w-full pl-3 pr-10 py-3 text-sm rounded-xl bg-white/80 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    value={selectedMood}
                    onChange={(e) => setSelectedMood(e.target.value)}
                  >
                    <option value="">Any Mood</option>
                    {moodOptions.map((mood) => (
                      <option key={mood} value={mood}>{mood}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="col-span-2 flex gap-2">
                <button
                  className="flex-1 flex items-center justify-center px-4 py-3 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  onClick={handleGetRecommendations}
                  disabled={loadingRecommendations}
                >
                  {loadingRecommendations ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <AutoAwesomeIcon className="mr-2 text-lg" /> Get Recommendations
                    </>
                  )}
                </button>

                <button
                  className="flex-1 flex items-center justify-center px-4 py-3 text-sm font-semibold rounded-xl text-slate-700 bg-white/80 border border-slate-200 hover:bg-slate-100 transition-colors"
                  onClick={clearRecommendations}
                >
                  <ClearIcon className="mr-2 text-lg" /> Clear
                </button>
              </div>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
            {recommendations.length > 0 ? (
              <>
                <h3 className="text-xl font-medium text-slate-800 mb-4">Recommended Books</h3>
                {recommendations.map((book, index) => (
                  <div key={index} className="flex p-4 mb-4 rounded-xl bg-white/90 border border-white/20 shadow-lg transition-all duration-200 hover:shadow-xl hover:border-slate-200">
                    <div className="flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-lg font-bold text-slate-800">{book.title}</h4>
                          <p className="text-sm text-slate-600">by {book.author}</p>
                        </div>
                        <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-1 rounded-full">
                          {book.genre}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-4">{book.description}</p>
                      <div className="mt-auto">
                        <button
                          className="flex items-center px-4 py-2 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-colors"
                          onClick={() => handleSearchRecommendedBook(book.title, book.author)}
                        >
                          <SearchIcon className="mr-2 text-base" /> Search this book
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center rounded-xl bg-white/70 border-2 border-dashed border-indigo-200 shadow-lg">
                <AutoAwesomeIcon className="text-5xl text-indigo-400 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  No recommendations yet
                </h3>
                <p className="text-sm text-slate-600">
                  Fill out the form above to get personalized book recommendations
                </p>
              </div>
            )}
          </div>
        </div>
      </TabPanel>

      <FloatingChatbot books={myBooks} loadBooks={loadMyBooks} />

      {/* Detail Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-0 max-w-4xl w-full border border-white/20 transform scale-100 animate-in fade-in duration-200 overflow-hidden relative">
            <div className="bg-white/80 border-b border-slate-200 py-6 px-6 relative">
              <button
                className="absolute right-4 top-4 text-slate-600 bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-colors"
                onClick={closeDetails}
              >
                <CloseIcon className="text-lg" />
              </button>
              <h2 className="text-2xl font-bold text-slate-800 pr-12">{selectedBook?.volumeInfo?.title}</h2>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(100vh-150px)] custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 flex flex-col items-center">
                  <img
                    src={selectedBook?.volumeInfo?.imageLinks?.thumbnail || fallbackImage}
                    alt={selectedBook?.volumeInfo?.title}
                    className="w-full max-w-[200px] rounded-lg border border-slate-200 shadow-md"
                    onError={handleImageError}
                  />
                  {selectedBook?.volumeInfo?.averageRating && (
                    <div className="flex items-center mt-4 p-4 rounded-xl bg-white/80 border border-slate-200 w-full shadow-sm">
                      <p className="text-sm font-semibold text-slate-800 mr-2">Rating:</p>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          i < Math.floor(selectedBook.volumeInfo.averageRating) ?
                            <StarIcon key={i} className="text-lg text-yellow-400" /> :
                            <StarBorderIcon key={i} className="text-lg text-slate-300" />
                        ))}
                        <p className="text-sm font-semibold text-slate-800 ml-1">
                          {selectedBook.volumeInfo.averageRating.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="col-span-2">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Book Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-medium">Author</p>
                      <p className="text-slate-800">{(selectedBook?.volumeInfo?.authors || []).join(', ') || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-medium">Genre</p>
                      <p className="text-slate-800">{selectedBook?.volumeInfo?.categories?.[0] || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-medium">Published</p>
                      <p className="text-slate-800">{selectedBook?.volumeInfo?.publishedDate || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-medium">Publisher</p>
                      <p className="text-slate-800">{selectedBook?.volumeInfo?.publisher || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-medium">Page Count</p>
                      <p className="text-slate-800">{selectedBook?.volumeInfo?.pageCount || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-medium">Language</p>
                      <p className="text-slate-800">{selectedBook?.volumeInfo?.language || 'N/A'}</p>
                    </div>
                  </div>
                  <hr className="my-4 border-slate-200" />
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Description</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{selectedBook?.volumeInfo?.description || 'No description available.'}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 bg-slate-50 border-t border-slate-200">
              <button
                className="px-4 py-2 text-sm font-medium rounded-xl text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors"
                onClick={closeDetails}
              >
                Close
              </button>
              <button
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-colors ${myBooks.some(b => b.openLibraryId === selectedBook?.id) ? 'bg-green-100 text-green-600 border border-green-300' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'}`}
                onClick={() => handleAdd(selectedBook)}
                disabled={myBooks.some(b => b.openLibraryId === selectedBook?.id)}
              >
                {myBooks.some(b => b.openLibraryId === selectedBook?.id) ? 'Already Added' : 'Add to My Books'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}