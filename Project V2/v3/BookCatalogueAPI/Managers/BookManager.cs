using BookCatalogueAPI.Data;
using BookCatalogueAPI.DTOs;
using BookCatalogueAPI.Interfaces;
using BookCatalogueAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BookCatalogueAPI.Managers
{
    public class BookManager : IBookManager
    {
        private readonly IBookRepository _bookRepository;
        private readonly AppDbContext _context;

        public BookManager(IBookRepository bookRepository, AppDbContext context)
        {
            _bookRepository = bookRepository;
            _context = context;
        }

        public async Task<IEnumerable<BookListItemDto>> GetAllBooksAsync(int userId)
        {
            var books = await _bookRepository.GetBooksByUserIdAsync(userId);
            return books.Select(b => new BookListItemDto
            {
                Id = b.Id,
                Title = b.Title,
                Year = b.Year,
                CoverUrl = b.CoverUrl,
                BookUrl = b.BookUrl,
                OpenLibraryId = b.OpenLibraryId,
                Description = b.Description,
                Authors = string.Join(", ", b.BookAuthors.Select(ba => ba.Author.Name)),
                Genres = string.Join(", ", b.BookGenres.Select(bg => bg.Genre.Name))
            }).ToList();
        }

        public async Task<BookDetailsDto?> GetBookByIdAsync(int id, int userId)
        {
            var book = await _bookRepository.GetBookByIdAndUserIdAsync(id, userId);
            if (book == null)
            {
                return null;
            }

            return new BookDetailsDto
            {
                Id = book.Id,
                Title = book.Title,
                Year = book.Year,
                CoverUrl = book.CoverUrl,
                BookUrl = book.BookUrl,
                OpenLibraryId = book.OpenLibraryId,
                Authors = book.BookAuthors.Select(ba => ba.Author.Name).ToList(),
                Genres = book.BookGenres.Select(bg => bg.Genre.Name).ToList(),
                Moods = book.BookMoods.Select(bm => bm.Mood.Name).ToList(),
                Description = book.Description
            };
        }

        public async Task<BookDetailsDto> CreateBookAsync(BookDto bookDto, int userId)
        {
            var book = new Book
            {
                UserId = userId,
                Title = bookDto.Title,
                Year = bookDto.Year,
                CoverUrl = bookDto.CoverUrl,
                OpenLibraryId = bookDto.OpenLibraryId,
                BookUrl = bookDto.BookUrl,
                Description = bookDto.Description,
                BookAuthors = new List<BookAuthor>(),
                BookGenres = new List<BookGenre>(),
                BookMoods = new List<BookMood>()
            };

            // Process Authors
            var authorNames = bookDto.Authors.Split(',').Select(a => a.Trim()).Where(a => !string.IsNullOrEmpty(a)).ToList();
            foreach (var authorName in authorNames)
            {
                var author = await _context.Author.FirstOrDefaultAsync(a => a.Name == authorName && a.UserId == userId);
                if (author == null)
                {
                    author = new Author { Name = authorName, UserId = userId };
                    _context.Author.Add(author);
                }
                book.BookAuthors.Add(new BookAuthor { Author = author });
            }

            // Process Genres
            var genreNames = bookDto.Genres.Split(',').Select(g => g.Trim()).Where(g => !string.IsNullOrEmpty(g)).ToList();
            foreach (var genreName in genreNames)
            {
                var genre = await _context.Genre.FirstOrDefaultAsync(g => g.Name == genreName && g.UserId == userId);
                if (genre == null)
                {
                    genre = new Genre { Name = genreName, UserId = userId };
                    _context.Genre.Add(genre);
                }
                book.BookGenres.Add(new BookGenre { Genre = genre });
            }
            
            // Process Moods
            var moodNames = bookDto.Moods.Split(',').Select(m => m.Trim()).Where(m => !string.IsNullOrEmpty(m)).ToList();
            foreach (var moodName in moodNames)
            {
                var mood = await _context.Mood.FirstOrDefaultAsync(m => m.Name == moodName && m.UserId == userId);
                if (mood == null)
                {
                    mood = new Mood { Name = moodName, UserId = userId };
                    _context.Mood.Add(mood);
                }
                book.BookMoods.Add(new BookMood { Mood = mood });
            }

            await _bookRepository.AddBookAsync(book);
            
            return new BookDetailsDto
            {
                Id = book.Id,
                Title = book.Title,
                Year = book.Year,
                CoverUrl = book.CoverUrl,
                BookUrl = book.BookUrl,
                OpenLibraryId = book.OpenLibraryId,
                Description = book.Description,
                Authors = authorNames,
                Genres = genreNames,
                Moods = moodNames
            };
        }
        
        public async Task UpdateBookAsync(int id, BookDto bookDto, int userId)
        {
            var existingBook = await _bookRepository.GetBookByIdAndUserIdAsync(id, userId);
            if (existingBook == null)
            {
                throw new KeyNotFoundException($"Book with ID {id} not found for user.");
            }

            existingBook.Title = bookDto.Title;
            existingBook.Year = bookDto.Year;
            existingBook.CoverUrl = bookDto.CoverUrl;
            existingBook.BookUrl = bookDto.BookUrl;
            existingBook.Description = bookDto.Description;

            // Clear existing relationships
            existingBook.BookAuthors.Clear();
            existingBook.BookGenres.Clear();
            existingBook.BookMoods.Clear();

            // Process Authors
            var authorNames = bookDto.Authors.Split(',').Select(a => a.Trim()).Where(a => !string.IsNullOrEmpty(a)).ToList();
            foreach (var authorName in authorNames)
            {
                var author = await _context.Author.FirstOrDefaultAsync(a => a.Name == authorName && a.UserId == userId);
                if (author == null)
                {
                    author = new Author { Name = authorName, UserId = userId };
                    _context.Author.Add(author);
                }
                existingBook.BookAuthors.Add(new BookAuthor { Author = author });
            }

            // Process Genres
            var genreNames = bookDto.Genres.Split(',').Select(g => g.Trim()).Where(g => !string.IsNullOrEmpty(g)).ToList();
            foreach (var genreName in genreNames)
            {
                var genre = await _context.Genre.FirstOrDefaultAsync(g => g.Name == genreName && g.UserId == userId);
                if (genre == null)
                {
                    genre = new Genre { Name = genreName, UserId = userId };
                    _context.Genre.Add(genre);
                }
                existingBook.BookGenres.Add(new BookGenre { Genre = genre });
            }

            // Process Moods
            var moodNames = bookDto.Moods.Split(',').Select(m => m.Trim()).Where(m => !string.IsNullOrEmpty(m)).ToList();
            foreach (var moodName in moodNames)
            {
                var mood = await _context.Mood.FirstOrDefaultAsync(m => m.Name == moodName && m.UserId == userId);
                if (mood == null)
                {
                    mood = new Mood { Name = moodName, UserId = userId };
                    _context.Mood.Add(mood);
                }
                existingBook.BookMoods.Add(new BookMood { Mood = mood });
            }
            
            await _bookRepository.UpdateBookAsync(existingBook);
        }

        public async Task DeleteBookAsync(int id, int userId)
        {
            var book = await _bookRepository.GetBookByIdAndUserIdAsync(id, userId);
            if (book != null)
            {
                await _bookRepository.DeleteBookAsync(book);
            }
        }
        
        public async Task<bool> BookExistsAsync(string openLibraryId, int userId)
        {
            return await _bookRepository.BookExistsForUserAsync(openLibraryId, userId);
        }
    }
}