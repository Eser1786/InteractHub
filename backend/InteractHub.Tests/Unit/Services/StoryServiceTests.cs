using InteractHub.Application.Entities;
using InteractHub.Infrastructure.Service;
using InteractHub.Tests.Common;

namespace InteractHub.Tests.Unit.Services;

public class StoryServiceTests
{
    [Fact]
    // Kiểm tra lấy chuỗi Tin 24h: Chỉ được phép trả về những Tin của đúng User đang yêu cầu, bỏ tin người lạ.
    public async Task GetByUserIdAsync_ShouldReturnOnlyStoriesOfRequestedUser()
    {
        using var context = TestDbContextFactory.Create();
        var service = new StoryService(context);
        await service.CreateAsync(new Story { UserId = "u1", Content = "s1", ExpireAt = DateTime.UtcNow.AddDays(1) });
        await service.CreateAsync(new Story { UserId = "u1", Content = "s2", ExpireAt = DateTime.UtcNow.AddDays(1) });
        await service.CreateAsync(new Story { UserId = "u2", Content = "s3", ExpireAt = DateTime.UtcNow.AddDays(1) });

        var stories = await service.GetByUserIdAsync("u1");

        Assert.Equal(2, stories.Count);
    }

    [Fact]
    // Kiểm tra hệ thống xoá Tin: Phải cản lỗi ngoại lệ và chỉ trả về False nếu Id ảo.
    public async Task DeleteAsync_ShouldReturnFalse_WhenStoryMissing()
    {
        using var context = TestDbContextFactory.Create();
        var service = new StoryService(context);

        var deleted = await service.DeleteAsync(123);

        Assert.False(deleted);
    }
}
