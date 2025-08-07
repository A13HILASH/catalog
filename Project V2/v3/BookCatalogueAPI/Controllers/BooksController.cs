using Microsoft.AspNetCore.Mvc;
using BookCatalogueAPI.Models;
using BookCatalogueAPI.Interfaces;

namespace BookCatalogueAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BooksController : ControllerBase
    {
        private readonly IBookManager _bookManager;

        public BooksController(IBookManager bookManager) => _bookManager = bookManager;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Book>>> Get()
        {
            return Ok(await _bookManager.GetAllBooks());
        }

        [HttpPost]
        public async Task<ActionResult<Book>> Post(Book book)
        {
            try
            {
                var newBook = await _bookManager.AddBook(book);
                return CreatedAtAction(nameof(Get), new { id = newBook.Id }, newBook);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, Book book)
        {
            var success = await _bookManager.UpdateBook(id, book);
            if (!success) return BadRequest();
            
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _bookManager.DeleteBook(id);
            if (!success) return NotFound();

            return NoContent();
        }
    }
}