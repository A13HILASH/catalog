using System.Collections.Generic;

namespace BookCatalogueAPI.Models
{
    public class Book
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public int Year { get; set; }
        public string CoverUrl { get; set; } = string.Empty;
        public string OpenLibraryId { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string BookUrl { get; set; } = string.Empty;

        // Navigation properties for the many-to-many relationships
        public ICollection<BookAuthor> BookAuthors { get; set; } = new List<BookAuthor>();
        public ICollection<BookGenre> BookGenres { get; set; } = new List<BookGenre>();
        public ICollection<BookMood> BookMoods { get; set; } = new List<BookMood>();
    }
}
