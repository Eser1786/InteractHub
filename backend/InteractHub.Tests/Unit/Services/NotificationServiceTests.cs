using InteractHub.Application.Entities;
using InteractHub.Application.Entities.Enums;
using InteractHub.Infrastructure.Service;
using InteractHub.Tests.Common;

namespace InteractHub.Tests.Unit.Services;

public class NotificationServiceTests
{
    [Fact]
    public async Task CreateNotificationAsync_ShouldPersistNotification_WithCorrectData()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var service = new NotificationService(context);

        // Act
        var notification = await service.CreateNotificationAsync(
            "user-1", 
            "Hello", 
            NotificationType.System, 
            "rel-1", 
            22);

        // Assert
        Assert.NotNull(notification);
        Assert.Equal("user-1", notification.UserId);
        Assert.Equal("Hello", notification.Content);
        Assert.False(notification.IsRead);
    }

    [Fact]
    public async Task MarkAsReadAsync_ShouldReturnFalse_WhenNotificationNotFound()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var service = new NotificationService(context);

        // Act
        var result = await service.MarkAsReadAsync(9999);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task GetUnreadCountAsync_ShouldReturnCorrectCount()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var service = new NotificationService(context);
        await service.CreateNotificationAsync("user-1", "n1", NotificationType.System);
        await service.CreateNotificationAsync("user-1", "n2", NotificationType.System);
        await service.CreateNotificationAsync("user-2", "n3", NotificationType.System);

        // Act
        var count = await service.GetUnreadCountAsync("user-1");

        // Assert
        Assert.Equal(2, count);
    }
}
