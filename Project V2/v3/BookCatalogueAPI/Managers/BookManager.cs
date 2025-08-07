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

        // The return type is changed from Task<Book?> to Task<Book> to match the IBookManager interface.
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
            // Business logic to check if the ID matches.
            if (id != book.Id) return false;

            // Fetch the existing book. This will be tracked by the DbContext.
            var existingBook = await _repository.GetBookByIdAsync(id);
            if (existingBook == null) return false;

            // Update the properties of the existing, tracked entity with the new values.
            existingBook.Title = book.Title;
            existingBook.Author = book.Author;
            existingBook.Genre = book.Genre;
            existingBook.Year = book.Year;
            existingBook.CoverUrl = book.CoverUrl;
            existingBook.OpenLibraryId = book.OpenLibraryId;
            
            // Now, pass the existing, updated book to the repository to save the changes.
            await _repository.UpdateBookAsync(existingBook);
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