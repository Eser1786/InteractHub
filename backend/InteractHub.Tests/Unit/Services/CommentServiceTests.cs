using InteractHub.Application.Entities;
using InteractHub.Infrastructure.Service;
using InteractHub.Tests.Common;

namespace InteractHub.Tests.Unit.Services;

public class CommentServiceTests
{
    [Fact]
    // Kiểm tra tính năng tạo bình luận: Sau khi tạo thì DB phải lưu lại thành công và sinh Id mới.
    public async Task CreateAsync_ShouldPersistComment()
    {
        using var context = TestDbContextFactory.Create();
        var service = new CommentService(context);

        var created = await service.CreateAsync(new Comment { Content = "c1", PostId = 1, UserId = "u1" });

        Assert.NotEqual(0, created.Id);
        Assert.Single(context.Comments);
    }

    [Fact]
    // Kiểm tra tính năng xoá bình luận: Trả về False nếu bình luận không tồn tại.
    public async Task DeleteAsync_ShouldReturnFalse_WhenCommentMissing()
    {
        using var context = TestDbContextFactory.Create();
        var service = new CommentService(context);

        var deleted = await service.DeleteAsync(999);

        Assert.False(deleted);
    }
}
