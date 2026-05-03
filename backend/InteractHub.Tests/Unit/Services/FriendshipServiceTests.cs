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
    public async Task SendFriendRequestAsync_ShouldThrowException_WhenSenderEqualsReceiver()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var notificationMock = new Mock<INotificationService>();
        var service = new FriendshipService(context, notificationMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.SendFriendRequestAsync("same-user", "same-user"));
    }

    [Fact]
    public async Task SendFriendRequestAsync_ShouldThrowException_WhenFriendshipAlreadyExists()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        context.Friendships.Add(new Friendship { UserId = "u1", FriendId = "u2", Status = FriendshipStatus.Pending });
        await context.SaveChangesAsync();

        var notificationMock = new Mock<INotificationService>();
        var service = new FriendshipService(context, notificationMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.SendFriendRequestAsync("u1", "u2"));
    }

    [Fact]
    public async Task SendFriendRequestAsync_ShouldCreatePendingFriendship()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var notificationMock = new Mock<INotificationService>();
        notificationMock
            .Setup(n => n.NotifyFriendRequestAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new Notification { Type = NotificationType.FriendRequest });
        var service = new FriendshipService(context, notificationMock.Object);

        // Act
        var friendship = await service.SendFriendRequestAsync("u1", "u2");

        // Assert
        Assert.NotNull(friendship);
        Assert.Equal(FriendshipStatus.Pending, friendship.Status);
    }

    [Fact]
    public async Task DeclineFriendRequestAsync_ShouldReturnFalse_WhenNotPending()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        context.Friendships.Add(new Friendship { UserId = "u1", FriendId = "u2", Status = FriendshipStatus.Accepted });
        await context.SaveChangesAsync();

        var notificationMock = new Mock<INotificationService>();
        var service = new FriendshipService(context, notificationMock.Object);

        // Act
        var result = await service.DeclineFriendRequestAsync("u2", "u1");

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task RemoveFriendAsync_ShouldReturnTrue_WhenFriendshipExists()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        context.Friendships.Add(new Friendship { UserId = "u1", FriendId = "u2", Status = FriendshipStatus.Accepted });
        await context.SaveChangesAsync();

        var notificationMock = new Mock<INotificationService>();
        var service = new FriendshipService(context, notificationMock.Object);

        // Act
        var result = await service.RemoveFriendAsync("u1", "u2");

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task GetAcceptedFriendsAsync_ShouldReturnAcceptedFriendships()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        context.Friendships.AddRange(
            new Friendship { UserId = "u1", FriendId = "u2", Status = FriendshipStatus.Accepted },
            new Friendship { UserId = "u1", FriendId = "u3", Status = FriendshipStatus.Pending },
            new Friendship { UserId = "u1", FriendId = "u4", Status = FriendshipStatus.Accepted }
        );
        await context.SaveChangesAsync();

        var notificationMock = new Mock<INotificationService>();
        var service = new FriendshipService(context, notificationMock.Object);

        // Act
        var friends = await service.GetAcceptedFriendsAsync("u1");

        // Assert
        Assert.NotNull(friends);
        Assert.Equal(2, friends.Count);
    }
}
