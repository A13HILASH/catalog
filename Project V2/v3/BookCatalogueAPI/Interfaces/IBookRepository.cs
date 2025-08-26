// IBookRepository.cs (Updated Interface)
using BookCatalogueAPI.Models;

namespace BookCatalogueAPI.Interfaces
{
    public interface IBookRepository
    {
        Task<IEnumerable<Book>> GetAllBooksAsync();
        Task<IEnumerable<Book>> GetBooksByUserIdAsync(int userId);
        Task<Book?> GetBookByIdAsync(int id);
        Task<Book?> GetBookByIdAndUserIdAsync(int id, int userId);
        Task AddBookAsync(Book book);
        Task UpdateBookAsync(Book book);
        Task DeleteBookAsync(Book book);
        Task<bool> BookExistsAsync(string openLibraryId);
        Task<bool> BookExistsForUserAsync(string openLibraryId, int userId);
    }
}