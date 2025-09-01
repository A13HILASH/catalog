import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Configure the PDF worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

// Markdown renderer component
const MarkdownRenderer = ({ content }) => {
  const [renderedContent, setRenderedContent] = useState('');

  useEffect(() => {
    // Simple markdown parser for basic formatting
    const parseMarkdown = (text) => {
      // Headers
      return text
        .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-slate-800 mt-4 mb-2">$1</h3>')
        .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold text-slate-800 mt-6 mb-3">$1</h2>')
        .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-slate-900 mt-6 mb-4">$1</h1>')
        // Bold and italic
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
        // Code blocks
        .replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-100 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-sm">$1</code></pre>')
        .replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-sm">$1</code>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800 underline">$1</a>')
        // Line breaks
        .replace(/\n\n/g, '</p><p class="mb-4">')
        .replace(/\n/g, '<br>');
    };
    setRenderedContent(parseMarkdown(content));
  }, [content]);

  return (
    <div
      className="prose prose-slate max-w-none text-slate-700 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: `<p class="mb-4">${renderedContent}</p>` }}
    />
  );
};

// Enhanced book viewer modal for both markdown and PDF content
const BookViewerModal = ({ open, onClose, bookUrl, isPdf, title }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && bookUrl && !isPdf) {
      fetchBookContent();
    }
  }, [open, bookUrl, isPdf]);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1); // Reset to page 1 for a new book
  }

  const changePage = (offset) => {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  };

  const changeScale = (offset) => {
    setScale(prevScale => Math.max(0.5, prevScale + offset));
  };

  const handleDownload = () => {
    window.open(bookUrl, '_blank');
  };

  const fetchBookContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(bookUrl);
      if (!response.ok) throw new Error('Failed to fetch book content');
      const text = await response.text();
      setContent(text);
    } catch (err) {
      setError('Failed to load book content. Please try again.');
      console.error('Error fetching book content:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const getModalTitle = () => {
    if (isPdf) return 'PDF Reader';
    return 'Reading Mode';
  };

  const getHeaderColor = () => {
    if (isPdf) return 'from-red-600 via-orange-600 to-amber-600';
    return 'from-emerald-600 via-teal-600 to-cyan-600';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden border border-white/20 transform scale-100 animate-in slide-in-from-bottom-4 duration-300">

        {/* Header */}
        <div className={`relative bg-gradient-to-r ${getHeaderColor()} p-6`}>
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <h2 className="text-3xl font-bold text-white mb-2 leading-tight">
                {title}
              </h2>
              <div className="flex items-center space-x-3">
                <p className="text-white/90 text-lg">
                  {getModalTitle()}
                </p>
                <div className="flex items-center space-x-2">
                  {isPdf ? (
                    <div className="flex items-center space-x-1 bg-white/20 rounded-full px-3 py-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-white">PDF</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 bg-white/20 rounded-full px-3 py-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-white">Text</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex-shrink-0 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:text-white transition-all duration-200 transform hover:scale-110"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-white/20 via-white/40 to-white/20"></div>
        </div>

        {/* Content */}
        <div className={`${isPdf ? 'p-4' : 'p-8'} overflow-y-auto max-h-[calc(95vh-200px)]`}>
          {isPdf ? (
            <div className="flex flex-col items-center">
              <Document
                file={bookUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading="Loading PDF..."
                error="Failed to load PDF."
              >
                <Page pageNumber={pageNumber} scale={scale} />
              </Document>
              <div className="mt-4 flex items-center space-x-4">
                <button
                  onClick={() => changePage(-1)}
                  disabled={pageNumber <= 1}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow disabled:opacity-50"
                >
                  Previous
                </button>
                <p>Page {pageNumber} of {numPages || '--'}</p>
                <button
                  onClick={() => changePage(1)}
                  disabled={pageNumber >= numPages}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow disabled:opacity-50"
                >
                  Next
                </button>
                <button onClick={() => changeScale(0.1)} className="px-3 py-2 bg-gray-200 rounded-lg shadow text-slate-700 font-bold">+</button>
                <button onClick={() => changeScale(-0.1)} className="px-3 py-2 bg-gray-200 rounded-lg shadow text-slate-700 font-bold">-</button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg shadow"
                >
                  Download PDF
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
              <p className="text-slate-600">Loading book content...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-600 text-center mb-4">{error}</p>
              <button
                onClick={fetchBookContent}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors duration-200"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <MarkdownRenderer content={content} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 border-t border-slate-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 text-slate-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="text-sm">
                {isPdf ? 'PDF loaded from Cloudinary' : 'Reading from Cloudinary'}
              </span>
            </div>

            <div className="flex gap-3">
              {isPdf && (
                <button
                  onClick={() => window.open(bookUrl, '_blank')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/25 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download</span>
                </button>
              )}
              <button
                onClick={onClose}
                className={`px-6 py-2 font-medium rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2 ${
                  isPdf
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-red-500/25'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/25'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Close Reader</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Book Detail Modal
export default function BookDetailModal({ open, handleClose, book }) {
  const [readerModalOpen, setReaderModalOpen] = useState(false);
  const [isPdf, setIsPdf] = useState(false);

  // This useEffect is now at the top level, fixing the error.
  useEffect(() => {
    if (book?.volumeInfo?.bookUrl) {
      const bookUrl = book.volumeInfo.bookUrl.toLowerCase();
      if (bookUrl.includes('.pdf') || bookUrl.includes('pdf')) {
        setIsPdf(true);
      } else {
        setIsPdf(false);
      }
    } else {
      setIsPdf(false);
    }
  }, [book]);

  if (!book || !open) return null;

  const info = book.volumeInfo;
  const fallbackImage = "https://via.placeholder.com/400x300?text=No+Cover";
  const authorList = (info.authors || []).join(', ');
  const genreList = (info.categories || []).join(', ');

  const hasBookUrl = info.bookUrl && info.bookUrl.includes('cloudinary.com');
  const previewUrl = hasBookUrl ? info.bookUrl : info.previewLink;

  const handlePreviewClick = () => {
    if (hasBookUrl) {
      setReaderModalOpen(true);
    } else if (previewUrl) {
      window.open(`https://books.google.com/books?id=${info.previewLink}`, '_blank', 'noopener,noreferrer');
    }
  };

  const getReadButtonText = () => {
    if (hasBookUrl) {
      return isPdf ? 'Read PDF' : 'Read Book';
    }
    return 'Preview';
  };

  const getReadButtonIcon = () => {
    if (hasBookUrl) {
      if (isPdf) {
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      }
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    );
  };

  const getReadButtonColor = () => {
    if (hasBookUrl) {
      return isPdf ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-red-500/25' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25';
    }
    return 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 shadow-slate-500/25';
  };

  return (
    <>
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
                <span className="text-sm">
                  {hasBookUrl ?
                    (isPdf ? 'PDF book available to read' : 'Full book available to read') :
                    'Book information from Google Books'
                  }
                </span>
              </div>

              <div className="flex gap-3">
                {previewUrl && (
                  <button
                    onClick={handlePreviewClick}
                    className={`px-6 py-2 font-medium rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2 ${getReadButtonColor()} text-white`}
                  >
                    {getReadButtonIcon()}
                    <span>{getReadButtonText()}</span>
                  </button>
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

      {/* Book Reader Modal for both markdown and PDF content */}
      <BookViewerModal
        open={readerModalOpen}
        onClose={() => setReaderModalOpen(false)}
        bookUrl={hasBookUrl ? info.bookUrl : null}
        isPdf={isPdf}
        title={info.title}
      />
    </>
  );
}
