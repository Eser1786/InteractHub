using InteractHub.Application.Entities;
using InteractHub.Infrastructure.Service;
using InteractHub.Tests.Common;

namespace InteractHub.Tests.Unit.Services;

public class StoryServiceTests
{
    [Fact]
    public async Task GetByUserIdAsync_ShouldReturnOnlyUserStories()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var service = new StoryService(context);
        var expireDate = DateTime.UtcNow.AddDays(1);
        await service.CreateAsync(new Story { UserId = "u1", Content = "s1", ExpireAt = expireDate, CreatedAt = DateTime.UtcNow });
        await service.CreateAsync(new Story { UserId = "u1", Content = "s2", ExpireAt = expireDate, CreatedAt = DateTime.UtcNow });
        await service.CreateAsync(new Story { UserId = "u2", Content = "s3", ExpireAt = expireDate, CreatedAt = DateTime.UtcNow });

        // Act
        var stories = await service.GetByUserIdAsync("u1");

        // Assert
        Assert.Equal(2, stories.Count);
    }

    [Fact]
    public async Task DeleteAsync_ShouldReturnFalse_WhenStoryNotFound()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var service = new StoryService(context);

        // Act
        var deleted = await service.DeleteAsync(123);

        // Assert
        Assert.False(deleted);
    }

    [Fact]
    public async Task CreateAsync_ShouldCreateStory_WithValidData()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var service = new StoryService(context);
        var story = new Story 
        { 
            UserId = "u1", 
            Content = "test story", 
            ExpireAt = DateTime.UtcNow.AddDays(1),
            CreatedAt = DateTime.UtcNow
        };

        // Act
        var created = await service.CreateAsync(story);

        // Assert
        Assert.NotNull(created);
        Assert.NotEqual(0, created.Id);
    }
}
