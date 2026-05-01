using Microsoft.EntityFrameworkCore;
using InteractHub.Application.Interfaces;
using InteractHub.Infrastructure.Data;
using InteractHub.Application.Entities;

namespace InteractHub.Infrastructure.Service;

public class MessageService : IMessageService
{
    private readonly AppDbContext _context;

    public MessageService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Message>> GetMessagesBetweenUsersAsync(string userId1, string userId2)
    {
        return await _context.Messages
            .Where(m => (m.SenderId == userId1 && m.ReceiverId == userId2) ||
                        (m.SenderId == userId2 && m.ReceiverId == userId1))
            .Include(m => m.Sender)
            .Include(m => m.Receiver)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();
    }

    public async Task<Message> SendMessageAsync(string senderId, string receiverId, string content)
    {
        var message = new Message
        {
            SenderId = senderId,
            ReceiverId = receiverId,
            Content = content,
            CreatedAt = DateTime.Now,
            IsRead = false
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        await _context.Entry(message).Reference(m => m.Sender).LoadAsync();
        await _context.Entry(message).Reference(m => m.Receiver).LoadAsync();

        return message;
    }

    public async Task MarkAsReadAsync(int messageId, string userId)
    {
        var message = await _context.Messages.FindAsync(messageId);
        if (message != null && message.ReceiverId == userId)
        {
            message.IsRead = true;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<IEnumerable<Message>> GetUnreadMessagesAsync(string userId)
    {
        return await _context.Messages
            .Where(m => m.ReceiverId == userId && !m.IsRead)
            .Include(m => m.Sender)
            .ToListAsync();
    }

    public async Task<Message?> GetLatestMessageAsync(string userId1, string userId2)
    {
        return await _context.Messages
            .Where(m => (m.SenderId == userId1 && m.ReceiverId == userId2) ||
                        (m.SenderId == userId2 && m.ReceiverId == userId1))
            .Include(m => m.Sender)
            .Include(m => m.Receiver)
            .OrderByDescending(m => m.CreatedAt)
            .FirstOrDefaultAsync();
    }
}