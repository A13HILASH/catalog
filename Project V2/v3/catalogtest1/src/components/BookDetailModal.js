import React from 'react';

export default function BookDetailModal({ open, handleClose, book }) {
  if (!book || !open) return null;

  const info = book.volumeInfo;
  const fallbackImage = "https://via.placeholder.com/400x300?text=No+Cover";
  const authorList = (info.authors || []).join(', ');
  const genreList = (info.categories || []).join(', ');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/20 transform scale-100 animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <h2 className="text-3xl font-bold text-white mb-2 leading-tight">
                {info.title}
              </h2>
              {info.subtitle && (
                <p className="text-indigo-100 text-lg opacity-90">
                  {info.subtitle}
                </p>
              )}
            </div>
            
            <button 
              onClick={handleClose}
              className="flex-shrink-0 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:text-white transition-all duration-200 transform hover:scale-110"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Decorative gradient line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-white/20 via-white/40 to-white/20"></div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Book Cover */}
            {info.imageLinks?.thumbnail && (
              <div className="flex-shrink-0 lg:w-64">
                <div className="relative group">
                  <img
                    src={info.imageLinks.thumbnail.replace('http:', 'https:')}
                    alt={info.title}
                    className="w-full h-auto rounded-2xl shadow-2xl transition-transform duration-300 group-hover:scale-105 border border-slate-200"
                    onError={(e) => (e.target.src = fallbackImage)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>
            )}
            
            {/* Book Details */}
            <div className="flex-grow space-y-6">
              
              {/* Quick Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { 
                    label: 'Author', 
                    value: authorList, 
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ),
                    color: 'from-blue-500 to-cyan-600'
                  },
                  { 
                    label: 'Publisher', 
                    value: info.publisher, 
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-8 0H3m2 0h6" />
                      </svg>
                    ),
                    color: 'from-purple-500 to-indigo-600'
                  },
                  { 
                    label: 'Published', 
                    value: info.publishedDate, 
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ),
                    color: 'from-green-500 to-emerald-600'
                  },
                  { 
                    label: 'Pages', 
                    value: info.pageCount, 
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    ),
                    color: 'from-orange-500 to-red-600'
                  },
                  { 
                    label: 'Language', 
                    value: info.language?.toUpperCase(), 
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                    ),
                    color: 'from-pink-500 to-rose-600'
                  },
                  { 
                    label: 'Genre', 
                    value: genreList, 
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    ),
                    color: 'from-teal-500 to-cyan-600'
                  }
                ].filter(item => item.value).map((item, index) => (
                  <div 
                    key={item.label}
                    className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 bg-gradient-to-r ${item.color} rounded-lg flex items-center justify-center text-white shadow-lg`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                          {item.label}
                        </p>
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Description */}
              {info.description && (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Description</h3>
                  </div>
                  <div 
                    className="prose prose-slate max-w-none text-slate-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: info.description }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 border-t border-slate-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 text-slate-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">Book information from Google Books</span>
            </div>
            
            <div className="flex gap-3">
              {info.previewLink && (
                <a 
                  href={info.previewLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-6 py-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-slate-500/25 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Preview</span>
                </a>
              )}
              <button 
                onClick={handleClose} 
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-indigo-500/25 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}