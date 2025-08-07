using BookCatalogueAPI.Data;
using Microsoft.EntityFrameworkCore;
using BookCatalogueAPI.Interfaces;
using BookCatalogueAPI.Repositories;
using BookCatalogueAPI.Managers;

var builder = WebApplication.CreateBuilder(args);

// Add Services
builder.Services.AddControllers();
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
    
//  Add CORS
builder.Services.AddCors(opt => opt.AddPolicy("AllowReact",
    b => b.WithOrigins("http://localhost:3000")
          .AllowAnyHeader()
          .AllowAnyMethod()));

// Register the new services
builder.Services.AddScoped<IBookRepository, BookRepository>();
builder.Services.AddScoped<IBookManager, BookManager>();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

//  Apply CORS before anything else
app.UseCors("AllowReact");

// (Optional) Disable HTTPS redirection if not using https in dev
// Comment out below if you don’t want redirect issues
// app.UseHttpsRedirection();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();
app.MapControllers();
app.Run();
