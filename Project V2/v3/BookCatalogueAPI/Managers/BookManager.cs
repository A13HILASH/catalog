using BookCatalogueAPI.Data;
using BookCatalogueAPI.DTOs;
using BookCatalogueAPI.Interfaces;
using BookCatalogueAPI.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BookCatalogueAPI.Managers
{
    public class BookManager : IBookManager
    {
        private readonly IBookRepository _bookRepository;
        private readonly AppDbContext _context; // Injecting AppDbContext to get authors and genres

        public BookManager(IBookRepository bookRepository, AppDbContext context)
        {
            _bookRepository = bookRepository;
            _context = context;
        }

        public async Task<IEnumerable<BookListItemDto>> GetAllBooksAsync()
        {
            var books = await _bookRepository.GetAllBooksAsync();
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

        public async Task<BookDetailsDto?> GetBookByIdAsync(int id)
        {
            var book = await _bookRepository.GetBookByIdAsync(id);
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

        public async Task<BookDetailsDto> CreateBookAsync(BookDto bookDto)
        {
            var book = new Book
            {
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

            var authorNames = bookDto.Authors.Split(',').Select(a => a.Trim()).ToList();
            foreach (var authorName in authorNames)
            {
                var author = _context.Author.FirstOrDefault(a => a.Name == authorName);
                if (author == null)
                {
                    author = new Author { Name = authorName };
                    _context.Author.Add(author);
                }
                book.BookAuthors.Add(new BookAuthor { Author = author });
            }

            var genreNames = bookDto.Genres.Split(',').Select(g => g.Trim()).ToList();
            foreach (var genreName in genreNames)
            {
                var genre = _context.Genre.FirstOrDefault(g => g.Name == genreName);
                if (genre == null)
                {
                    genre = new Genre { Name = genreName };
                    _context.Genre.Add(genre);
                }
                book.BookGenres.Add(new BookGenre { Genre = genre });
            }
            
            // New logic to handle Moods from DTO
            var moodNames = bookDto.Moods.Split(',').Select(m => m.Trim()).ToList();
            foreach (var moodName in moodNames)
            {
                var mood = _context.Mood.FirstOrDefault(m => m.Name == moodName);
                if (mood == null)
                {
                    mood = new Mood { Name = moodName };
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
        
        public async Task UpdateBookAsync(int id, BookDto bookDto)
        {
            var existingBook = await _bookRepository.GetBookByIdAsync(id);
            if (existingBook == null)
            {
                throw new KeyNotFoundException($"Book with ID {id} not found.");
            }

            existingBook.Title = bookDto.Title;
            existingBook.Year = bookDto.Year;
            existingBook.CoverUrl = bookDto.CoverUrl;
            existingBook.BookUrl = bookDto.BookUrl;
            existingBook.Description = bookDto.Description;

            existingBook.BookAuthors.Clear();
            existingBook.BookGenres.Clear();
            existingBook.BookMoods.Clear(); // Clear existing moods

            var authorNames = bookDto.Authors.Split(',').Select(a => a.Trim()).ToList();
            foreach (var authorName in authorNames)
            {
                var author = _context.Author.FirstOrDefault(a => a.Name == authorName);
                if (author == null)
                {
                    author = new Author { Name = authorName };
                    _context.Author.Add(author);
                }
                existingBook.BookAuthors.Add(new BookAuthor { Author = author });
            }

            var genreNames = bookDto.Genres.Split(',').Select(g => g.Trim()).ToList();
            foreach (var genreName in genreNames)
            {
                var genre = _context.Genre.FirstOrDefault(g => g.Name == genreName);
                if (genre == null)
                {
                    genre = new Genre { Name = genreName };
                    _context.Genre.Add(genre);
                }
                existingBook.BookGenres.Add(new BookGenre { Genre = genre });
            }

            // New logic to handle Moods from DTO
            var moodNames = bookDto.Moods.Split(',').Select(m => m.Trim()).ToList();
            foreach (var moodName in moodNames)
            {
                var mood = _context.Mood.FirstOrDefault(m => m.Name == moodName);
                if (mood == null)
                {
                    mood = new Mood { Name = moodName };
                    _context.Mood.Add(mood);
                }
                existingBook.BookMoods.Add(new BookMood { Mood = mood });
            }
            
            await _bookRepository.UpdateBookAsync(existingBook);
        }

        public async Task DeleteBookAsync(int id)
        {
            var book = await _bookRepository.GetBookByIdAsync(id);
            if (book != null)
            {
                await _bookRepository.DeleteBookAsync(book);
            }
        }
        
        public async Task<bool> BookExistsAsync(string openLibraryId)
        {
            return await _bookRepository.BookExistsAsync(openLibraryId);
        }
    }
}
