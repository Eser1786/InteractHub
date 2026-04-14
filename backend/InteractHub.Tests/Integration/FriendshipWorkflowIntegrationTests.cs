using InteractHub.Application.Entities;
using InteractHub.Application.Entities.Enums;
using InteractHub.Infrastructure.Service;
using InteractHub.Tests.Common;

namespace InteractHub.Tests.Integration;

public class FriendshipWorkflowIntegrationTests
{
    [Fact]
    // Kiểm tra toàn bộ luồng tích hợp: Gửi kết bạn -> Sinh thông báo -> Chấp nhận -> Sinh thông báo đã kết bạn.
    public async Task SendAndAcceptFriendRequest_ShouldCreateNotificationsAndAcceptedFriendship()
    {
        using var context = TestDbContextFactory.Create();
        context.Users.AddRange(
            new User { Id = "sender", UserName = "sender", Email = "sender@mail.com", FullName = "Sender User" },
            new User { Id = "receiver", UserName = "receiver", Email = "receiver@mail.com", FullName = "Receiver User" });
        await context.SaveChangesAsync();

        var notificationService = new NotificationService(context);
        var friendshipService = new FriendshipService(context, notificationService);

        var friendship = await friendshipService.SendFriendRequestAsync("sender", "receiver");
        var accepted = await friendshipService.AcceptFriendRequestAsync(friendship.Id);
        var senderNotifications = await notificationService.GetByUserIdAsync("sender");
        var receiverNotifications = await notificationService.GetByUserIdAsync("receiver");

        Assert.Equal(FriendshipStatus.Accepted, accepted.Status);
        Assert.Contains(receiverNotifications, n => n.Type == NotificationType.FriendRequest);
        Assert.Contains(senderNotifications, n => n.Type == NotificationType.FriendRequestAccepted);
    }

    [Fact]
    // Kiểm tra cơ chế phân trang danh sách bạn bè đã chấp nhận: Đảm bảo đếm tổng đúng và chia trang hợp lý.
    public async Task GetAcceptedFriendsPaginatedAsync_ShouldReturnCorrectPageMetadata()
    {
        using var context = TestDbContextFactory.Create();
        context.Users.Add(new User { Id = "user-main", UserName = "user-main", Email = "main@mail.com", FullName = "Main User" });
        for (var i = 0; i < 5; i++)
        {
            context.Users.Add(new User
            {
                Id = $"friend-{i}",
                UserName = $"friend-{i}",
                Email = $"friend-{i}@mail.com",
                FullName = $"Friend {i}"
            });
            context.Friendships.Add(new Friendship
            {
                UserId = "user-main",
                FriendId = $"friend-{i}",
                Status = FriendshipStatus.Accepted
            });
        }
        await context.SaveChangesAsync();

        var friendshipService = new FriendshipService(context, Moq.Mock.Of<InteractHub.Application.Interfaces.INotificationService>());
        var result = await friendshipService.GetAcceptedFriendsPaginatedAsync("user-main", pageNumber: 2, pageSize: 2);

        Assert.Equal(2, result.Friends.Count);
        Assert.Equal(5, result.Metadata.TotalCount);
        Assert.Equal(3, result.Metadata.TotalPages);
    }
}
