// BookRepository.cs (Updated Implementation)
using BookCatalogueAPI.Data;
using BookCatalogueAPI.Interfaces;
using BookCatalogueAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BookCatalogueAPI.Repositories
{
    public class BookRepository : IBookRepository
    {
        private readonly AppDbContext _context;

        public BookRepository(AppDbContext context) => _context = context;

        public async Task<IEnumerable<Book>> GetAllBooksAsync()
        {
            return await _context.Book
                .Include(b => b.BookAuthors).ThenInclude(ba => ba.Author)
                .Include(b => b.BookGenres).ThenInclude(bg => bg.Genre)
                .ToListAsync();
        }

        public async Task<IEnumerable<Book>> GetBooksByUserIdAsync(int userId)
        {
            return await _context.Book
                .Where(b => b.UserId == userId)
                .Include(b => b.BookAuthors).ThenInclude(ba => ba.Author)
                .Include(b => b.BookGenres).ThenInclude(bg => bg.Genre)
                .ToListAsync();
        }

        public async Task<Book?> GetBookByIdAsync(int id)
        {
            return await _context.Book
                .Include(b => b.BookAuthors).ThenInclude(ba => ba.Author)
                .Include(b => b.BookGenres).ThenInclude(bg => bg.Genre)
                .Include(b => b.BookMoods).ThenInclude(bm => bm.Mood)
                .FirstOrDefaultAsync(b => b.Id == id);
        }

        public async Task<Book?> GetBookByIdAndUserIdAsync(int id, int userId)
        {
            return await _context.Book
                .Where(b => b.Id == id && b.UserId == userId)
                .Include(b => b.BookAuthors).ThenInclude(ba => ba.Author)
                .Include(b => b.BookGenres).ThenInclude(bg => bg.Genre)
                .Include(b => b.BookMoods).ThenInclude(bm => bm.Mood)
                .FirstOrDefaultAsync();
        }

        public async Task AddBookAsync(Book book)
        {
            _context.Book.Add(book);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateBookAsync(Book book)
        {
            _context.Entry(book).State = EntityState.Modified;
            await _context.SaveChangesAsync();
        }

        public async Task DeleteBookAsync(Book book)
        {
            _context.Book.Remove(book);
            await _context.SaveChangesAsync();
        }
        
        public async Task<bool> BookExistsAsync(string openLibraryId)
        {
            return await _context.Book.AnyAsync(b => b.OpenLibraryId == openLibraryId);
        }

        public async Task<bool> BookExistsForUserAsync(string openLibraryId, int userId)
        {
            return await _context.Book.AnyAsync(b => b.OpenLibraryId == openLibraryId && b.UserId == userId);
        }
    }
}