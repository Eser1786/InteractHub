using InteractHub.Application.Entities;
using InteractHub.Application.Entities.Enums;
using InteractHub.Application.Interfaces;
using InteractHub.Infrastructure.Service;
using InteractHub.Tests.Common;
using Moq;

namespace InteractHub.Tests.Unit.Services;

public class FriendshipServiceTests
{
    [Fact]
    // Kiểm tra chức năng gửi kết bạn: Phải ném lỗi nếu người gửi và nhận là cùng một người.
    public async Task SendFriendRequestAsync_ShouldThrow_WhenSenderEqualsReceiver()
    {
        using var context = TestDbContextFactory.Create();
        var notificationMock = new Mock<INotificationService>();
        var service = new FriendshipService(context, notificationMock.Object);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.SendFriendRequestAsync("same-user", "same-user"));
    }

    [Fact]
    // Kiểm tra tránh lặp request: Phải ném lỗi nếu cả 2 bên đã từng có quan hệ kết bạn/gửi yc.
    public async Task SendFriendRequestAsync_ShouldThrow_WhenExistingFriendshipExists()
    {
        using var context = TestDbContextFactory.Create();
        context.Friendships.Add(new Friendship { UserId = "u1", FriendId = "u2", Status = FriendshipStatus.Pending });
        await context.SaveChangesAsync();

        var notificationMock = new Mock<INotificationService>();
        var service = new FriendshipService(context, notificationMock.Object);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.SendFriendRequestAsync("u1", "u2"));
    }

    [Fact]
    // Kiểm tra gửi yêu cầu thành công: Hệ thống tạo trạng thái Pending và gửi Noti cho bên B.
    public async Task SendFriendRequestAsync_ShouldCreatePendingAndNotifyReceiver()
    {
        using var context = TestDbContextFactory.Create();
        var notificationMock = new Mock<INotificationService>();
        notificationMock
            .Setup(n => n.NotifyFriendRequestAsync("u2", "u1"))
            .ReturnsAsync(new Notification { UserId = "u2", Content = "Friend request", Type = NotificationType.FriendRequest });
        var service = new FriendshipService(context, notificationMock.Object);

        var friendship = await service.SendFriendRequestAsync("u1", "u2");

        Assert.Equal(FriendshipStatus.Pending, friendship.Status);
        notificationMock.Verify(n => n.NotifyFriendRequestAsync("u2", "u1"), Times.Once);
    }

    [Fact]
    // Kiểm tra chấp nhận kết bạn an toàn: Quăng lỗi nếu đối phương chưa hề gửi yêu cầu nào.
    public async Task AcceptFriendRequestAsync_ShouldThrow_WhenRequestDoesNotExist()
    {
        using var context = TestDbContextFactory.Create();
        var service = new FriendshipService(context, Mock.Of<INotificationService>());

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.AcceptFriendRequestAsync(777));
    }

    [Fact]
    // Kiểm tra quy trình chấp nhận: Trạng thái đổi qua Accepted và gửi chuông thông báo lại cho bên A.
    public async Task AcceptFriendRequestAsync_ShouldSetStatusAcceptedAndNotifySender()
    {
        using var context = TestDbContextFactory.Create();
        context.Users.AddRange(
            new User { Id = "sender", UserName = "sender", Email = "sender@mail.com", FullName = "Sender" },
            new User { Id = "receiver", UserName = "receiver", Email = "receiver@mail.com", FullName = "Receiver" });

        var friendship = new Friendship { UserId = "sender", FriendId = "receiver", Status = FriendshipStatus.Pending };
        context.Friendships.Add(friendship);
        await context.SaveChangesAsync();

        var notificationMock = new Mock<INotificationService>();
        notificationMock
            .Setup(n => n.NotifyFriendRequestAcceptedAsync("sender", "receiver"))
            .ReturnsAsync(new Notification { UserId = "sender", Type = NotificationType.FriendRequestAccepted, Content = "Accepted" });
        var service = new FriendshipService(context, notificationMock.Object);

        var updated = await service.AcceptFriendRequestAsync(friendship.Id);

        Assert.Equal(FriendshipStatus.Accepted, updated.Status);
        notificationMock.Verify(n => n.NotifyFriendRequestAcceptedAsync("sender", "receiver"), Times.Once);
    }

    [Fact]
    // Kiểm tra lỗi trạng thái luồng: Quăng lỗi nếu chấp nhận 1 yêu cầu không hề ở trạng thái Pending.
    public async Task AcceptFriendRequestAsync_ShouldThrow_WhenStatusIsNotPending()
    {
        using var context = TestDbContextFactory.Create();
        var friendship = new Friendship { UserId = "u1", FriendId = "u2", Status = FriendshipStatus.Accepted };
        context.Friendships.Add(friendship);
        await context.SaveChangesAsync();
        var service = new FriendshipService(context, Mock.Of<INotificationService>());

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.AcceptFriendRequestAsync(friendship.Id));
    }

    [Fact]
    // Kiểm tra đẩy lùi yêu cầu: Nếu đang Pending thì đổi trạng thái sang Declined, trả về True.
    public async Task DeclineFriendRequestAsync_ShouldReturnTrue_WhenPendingRequestExists()
    {
        using var context = TestDbContextFactory.Create();
        context.Users.AddRange(
            new User { Id = "u1", UserName = "u1", Email = "u1@mail.com", FullName = "U1" },
            new User { Id = "u2", UserName = "u2", Email = "u2@mail.com", FullName = "U2" });
        var friendship = new Friendship { UserId = "u1", FriendId = "u2", Status = FriendshipStatus.Pending };
        context.Friendships.Add(friendship);
        await context.SaveChangesAsync();

        var service = new FriendshipService(context, Mock.Of<INotificationService>());
        var result = await service.DeclineFriendRequestAsync(friendship.Id);

        Assert.True(result);
        Assert.Equal(FriendshipStatus.Declined, friendship.Status);
    }

    [Fact]
    // Kiểm tra tính nhất quán: Trả về False nếu người dùng cố từ chối một Id yêu cầu lung tung.
    public async Task DeclineFriendRequestAsync_ShouldReturnFalse_WhenRequestIsNotPending()
    {
        using var context = TestDbContextFactory.Create();
        var friendship = new Friendship { UserId = "u1", FriendId = "u2", Status = FriendshipStatus.Accepted };
        context.Friendships.Add(friendship);
        await context.SaveChangesAsync();
        var service = new FriendshipService(context, Mock.Of<INotificationService>());

        var result = await service.DeclineFriendRequestAsync(friendship.Id);

        Assert.False(result);
    }

    [Fact]
    // Kiểm tra chức năng Hủy kết bạn (Unfriend): Hủy tình bạn thành công và xóa dữ liệu khỏi DB.
    public async Task RemoveFriendAsync_ShouldReturnTrue_WhenFriendshipAccepted()
    {
        using var context = TestDbContextFactory.Create();
        context.Users.AddRange(
            new User { Id = "u1", UserName = "u1", Email = "u1@mail.com", FullName = "U1" },
            new User { Id = "u2", UserName = "u2", Email = "u2@mail.com", FullName = "U2" });
        context.Friendships.Add(new Friendship { UserId = "u1", FriendId = "u2", Status = FriendshipStatus.Accepted });
        await context.SaveChangesAsync();

        var service = new FriendshipService(context, Mock.Of<INotificationService>());
        var removed = await service.RemoveFriendAsync("u1", "u2");

        Assert.True(removed);
        Assert.Empty(context.Friendships);
    }

    [Fact]
    // Kiểm tra tính năng Chặn (Block): Sinh ra 1 quan hệ status = Blocked giữa 2 người thành công.
    public async Task BlockUserAsync_ShouldCreateBlockedFriendship_WhenNoExistingRecord()
    {
        using var context = TestDbContextFactory.Create();
        var service = new FriendshipService(context, Mock.Of<INotificationService>());

        var blocked = await service.BlockUserAsync("u1", "u3");

        Assert.Equal(FriendshipStatus.Blocked, blocked.Status);
        Assert.Single(context.Friendships);
    }

    [Fact]
    // Kiểm tra tra cứu linh hoạt: Phải dò ra đúng trạng thái kết nối chuẩn chỉnh của 2 id bất kì.
    public async Task CheckFriendshipStatusAsync_ShouldReturnStatus_WhenFriendshipExists()
    {
        using var context = TestDbContextFactory.Create();
        context.Friendships.Add(new Friendship { UserId = "x1", FriendId = "x2", Status = FriendshipStatus.Accepted });
        await context.SaveChangesAsync();
        var service = new FriendshipService(context, Mock.Of<INotificationService>());

        var status = await service.CheckFriendshipStatusAsync("x1", "x2");

        Assert.Equal(FriendshipStatus.Accepted, status);
    }

    [Fact]
    // Kiểm tra lọc danh sách gửi tới: Lọc và chỉ lấy ra những người có trạng thái đúng là Pending.
    public async Task GetPendingRequestsAsync_ShouldReturnOnlyPendingForReceiver()
    {
        using var context = TestDbContextFactory.Create();
        context.Users.AddRange(
            new User { Id = "sender1", UserName = "sender1", Email = "s1@mail.com", FullName = "Sender 1" },
            new User { Id = "sender2", UserName = "sender2", Email = "s2@mail.com", FullName = "Sender 2" },
            new User { Id = "receiver", UserName = "receiver", Email = "r@mail.com", FullName = "Receiver" });
        context.Friendships.AddRange(
            new Friendship { UserId = "sender1", FriendId = "receiver", Status = FriendshipStatus.Pending },
            new Friendship { UserId = "sender2", FriendId = "receiver", Status = FriendshipStatus.Pending },
            new Friendship { UserId = "sender1", FriendId = "sender2", Status = FriendshipStatus.Accepted });
        await context.SaveChangesAsync();

        var service = new FriendshipService(context, Mock.Of<INotificationService>());
        var pending = await service.GetPendingRequestsAsync("receiver");

        Assert.Equal(2, pending.Count);
        Assert.All(pending, p => Assert.Equal(FriendshipStatus.Pending, p.Status));
    }

    [Fact]
    // Kiểm tra phân trang danh sách lời mời: Metadata đếm tổng số trang và chia phần dư phải chính xác.
    public async Task GetPendingRequestsPaginatedAsync_ShouldReturnCorrectMetadata()
    {
        using var context = TestDbContextFactory.Create();
        context.Users.Add(new User { Id = "receiver", UserName = "receiver", Email = "receiver@mail.com", FullName = "Receiver" });
        for (var i = 0; i < 5; i++)
        {
            context.Users.Add(new User { Id = $"s{i}", UserName = $"s{i}", Email = $"s{i}@mail.com", FullName = $"Sender {i}" });
            context.Friendships.Add(new Friendship { UserId = $"s{i}", FriendId = "receiver", Status = FriendshipStatus.Pending });
        }

        await context.SaveChangesAsync();

        var service = new FriendshipService(context, Mock.Of<INotificationService>());
        var result = await service.GetPendingRequestsPaginatedAsync("receiver", pageNumber: 2, pageSize: 2);

        Assert.Equal(2, result.Requests.Count);
        Assert.Equal(5, result.Metadata.TotalCount);
        Assert.Equal(3, result.Metadata.TotalPages);
    }
}
