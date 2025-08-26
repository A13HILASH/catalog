using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace BookCatalogueAPI.Models
{
    public class Author
    {
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        public string Name { get; set; } = string.Empty;

        // Navigation properties
        public User User { get; set; } = null!;
        public ICollection<BookAuthor> BookAuthors { get; set; } = new List<BookAuthor>();
    }
}