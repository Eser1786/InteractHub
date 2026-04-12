using InteractHub.Application.Entities;
namespace InteractHub.Application.Interfaces;

public interface IUserService
{
    Task<List<User>> GetUsersAsync();
    Task<User?> GetByIdAsync(string id);
    Task<User?> GetByEmailAsync(string email);
    Task<User> CreateAsync(User user);
    Task<bool> UpdateAsync(User user);
    Task<bool> DeleteAsync(User user);
}