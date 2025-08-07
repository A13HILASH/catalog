using BookCatalogueAPI.Interfaces;
using BookCatalogueAPI.Models;

namespace BookCatalogueAPI.Managers
{
    public class BookManager : IBookManager
    {
        private readonly IBookRepository _repository;

        public BookManager(IBookRepository repository) => _repository = repository;

        public async Task<IEnumerable<Book>> GetAllBooks()
        {
            return await _repository.GetAllBooksAsync();
        }

        public async Task<Book> AddBook(Book book)
        {
            if (!string.IsNullOrEmpty(book.OpenLibraryId) && await _repository.BookExistsByOpenLibraryIdAsync(book.OpenLibraryId))
            {
                throw new InvalidOperationException("Book with this OpenLibraryId already exists.");
            }

            await _repository.AddBookAsync(book);
            return book;
        }

        public async Task<bool> UpdateBook(int id, Book book)
        {
            if (id != book.Id) return false;

            var existingBook = await _repository.GetBookByIdAsync(id);
            if (existingBook == null) return false;

            await _repository.UpdateBookAsync(book);
            return true;
        }

        public async Task<bool> DeleteBook(int id)
        {
            var bookToDelete = await _repository.GetBookByIdAsync(id);
            if (bookToDelete == null) return false;

            await _repository.DeleteBookAsync(bookToDelete);
            return true;
        }
    }
}