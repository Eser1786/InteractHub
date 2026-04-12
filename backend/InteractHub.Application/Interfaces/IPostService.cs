using InteractHub.Application.Entities;
namespace InteractHub.Application.Interfaces;

public interface IPostService
{
    Task<List<Post>> GetAllAsync();
    Task<Post?> GetByIdAsync(int id);
    Task<Post> CreateAsync(Post post);
    Task<bool> DeleteAsync(int id);
}