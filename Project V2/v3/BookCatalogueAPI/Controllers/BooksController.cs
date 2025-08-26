using BookCatalogueAPI.DTOs;
using BookCatalogueAPI.Interfaces;
using BookCatalogueAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BookCatalogueAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
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
            var userId = GetCurrentUserId();
            var books = await _bookManager.GetAllBooksAsync(userId);
            return Ok(books);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<BookDetailsDto>> Get(int id)
        {
            var userId = GetCurrentUserId();
            var book = await _bookManager.GetBookByIdAsync(id, userId);
            if (book == null)
            {
                return NotFound();
            }
            return Ok(book);
        }

        [HttpPost]
        public async Task<ActionResult<BookDetailsDto>> Post(BookDto bookDto)
        {
            var userId = GetCurrentUserId();
            
            if (!string.IsNullOrEmpty(bookDto.OpenLibraryId)
                && await _bookManager.BookExistsAsync(bookDto.OpenLibraryId, userId))
            {
                return Conflict("Book already exists in your catalog.");
            }

            var newBook = await _bookManager.CreateBookAsync(bookDto, userId);
            return CreatedAtAction(nameof(Get), new { id = newBook.Id }, newBook);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, BookDto bookDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _bookManager.UpdateBookAsync(id, bookDto, userId);
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
            var userId = GetCurrentUserId();
            await _bookManager.DeleteBookAsync(id, userId);
            return NoContent();
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                throw new UnauthorizedAccessException("Invalid user token.");
            }
            return userId;
        }
    }
}