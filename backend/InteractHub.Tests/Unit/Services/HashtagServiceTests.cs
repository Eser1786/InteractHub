using InteractHub.Application.Entities;
using InteractHub.Infrastructure.Service;
using InteractHub.Tests.Common;

namespace InteractHub.Tests.Unit.Services;

public class HashtagServiceTests
{
    [Fact]
    // Kiểm tra tìm kiếm Hashtag theo tên: Phải trả về đúng thông tin nếu tồn tại.
    public async Task GetByNameAsync_ShouldReturnHashtag_WhenExists()
    {
        using var context = TestDbContextFactory.Create();
        var service = new HashtagService(context);
        await service.CreateAsync(new Hashtag { Name = "dotnet" });

        var hashtag = await service.GetByNameAsync("dotnet");

        Assert.NotNull(hashtag);
        Assert.Equal("dotnet", hashtag!.Name);
    }

    [Fact]
    // Kiểm tra logic xoá Hashtag an toàn: Trả về False nếu id đó không tồn tại trong DB.
    public async Task DeleteAsync_ShouldReturnFalse_WhenHashtagMissing()
    {
        using var context = TestDbContextFactory.Create();
        var service = new HashtagService(context);

        var deleted = await service.DeleteAsync(777);

        Assert.False(deleted);
    }
}
