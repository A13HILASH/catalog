using Microsoft.EntityFrameworkCore;
using BookCatalogueAPI.Models;

namespace BookCatalogueAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        // The old DbSet<Book> has been updated
        public DbSet<Book> Book { get; set; } = null!;
        
        // New DbSet properties for the many-to-many relationship
        public DbSet<Author> Author { get; set; } = null!;
        public DbSet<Genre> Genre { get; set; } = null!;
        public DbSet<Mood> Mood { get; set; } = null!;
        public DbSet<BookAuthor> BookAuthor { get; set; } = null!;
        public DbSet<BookGenre> BookGenre { get; set; } = null!;
        public DbSet<BookMood> BookMood { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Configure the many-to-many relationship for BookAuthor
            modelBuilder.Entity<BookAuthor>()
                .HasKey(ba => new { ba.BookId, ba.AuthorId });

            modelBuilder.Entity<BookAuthor>()
                .HasOne(ba => ba.Book)
                .WithMany(b => b.BookAuthors)
                .HasForeignKey(ba => ba.BookId);

            modelBuilder.Entity<BookAuthor>()
                .HasOne(ba => ba.Author)
                .WithMany(a => a.BookAuthors)
                .HasForeignKey(ba => ba.AuthorId);

            // Configure the many-to-many relationship for BookGenre
            modelBuilder.Entity<BookGenre>()
                .HasKey(bg => new { bg.BookId, bg.GenreId });

            modelBuilder.Entity<BookGenre>()
                .HasOne(bg => bg.Book)
                .WithMany(b => b.BookGenres)
                .HasForeignKey(bg => bg.BookId);

            modelBuilder.Entity<BookGenre>()
                .HasOne(bg => bg.Genre)
                .WithMany(g => g.BookGenres)
                .HasForeignKey(bg => bg.GenreId);
            
            // Configure the many-to-many relationship for BookMood
            modelBuilder.Entity<BookMood>()
                .HasKey(bm => new { bm.BookId, bm.MoodId });

            modelBuilder.Entity<BookMood>()
                .HasOne(bm => bm.Book)
                .WithMany(b => b.BookMoods)
                .HasForeignKey(bm => bm.BookId);
            
            modelBuilder.Entity<BookMood>()
                .HasOne(bm => bm.Mood)
                .WithMany(m => m.BookMoods)
                .HasForeignKey(bm => bm.MoodId);
        }
    }
}
