using InteractHub.Application.Entities;
using InteractHub.Application.Entities.Enums;

namespace InteractHub.Application.Interfaces;

public interface INotificationService
{
    // Cơ bản
    Task<List<Notification>> GetByUserIdAsync(string userId);
    Task<Notification?> GetByIdAsync(int id);
    Task<Notification> CreateAsync(Notification notification);
    Task<bool> MarkAsReadAsync(int id);
    Task<bool> DeleteAsync(int id);
    
    // Business Logic - Notification Management
    /// <summary>
    /// Tạo notification và tự động lưu vào DB
    /// </summary>
    Task<Notification> CreateNotificationAsync(
        string userId, 
        string content, 
        NotificationType type,
        string? relatedUserId = null,
        int? relatedEntityId = null
    );
    
    /// <summary>
    /// Lấy notifications chưa đọc
    /// </summary>
    Task<List<Notification>> GetUnreadNotificationsAsync(string userId);
    
    /// <summary>
    /// Đánh dấu tất cả là đã đọc
    /// </summary>
    Task<bool> MarkAllAsReadAsync(string userId);
    
    /// <summary>
    /// Lấy số lượng notifications chưa đọc
    /// </summary>
    Task<int> GetUnreadCountAsync(string userId);
    
    /// <summary>
    /// Tạo notification khi có friend request
    /// </summary>
    Task<Notification> NotifyFriendRequestAsync(string receiverId, string senderId);
    
    /// <summary>
    /// Tạo notification khi friend request được chấp nhận
    /// </summary>
    Task<Notification> NotifyFriendRequestAcceptedAsync(string receiverId, string accepterId);
    
    /// <summary>
    /// Tạo notification khi có like
    /// </summary>
    Task<Notification> NotifyLikeAsync(string userId, string likerUserId, int postId);
    
    /// <summary>
    /// Tạo notification khi có comment
    /// </summary>
    Task<Notification> NotifyCommentAsync(string userId, string commenterUserId, int postId, string commentContent);
    
    /// <summary>
    /// Xóa notifications theo type
    /// </summary>
    Task<bool> DeleteNotificationsByTypeAsync(string userId, NotificationType type);
}