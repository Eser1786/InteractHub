using Microsoft.EntityFrameworkCore;
using InteractHub.Application.Interfaces;
using InteractHub.Infrastructure.Data;
using InteractHub.Application.Entities;

namespace InteractHub.Infrastructure.Service;

public class PostService : IPostService
{
    private readonly AppDbContext _context;

    public PostService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Post> CreateAsync(Post post)
    {
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();
        return post;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var post = await _context.Posts.FindAsync(id);
        if(post == null)
        {
            return false;
        }

        _context.Posts.Remove(post);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<Post>> GetAllAsync()
    {
        return await _context.Posts.ToListAsync();
    }

    public async Task<Post?> GetByIdAsync(int id)
    {
        return await _context.Posts.FindAsync(id);
    }
}