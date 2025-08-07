// IBookManager.cs (Interface)
using BookCatalogueAPI.DTOs;
using BookCatalogueAPI.Models;

namespace BookCatalogueAPI.Interfaces
{
    public interface IBookManager
    {
        Task<BookDetailsDto?> GetBookByIdAsync(int id);
        Task<IEnumerable<BookListItemDto>> GetAllBooksAsync();
        Task<BookDetailsDto> CreateBookAsync(BookDto bookDto);
        Task UpdateBookAsync(int id, BookDto bookDto);
        Task DeleteBookAsync(int id);
        Task<bool> BookExistsAsync(string openLibraryId);
    }
}