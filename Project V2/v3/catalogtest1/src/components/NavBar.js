import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("token"); // 🔑 clear JWT
    navigate("/login",{ replace: true }); // redirect to login
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-slate-200/20">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side: Main logo/title */}
          <Link 
            to="/login" 
            className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent hover:scale-105 transition-all duration-300 flex items-center space-x-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span>BOOK HAVEN</span>
          </Link>

          {/* Right side: Nav links + Logout */}
          <div className="flex items-center space-x-2">
            {[
              { path: '/search', label: 'Search', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )},
              { path: '/add', label: 'Add Book', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )},
              { path: '/mybooks', label: 'My Books', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
              )},
              { path: '/ai-book-generator', label: 'AI Book Generator', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M14 10l7-7m0 0l-3.5 3.5M21 3l-9 9m-4 8h.01M4 6h.01M4 18h.01M10 4h.01" />
                </svg>
              )}
            ].map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  relative px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 flex items-center space-x-2 group
                  ${isActive(item.path) 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 scale-105' 
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-white/60 hover:backdrop-blur-sm hover:scale-105 hover:shadow-md'
                  }
                `}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className={`transition-colors duration-300 ${isActive(item.path) ? 'text-white' : ''}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>

                {isActive(item.path) && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full animate-pulse"></div>
                )}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10"></div>
              </Link>
            ))}

            {/* 🔴 Logout button styled like other nav links */}
            <button
              onClick={handleLogout}
              className={`
                relative px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 flex items-center space-x-2 group
                text-slate-600 hover:text-indigo-600 hover:bg-white/60 hover:backdrop-blur-sm hover:scale-105 hover:shadow-md
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60"></div>
    </nav>
  );
}
