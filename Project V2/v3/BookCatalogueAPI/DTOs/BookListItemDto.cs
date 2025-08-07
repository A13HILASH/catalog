// DTO for outgoing list data (GET /api/Books)
// This is a simplified object for the main list view.
namespace BookCatalogueAPI.DTOs
{
    public class BookListItemDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Authors { get; set; } = string.Empty;
        public string Genres { get; set; } = string.Empty;
        public int Year { get; set; }
        public string CoverUrl { get; set; } = string.Empty;
    }
}
