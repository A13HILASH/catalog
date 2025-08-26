// IBookManager.cs (Updated Interface)
using BookCatalogueAPI.DTOs;
using BookCatalogueAPI.Models;

namespace BookCatalogueAPI.Interfaces
{
    public interface IBookManager
    {
        Task<BookDetailsDto?> GetBookByIdAsync(int id, int userId);
        Task<IEnumerable<BookListItemDto>> GetAllBooksAsync(int userId);
        Task<BookDetailsDto> CreateBookAsync(BookDto bookDto, int userId);
        Task UpdateBookAsync(int id, BookDto bookDto, int userId);
        Task DeleteBookAsync(int id, int userId);
        Task<bool> BookExistsAsync(string openLibraryId, int userId);
    }
}