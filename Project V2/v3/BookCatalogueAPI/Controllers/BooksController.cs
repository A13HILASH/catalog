using BookCatalogueAPI.DTOs;
using BookCatalogueAPI.Interfaces;
using BookCatalogueAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace BookCatalogueAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BooksController : ControllerBase
    {
        private readonly IBookManager _bookManager;

        public BooksController(IBookManager bookManager)
        {
            _bookManager = bookManager;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<BookListItemDto>>> Get()
        {
            var books = await _bookManager.GetAllBooksAsync();
            return Ok(books);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<BookDetailsDto>> Get(int id)
        {
            var book = await _bookManager.GetBookByIdAsync(id);
            if (book == null)
            {
                return NotFound();
            }
            return Ok(book);
        }

        [HttpPost]
        public async Task<ActionResult<BookDetailsDto>> Post(BookDto bookDto)
        {
            if (!string.IsNullOrEmpty(bookDto.OpenLibraryId)
                && await _bookManager.BookExistsAsync(bookDto.OpenLibraryId))
            {
                return Conflict("Book already exists.");
            }

            var newBook = await _bookManager.CreateBookAsync(bookDto);
            return CreatedAtAction(nameof(Get), new { id = newBook.Id }, newBook);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, BookDto bookDto)
        {
            try
            {
                await _bookManager.UpdateBookAsync(id, bookDto);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _bookManager.DeleteBookAsync(id);
            return NoContent();
        }
    }
}
