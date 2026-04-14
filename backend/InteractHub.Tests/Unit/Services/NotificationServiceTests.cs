using InteractHub.Application.Entities;
using InteractHub.Application.Entities.Enums;
using InteractHub.Infrastructure.Service;
using InteractHub.Tests.Common;

namespace InteractHub.Tests.Unit.Services;

public class NotificationServiceTests
{
    [Fact]
    // Kiểm tra tạo chuông thông báo mới: Phải điền đầy đủ dữ liệu (chưa đọc, nội dung) và lưu DB thành công.
    public async Task CreateNotificationAsync_ShouldPopulateAndPersistNotification()
    {
        using var context = TestDbContextFactory.Create();
        var service = new NotificationService(context);

        var notification = await service.CreateNotificationAsync("user-1", "Hello", NotificationType.System, "rel-1", 22);

        Assert.Equal("user-1", notification.UserId);
        Assert.Equal("Hello", notification.Content);
        Assert.False(notification.IsRead);
        Assert.Equal(1, await service.GetUnreadCountAsync("user-1"));
    }

    [Fact]
    // Kiểm tra chức năng đánh dấu đã đọc một mục: Trả về False nếu ID của thông báo không tồn tại.
    public async Task MarkAsReadAsync_ShouldReturnFalse_WhenNotificationMissing()
    {
        using var context = TestDbContextFactory.Create();
        var service = new NotificationService(context);

        var result = await service.MarkAsReadAsync(9999);

        Assert.False(result);
    }

    [Fact]
    // Kiểm tra chức năng Đọc tất cả thông báo: Phải cập nhật lại toàn bộ số đếm chưa đọc (UnreadCount) về 0.
    public async Task MarkAllAsReadAsync_ShouldUpdateUnreadNotifications()
    {
        using var context = TestDbContextFactory.Create();
        var service = new NotificationService(context);
        await service.CreateNotificationAsync("user-2", "n1", NotificationType.System);
        await service.CreateNotificationAsync("user-2", "n2", NotificationType.Comment);

        var updated = await service.MarkAllAsReadAsync("user-2");
        var count = await service.GetUnreadCountAsync("user-2");

        Assert.True(updated);
        Assert.Equal(0, count);
    }

    [Fact]
    // Kiểm tra dọn dẹp thông báo theo phân loại: Chỉ xoá đúng những thông báo thuộc phân loại chỉ định.
    public async Task DeleteNotificationsByTypeAsync_ShouldDeleteOnlyMatchingType()
    {
        using var context = TestDbContextFactory.Create();
        var service = new NotificationService(context);
        await service.CreateNotificationAsync("user-3", "fr", NotificationType.FriendRequest);
        await service.CreateNotificationAsync("user-3", "like", NotificationType.Like);

        var deleted = await service.DeleteNotificationsByTypeAsync("user-3", NotificationType.FriendRequest);
        var all = await service.GetByUserIdAsync("user-3");

        Assert.True(deleted);
        Assert.Single(all);
        Assert.Equal(NotificationType.Like, all[0].Type);
    }

    [Fact]
    // Kiểm tra thông báo khi bài viết bị bình luận bằng dòng chữ siêu dài: Chuỗi nội dung phải tự động được cắt ngắn gọn (có dấu ...).
    public async Task NotifyCommentAsync_ShouldTruncateLongCommentContent()
    {
        using var context = TestDbContextFactory.Create();
        context.Users.Add(new User
        {
            Id = "commenter",
            UserName = "commenter",
            Email = "commenter@mail.com",
            FullName = "Comment User"
        });
        await context.SaveChangesAsync();

        var service = new NotificationService(context);
        var longComment = new string('a', 60);
        var notification = await service.NotifyCommentAsync("target-user", "commenter", 20, longComment);

        Assert.Contains("...", notification.Content);
        Assert.Equal(NotificationType.Comment, notification.Type);
        Assert.Equal(20, notification.RelatedEntityId);
    }

    [Fact]
    // Kiểm tra xoá thông báo đơn lẻ an toàn: Xác nhận sau khi xóa thì dữ liệu tan biến khỏi danh sách cá nhân.
    public async Task DeleteAsync_ShouldReturnTrue_WhenNotificationExists()
    {
        using var context = TestDbContextFactory.Create();
        var service = new NotificationService(context);
        var notification = await service.CreateNotificationAsync("user-4", "cleanup", NotificationType.System);

        var deleted = await service.DeleteAsync(notification.Id);
        var remaining = await service.GetByUserIdAsync("user-4");

        Assert.True(deleted);
        Assert.Empty(remaining);
    }
}
