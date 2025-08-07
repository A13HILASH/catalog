using Microsoft.EntityFrameworkCore;
using BookCatalogueAPI.Data;
using BookCatalogueAPI.Interfaces;
using BookCatalogueAPI.Models;

namespace BookCatalogueAPI.Repositories
{
    public class BookRepository : IBookRepository
    {
        private readonly AppDbContext _context;

        public BookRepository(AppDbContext context) => _context = context;

        public async Task<IEnumerable<Book>> GetAllBooksAsync()
        {
            return await _context.Book.ToListAsync();
        }

        public async Task<Book?> GetBookByIdAsync(int id)
        {
            return await _context.Book.FindAsync(id);
        }

        public async Task<bool> BookExistsByOpenLibraryIdAsync(string openLibraryId)
        {
            return await _context.Book.AnyAsync(b => b.OpenLibraryId == openLibraryId);
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
    }
}