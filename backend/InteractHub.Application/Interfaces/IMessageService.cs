using InteractHub.Application.Entities;

namespace InteractHub.Application.Interfaces;

public interface IMessageService
{
    Task<IEnumerable<Message>> GetMessagesBetweenUsersAsync(string userId1, string userId2);
    Task<Message> SendMessageAsync(string senderId, string receiverId, string content);
    Task MarkAsReadAsync(int messageId, string userId);
    Task<IEnumerable<Message>> GetUnreadMessagesAsync(string userId);
    
    /// <summary>
    /// Get latest message between two users
    /// </summary>
    Task<Message?> GetLatestMessageAsync(string userId1, string userId2);
}