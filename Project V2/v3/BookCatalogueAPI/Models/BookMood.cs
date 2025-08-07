namespace BookCatalogueAPI.Models
{
    public class BookMood
    {
        public int BookId { get; set; }
        public Book Book { get; set; } = null!;
        public int MoodId { get; set; }
        public Mood Mood { get; set; } = null!;
    }
}