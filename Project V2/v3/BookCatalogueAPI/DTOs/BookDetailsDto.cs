// DTO for outgoing detailed data (GET /api/Books/{id})
// This is a detailed object for a single book's view.
namespace BookCatalogueAPI.DTOs
{
    public class BookDetailsDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public List<string> Authors { get; set; } = new List<string>();
        public List<string> Genres { get; set; } = new List<string>();
        public int Year { get; set; }
        public string CoverUrl { get; set; } = string.Empty;
        public string OpenLibraryId { get; set; } = string.Empty;
        public List<string> Moods { get; set; } = new List<string>();
        public string Description { get; set; } = string.Empty;
        public string BookUrl { get; set; } = string.Empty;
    }
}
