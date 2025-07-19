namespace BookCatalogueAPI.Models
{
    public class Book
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string Author { get; set; } = string.Empty;
        public string Genre { get; set; } = string.Empty;
        public int Year { get; set; }
        public string CoverUrl { get; set; } = string.Empty;
        public string OpenLibraryId { get; set; } = string.Empty;
    }
}
