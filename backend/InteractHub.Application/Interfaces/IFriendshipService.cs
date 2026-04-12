using InteractHub.Application.Entities;
namespace InteractHub.Application.Interfaces;

public interface IFriendshipService
{
    Task<Friendship?> GetByIdAsync(int id);
    Task<List<Friendship>> GetFriendsAsync(string userId);
    Task<Friendship> CreateAsync(Friendship friendship);
    Task<bool> UpdateAsync(Friendship friendship);
    Task<bool> DeleteAsync(int id);
}