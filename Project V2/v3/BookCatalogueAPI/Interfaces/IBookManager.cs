using BookCatalogueAPI.Models;

namespace BookCatalogueAPI.Interfaces
{
    public interface IBookManager
    {
        Task<IEnumerable<Book>> GetAllBooks();
        Task<Book> AddBook(Book book);
        Task<bool> UpdateBook(int id, Book book);
        Task<bool> DeleteBook(int id);
    }
}