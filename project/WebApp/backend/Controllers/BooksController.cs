using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[Route("api/[controller]")]
[ApiController]
public class BooksController : ControllerBase {
    private readonly BookContext _context;
    public BooksController(BookContext context) {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Book>>> GetBooks() => await _context.Books.ToListAsync();

    [HttpGet("{id}")]
    public async Task<ActionResult<Book>> GetBook(int id) {
        var book = await _context.Books.FindAsync(id);
        return book == null ? NotFound() : book;
    }

    [HttpPost]
    public async Task<ActionResult<Book>> PostBook(Book book) {
        _context.Books.Add(book);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetBook), new { id = book.Id }, book);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutBook(int id, Book book) {
        if (id != book.Id) return BadRequest();
        _context.Entry(book).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBook(int id) {
        var book = await _context.Books.FindAsync(id);
        if (book == null) return NotFound();
        _context.Books.Remove(book);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

