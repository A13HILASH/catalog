using System.Collections.Generic;

namespace BookCatalogueAPI.Models
{
    public class Genre
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;

        // Navigation property for the many-to-many relationship
        public ICollection<BookGenre> BookGenres { get; set; } = new List<BookGenre>();
    }
}