using InteractHub.Application.Entities;
using InteractHub.Infrastructure.Service;
using InteractHub.Tests.Common;

namespace InteractHub.Tests.Unit.Services;

public class LikeServiceTests
{
    [Fact]
    // Kiểm tra đếm lượt thả tim (Like): Tổng số đếm phải chuẩn xác và tách biệt cho từng bài đăng.
    public async Task GetLikeCountAsync_ShouldReturnCorrectCountForPost()
    {
        // given
        using var context = TestDbContextFactory.Create();
        var service = new LikeService(context);
        await service.CreateAsync(new Like { PostId = 10, UserId = "u1" });
        await service.CreateAsync(new Like { PostId = 10, UserId = "u2" });
        await service.CreateAsync(new Like { PostId = 11, UserId = "u3" });

        // when
        var count = await service.GetLikeCountAsync(10);

        // then
        Assert.Equal(2, count);
    }

    [Fact]
    // Kiểm tra hủy thả tim (Unlike): Nếu thao tác trên một bản ghi không tồn tại thì báo lỗi (Trả False).
    public async Task DeleteAsync_ShouldReturnFalse_WhenLikeMissing()
    {
        // given
        using var context = TestDbContextFactory.Create();
        var service = new LikeService(context);

        // when
        var deleted = await service.DeleteAsync(99);

        // then
        Assert.False(deleted);
    }
}
