// DTO for incoming data (POST and PUT requests)
// This is what the user sends to the API.
namespace BookCatalogueAPI.DTOs
{
    public class BookDto
    {
        public string Title { get; set; } = string.Empty;
        public string Authors { get; set; } = string.Empty; // Comma-separated string
        public string Genres { get; set; } = string.Empty;  // Comma-separated string
        public string Moods { get; set; } = string.Empty;
        public int Year { get; set; }
        public string CoverUrl { get; set; } = string.Empty;
        public string OpenLibraryId { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string BookUrl { get; set; } = string.Empty;
    }
}