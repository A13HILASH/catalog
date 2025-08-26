// IAuthService.cs
using BookCatalogueAPI.DTOs;
using BookCatalogueAPI.Models;

namespace BookCatalogueAPI.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto?> RegisterAsync(RegisterDto registerDto);
        Task<AuthResponseDto?> LoginAsync(LoginDto loginDto);
        Task<User?> GetUserByIdAsync(int userId);
        Task<User?> GetUserByUsernameAsync(string username);
        string GenerateJwtToken(User user);
    }
}