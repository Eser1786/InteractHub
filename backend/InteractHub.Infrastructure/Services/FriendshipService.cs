using Microsoft.EntityFrameworkCore;
using InteractHub.Application.Interfaces;
using InteractHub.Infrastructure.Data;
using InteractHub.Application.Entities;

namespace InteractHub.Infrastructure.Service;

public class FriendshipService : IFriendshipService
{
    private readonly AppDbContext _context;

    public FriendshipService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Friendship?> GetByIdAsync(int id)
    {
        return await _context.Friendships
            .Include(f => f.User)
            .Include(f => f.Friend)
            .FirstOrDefaultAsync(f => f.Id == id);
    }

    public async Task<List<Friendship>> GetFriendsAsync(string userId)
    {
        return await _context.Friendships
            .Where(f => f.UserId == userId || f.FriendId == userId)
            .Include(f => f.User)
            .Include(f => f.Friend)
            .ToListAsync();
    }

    public async Task<Friendship> CreateAsync(Friendship friendship)
    {
        _context.Friendships.Add(friendship);
        await _context.SaveChangesAsync();
        return friendship;
    }

    public async Task<bool> UpdateAsync(Friendship friendship)
    {
        _context.Friendships.Update(friendship);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var friendship = await _context.Friendships.FindAsync(id);
        if (friendship == null)
            return false;

        _context.Friendships.Remove(friendship);
        await _context.SaveChangesAsync();
        return true;
    }
}
