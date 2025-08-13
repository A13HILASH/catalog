import React from 'react';
import { FavoriteBorder as FavoriteBorderIcon, Favorite as FavoriteIcon } from '@mui/icons-material';

export default function SearchResults({ results, onAdd, myBooks }) {
  const fallbackImage = "https://via.placeholder.com/400x300?text=No+Cover";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {results.map(book => {
        const isInMyBooks = myBooks.some(b => b.openLibraryId === book.id);
        const vol = book.volumeInfo;
        return (
          <div key={book.id} className="group bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg hover:shadow-2xl border border-white/20 overflow-hidden flex flex-col transition-all duration-300 transform hover:scale-[1.02] hover:rotate-1">
            <div className="relative w-full h-52 overflow-hidden rounded-t-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
              <img
                src={vol.imageLinks?.thumbnail || fallbackImage}
                alt={vol.title}
                onError={(e) => (e.target.src = fallbackImage)}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {vol.categories && (
                <div className="absolute top-3 left-3 z-20">
                  <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-indigo-600 text-xs font-medium rounded-full">
                    {vol.categories[0]}
                  </span>
                </div>
              )}
            </div>
            <div className="p-4 flex flex-col flex-grow">
              <h3
                className="text-lg font-bold text-slate-800 truncate mb-1 group-hover:text-indigo-600 transition-colors duration-200"
                title={vol.title}
              >
                {vol.title}
              </h3>
              <p
                className="text-sm text-slate-600 truncate mb-2"
                title={(vol.authors || []).join(', ')}
              >
                by {(vol.authors || []).join(', ')}
              </p>
              <div className="flex-grow"></div>
              <div className="flex justify-end items-center mt-4">
                <button
                  onClick={() => onAdd(book)}
                  disabled={isInMyBooks}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${isInMyBooks ? 'bg-green-100 text-green-600 border border-green-300' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'}`}
                >
                  {isInMyBooks ? (
                    <span className="flex items-center"><FavoriteIcon className="mr-1 text-base" /> Added</span>
                  ) : (
                    <span className="flex items-center"><FavoriteBorderIcon className="mr-1 text-base" /> Add</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}