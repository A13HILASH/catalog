using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace BookCatalogueAPI.Models
{
    public class Mood
    {
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        public string Name { get; set; } = string.Empty;
        
        // Navigation properties
        public User User { get; set; } = null!;
        public ICollection<BookMood> BookMoods { get; set; } = new List<BookMood>();
    }
}