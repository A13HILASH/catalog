using System.Collections.Generic;

namespace BookCatalogueAPI.Models
{
    public class Mood
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public ICollection<BookMood> BookMoods { get; set; } = new List<BookMood>();
    }
}