using Microsoft.EntityFrameworkCore;
using BookCatalogueAPI.Models;

namespace BookCatalogueAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<Book> Book { get; set; }
    }
}
