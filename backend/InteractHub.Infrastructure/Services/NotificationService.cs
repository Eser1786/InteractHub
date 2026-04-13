using Microsoft.EntityFrameworkCore;
using InteractHub.Application.Interfaces;
using InteractHub.Infrastructure.Data;
using InteractHub.Application.Entities;
using InteractHub.Application.Entities.Enums;

namespace InteractHub.Infrastructure.Service;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;

    public NotificationService(AppDbContext context)
    {
        _context = context;
    }

    // ==================== CƠ BẢN ====================

    public async Task<List<Notification>> GetByUserIdAsync(string userId)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId)
            .Include(n => n.RelatedUser)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }

    public async Task<Notification?> GetByIdAsync(int id)
    {
        return await _context.Notifications
            .Include(n => n.RelatedUser)
            .FirstOrDefaultAsync(n => n.Id == id);
    }

    public async Task<Notification> CreateAsync(Notification notification)
    {
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
        return notification;
    }

    public async Task<bool> MarkAsReadAsync(int id)
    {
        var notification = await _context.Notifications.FindAsync(id);
        if (notification == null)
            return false;

        notification.IsRead = true;
        _context.Notifications.Update(notification);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var notification = await _context.Notifications.FindAsync(id);
        if (notification == null)
            return false;

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();
        return true;
    }

    // ==================== BUSINESS LOGIC ====================

    /// <summary>
    /// Tạo notification và tự động lưu vào DB
    /// </summary>
    public async Task<Notification> CreateNotificationAsync(
        string userId,
        string content,
        NotificationType type,
        string? relatedUserId = null,
        int? relatedEntityId = null)
    {
        var notification = new Notification
        {
            UserId = userId,
            Content = content,
            Type = type,
            RelatedUserId = relatedUserId,
            RelatedEntityId = relatedEntityId,
            IsRead = false
        };

        return await CreateAsync(notification);
    }

    /// <summary>
    /// Lấy notifications chưa đọc
    /// </summary>
    public async Task<List<Notification>> GetUnreadNotificationsAsync(string userId)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .Include(n => n.RelatedUser)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }

    /// <summary>
    /// Đánh dấu tất cả là đã đọc
    /// </summary>
    public async Task<bool> MarkAllAsReadAsync(string userId)
    {
        var unreadNotifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        if (unreadNotifications.Count == 0)
            return true;

        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
        }

        _context.Notifications.UpdateRange(unreadNotifications);
        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Lấy số lượng notifications chưa đọc
    /// </summary>
    public async Task<int> GetUnreadCountAsync(string userId)
    {
        return await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    /// <summary>
    /// Tạo notification khi có friend request
    /// </summary>
    public async Task<Notification> NotifyFriendRequestAsync(string receiverId, string senderId)
    {
        var sender = await _context.Users.FindAsync(senderId);
        var content = $"{sender?.FullName} đã gửi lời mời kết bạn";

        return await CreateNotificationAsync(
            receiverId,
            content,
            NotificationType.FriendRequest,
            senderId
        );
    }

    /// <summary>
    /// Tạo notification khi friend request được chấp nhận
    /// </summary>
    public async Task<Notification> NotifyFriendRequestAcceptedAsync(string receiverId, string accepterId)
    {
        var accepter = await _context.Users.FindAsync(accepterId);
        var content = $"{accepter?.FullName} đã chấp nhận lời mời kết bạn";

        return await CreateNotificationAsync(
            receiverId,
            content,
            NotificationType.FriendRequestAccepted,
            accepterId
        );
    }

    /// <summary>
    /// Tạo notification khi có like
    /// </summary>
    public async Task<Notification> NotifyLikeAsync(string userId, string likerUserId, int postId)
    {
        var liker = await _context.Users.FindAsync(likerUserId);
        var content = $"{liker?.FullName} đã thích bài viết của bạn";

        return await CreateNotificationAsync(
            userId,
            content,
            NotificationType.Like,
            likerUserId,
            postId
        );
    }

    /// <summary>
    /// Tạo notification khi có comment
    /// </summary>
    public async Task<Notification> NotifyCommentAsync(string userId, string commenterUserId, int postId, string commentContent)
    {
        var commenter = await _context.Users.FindAsync(commenterUserId);
        var preview = commentContent.Length > 50 ? commentContent.Substring(0, 50) + "..." : commentContent;
        var content = $"{commenter?.FullName} đã bình luận: \"{preview}\"";

        return await CreateNotificationAsync(
            userId,
            content,
            NotificationType.Comment,
            commenterUserId,
            postId
        );
    }

    /// <summary>
    /// Xóa notifications theo type
    /// </summary>
    public async Task<bool> DeleteNotificationsByTypeAsync(string userId, NotificationType type)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && n.Type == type)
            .ToListAsync();

        if (notifications.Count == 0)
            return true;

        _context.Notifications.RemoveRange(notifications);
        await _context.SaveChangesAsync();
        return true;
    }
}
