using Microsoft.EntityFrameworkCore;
using BookCatalogueAPI.Models;

namespace BookCatalogueAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Book> Book { get; set; } = null!;
        public DbSet<Author> Author { get; set; } = null!;
        public DbSet<Genre> Genre { get; set; } = null!;
        public DbSet<Mood> Mood { get; set; } = null!;
        public DbSet<BookAuthor> BookAuthor { get; set; } = null!;
        public DbSet<BookGenre> BookGenre { get; set; } = null!;
        public DbSet<BookMood> BookMood { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Configure User entity
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Configure Book relationships
            modelBuilder.Entity<Book>()
                .HasOne(b => b.User)
                .WithMany(u => u.Books)
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Author relationships
            modelBuilder.Entity<Author>()
                .HasOne(a => a.User)
                .WithMany(u => u.Authors)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Genre relationships
            modelBuilder.Entity<Genre>()
                .HasOne(g => g.User)
                .WithMany(u => u.Genres)
                .HasForeignKey(g => g.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Mood relationships
            modelBuilder.Entity<Mood>()
                .HasOne(m => m.User)
                .WithMany(u => u.Moods)
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure BookAuthor many-to-many relationship
            modelBuilder.Entity<BookAuthor>()
                .HasKey(ba => new { ba.BookId, ba.AuthorId });

            modelBuilder.Entity<BookAuthor>()
                .HasOne(ba => ba.Book)
                .WithMany(b => b.BookAuthors)
                .HasForeignKey(ba => ba.BookId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<BookAuthor>()
                .HasOne(ba => ba.Author)
                .WithMany(a => a.BookAuthors)
                .HasForeignKey(ba => ba.AuthorId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent cascade conflicts

            // Configure BookGenre many-to-many relationship
            modelBuilder.Entity<BookGenre>()
                .HasKey(bg => new { bg.BookId, bg.GenreId });

            modelBuilder.Entity<BookGenre>()
                .HasOne(bg => bg.Book)
                .WithMany(b => b.BookGenres)
                .HasForeignKey(bg => bg.BookId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<BookGenre>()
                .HasOne(bg => bg.Genre)
                .WithMany(g => g.BookGenres)
                .HasForeignKey(bg => bg.GenreId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent cascade conflicts

            // Configure BookMood many-to-many relationship
            modelBuilder.Entity<BookMood>()
                .HasKey(bm => new { bm.BookId, bm.MoodId });

            modelBuilder.Entity<BookMood>()
                .HasOne(bm => bm.Book)
                .WithMany(b => b.BookMoods)
                .HasForeignKey(bm => bm.BookId)
                .OnDelete(DeleteBehavior.Cascade);
            
            modelBuilder.Entity<BookMood>()
                .HasOne(bm => bm.Mood)
                .WithMany(m => m.BookMoods)
                .HasForeignKey(bm => bm.MoodId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent cascade conflicts

            // Add unique constraints for user-specific names
            modelBuilder.Entity<Author>()
                .HasIndex(a => new { a.UserId, a.Name })
                .IsUnique();

            modelBuilder.Entity<Genre>()
                .HasIndex(g => new { g.UserId, g.Name })
                .IsUnique();

            modelBuilder.Entity<Mood>()
                .HasIndex(m => new { m.UserId, m.Name })
                .IsUnique();
        }
    }
}