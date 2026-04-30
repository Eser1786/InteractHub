namespace InteractHub.Application.Entities.Enums;

public enum NotificationType
{
    FriendRequest = 0,      // Lời mời kết bạn
    FriendRequestAccepted = 1,  // Chấp nhận lời mời
    Like = 2,               // Thích bài viết
    Comment = 3,            // Bình luận bài viết
    CommentReply = 4,       // Trả lời bình luận
    Follow = 5,             // Follow
    PostReport = 6,         // Report bài viết
    Message = 7,            // Tin nhắn
    System = 8              // Thông báo hệ thống
}
