// Author.cs
using System.Collections.Generic;

namespace BookCatalogueAPI.Models
{
    public class Author
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;

        // Navigation property for the many-to-many relationship
        public ICollection<BookAuthor> BookAuthors { get; set; } = new List<BookAuthor>();
    }
}
