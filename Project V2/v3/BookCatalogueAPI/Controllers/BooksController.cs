using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BookCatalogueAPI.Data;
using BookCatalogueAPI.Models;

namespace BookCatalogueAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BooksController : ControllerBase
    {
        private readonly AppDbContext _context;
        public BooksController(AppDbContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Book>>> Get()
            => await _context.Book.ToListAsync();

        [HttpPost]
        public async Task<ActionResult<Book>> Post(Book book)
        {
            if (!string.IsNullOrEmpty(book.OpenLibraryId)
                && await _context.Book.AnyAsync(b => b.OpenLibraryId == book.OpenLibraryId))
            {
                return Conflict("Book already exists.");
            }

            _context.Book.Add(book);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = book.Id }, book);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, Book book)
        {
            if (id != book.Id) return BadRequest();

            _context.Entry(book).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var book = await _context.Book.FindAsync(id);
            if (book == null) return NotFound();

            _context.Book.Remove(book);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
