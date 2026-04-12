using Microsoft.EntityFrameworkCore;
using InteractHub.Application.Interfaces;
using InteractHub.Infrastructure.Data;
using InteractHub.Application.Entities;

namespace InteractHub.Infrastructure.Service;

public class CommentService : ICommentService
{
    private readonly AppDbContext _context;

    public CommentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Comment>> GetAllAsync()
    {
        return await _context.Comments.Include(c => c.Post).Include(c => c.User).ToListAsync();
    }

    public async Task<Comment?> GetByIdAsync(int id)
    {
        return await _context.Comments.Include(c => c.Post).Include(c => c.User).FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<List<Comment>> GetByPostIdAsync(int postId)
    {
        return await _context.Comments.Where(c => c.PostId == postId).Include(c => c.User).ToListAsync();
    }

    public async Task<Comment> CreateAsync(Comment comment)
    {
        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();
        return comment;
    }

    public async Task<bool> UpdateAsync(Comment comment)
    {
        _context.Comments.Update(comment);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var comment = await _context.Comments.FindAsync(id);
        if (comment == null)
            return false;

        _context.Comments.Remove(comment);
        await _context.SaveChangesAsync();
        return true;
    }
}
