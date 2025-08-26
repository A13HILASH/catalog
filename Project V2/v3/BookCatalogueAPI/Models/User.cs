using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace BookCatalogueAPI.Models
{
    public class User
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        [StringLength(255)]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public ICollection<Book> Books { get; set; } = new List<Book>();
        public ICollection<Author> Authors { get; set; } = new List<Author>();
        public ICollection<Genre> Genres { get; set; } = new List<Genre>();
        public ICollection<Mood> Moods { get; set; } = new List<Mood>();
    }
}