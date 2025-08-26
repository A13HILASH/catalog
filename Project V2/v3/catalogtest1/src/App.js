// src/App.js
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import NavBar from "./components/NavBar";
import SearchBooks from "./components/SearchBooks";
import BookListTailwind from "./components/BookList";
import AddBook from "./components/AddBook";
import EditBook from "./components/EditBook";
import AIBookGenerator from "./components/AIBookGenerator";
import Login from "./components/Login";
import Register from "./components/Register";
import { getBooks } from "./services/bookService";

// ProtectedRoute wrapper
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) navigate("/login", { replace: true });
  }, [token, navigate]);

  if (!token) return null; // Prevent rendering if not logged in
  return children;
}

// Layout wrapper for pages with sidebar
function ProtectedLayout({ children }) {
  const location = useLocation();
  const isBookListRoute = location.pathname === "/mybooks";

  const [availableGenres, setAvailableGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);

  // Fetch genres for sidebar
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await getBooks();
        const allGenres = response.data.flatMap((book) =>
          typeof book.genres === "string"
            ? book.genres.split(",").map((g) => g.trim()).filter((g) => g)
            : []
        );
        setAvailableGenres([...new Set(allGenres)].sort());
      } catch (err) {
        console.error("Failed to fetch genres:", err);
      }
    };
    fetchGenres();
  }, []);

  const handleFilterChange = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  return (
    <div className="flex">
      {isBookListRoute && (
        <FilterSidebar
          genres={availableGenres}
          selectedGenres={selectedGenres}
          onFilterChange={handleFilterChange}
        />
      )}
      <div className={`flex-1 p-6 ${isBookListRoute ? "ml-64" : ""}`}>
        {children(selectedGenres)}
      </div>
    </div>
  );
}

// Main App component
export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

// AppWrapper handles NavBar visibility
function AppWrapper() {
  const location = useLocation();
  const hideNavBar = location.pathname === "/login" || location.pathname === "/register";

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 min-h-screen transition-all duration-300">
      {!hideNavBar && <NavBar />}
      <Routes>
        {/* Root redirect based on token */}
        <Route
          path="/"
          element={
            localStorage.getItem("token") ? (
              <Navigate to="/mybooks" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="search"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                {(selectedGenres) => <SearchBooks selectedGenres={selectedGenres} />}
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="add"
          element={
            <ProtectedRoute>
              <ProtectedLayout>{() => <AddBook />}</ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="mybooks"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                {(selectedGenres) => <BookListTailwind selectedGenres={selectedGenres} />}
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="edit/:id"
          element={
            <ProtectedRoute>
              <ProtectedLayout>{() => <EditBook />}</ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="ai-book-generator"
          element={
            <ProtectedRoute>
              <ProtectedLayout>{() => <AIBookGenerator />}</ProtectedLayout>
            </ProtectedRoute>
          }
        />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

// FilterSidebar component (unchanged)
function FilterSidebar({ genres, selectedGenres, onFilterChange }) {
  return (
    <div className="hidden lg:block w-64 backdrop-blur-xl bg-white/80 border-r border-white/20 shadow-xl shadow-indigo-500/10 fixed left-0 top-16 bottom-0 z-10">
      <div className="px-6 py-5 border-b border-gradient-to-r from-indigo-200/50 to-purple-200/50 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Filters</h2>
        </div>
        {selectedGenres.length > 0 && (
          <div className="mt-2 px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full inline-block">
            {selectedGenres.length} selected
          </div>
        )}
      </div>
      <div 
        className="px-4 py-4 overflow-y-auto h-[calc(100vh-140px)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gradient-to-b [&::-webkit-scrollbar-thumb]:from-indigo-300 [&::-webkit-scrollbar-thumb]:to-purple-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:from-indigo-400 [&::-webkit-scrollbar-thumb:hover]:to-purple-500"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#a855f7 transparent' }}
      >
        <div className="space-y-2">
          {genres.map((genre, index) => (
            <div key={genre} className="group">
              <label 
                className={`flex items-center px-3 py-2.5 text-sm font-medium cursor-pointer rounded-lg transition-all duration-200 transform hover:scale-[1.02] ${
                  selectedGenres.includes(genre)
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-700 hover:bg-white/60 hover:shadow-md hover:shadow-slate-200/50'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selectedGenres.includes(genre)}
                    onChange={() => onFilterChange(genre)}
                  />
                  <div className={`w-5 h-5 rounded-md border-2 mr-3 flex items-center justify-center transition-all duration-200 ${
                    selectedGenres.includes(genre)
                      ? 'bg-white border-white'
                      : 'border-slate-300 group-hover:border-indigo-400'
                  }`}>
                    {selectedGenres.includes(genre) && (
                      <svg className="w-3 h-3 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="select-none flex-1">{genre}</span>
                <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  selectedGenres.includes(genre)
                    ? 'bg-white/60'
                    : 'bg-gradient-to-r from-indigo-400 to-purple-500 opacity-0 group-hover:opacity-100'
                }`}></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
