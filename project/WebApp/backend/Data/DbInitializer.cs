/*using System.Linq;
using Microsoft.EntityFrameworkCore;

public static class DbInitializer
{
    public static void Seed(BookContext context)
    {
        // database created
        context.Database.Migrate();

        // If there are any books already, skip seeding
        if (context.Books.Any()) return;

        var books = new Book[]
        {
            new Book { Title = "Atomic Habits", Author = "James Clear", Year = 2018 },
            new Book { Title = "Clean Code", Author = "Robert C. Martin", Year = 2008 },
            new Book { Title = "The Pragmatic Programmer", Author = "Andrew Hunt", Year = 1999 },
            new Book { Title = "Deep Work", Author = "Cal Newport", Year = 2016 }
        };

        context.Books.AddRange(books);
        context.SaveChanges();
    }
}

*/