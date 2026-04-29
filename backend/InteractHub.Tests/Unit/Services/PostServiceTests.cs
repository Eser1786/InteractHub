using InteractHub.Application.Entities;
using InteractHub.Infrastructure.Service;
using InteractHub.Tests.Common;

namespace InteractHub.Tests.Unit.Services;

public class PostServiceTests
{
    [Fact]
    // Kiểm tra chức năng Tạo bài viết: Xác nhận việc lưu xuống Database thành công và được cấp Id.
    public async Task CreateAsync_ShouldPersistPost()
    {
        // given
        using var context = TestDbContextFactory.Create();
        var service = new PostService(context);
        var post = new Post { Content = "first post", UserId = "u1" };

        // when
        var created = await service.CreateAsync(post);

        // then
        Assert.NotEqual(0, created.Id);
        Assert.Single(context.Posts);
    }

    [Fact]
    // Kiểm tra tìm kiếm bài viết theo Id: Phải trả về giá trị Null nếu bài không tồn tại.
    public async Task GetByIdAsync_ShouldReturnNull_WhenMissing()
    {
        // given
        using var context = TestDbContextFactory.Create();
        var service = new PostService(context);

        // when
        var result = await service.GetByIdAsync(12345);

        // then
        Assert.Null(result);
    }

    [Fact]
    // Kiểm tra lấy danh sách bài viết: Trả về chính xác tổng số lượng bài đã đăng.
    public async Task GetAllAsync_ShouldReturnAllPosts()
    {
        // given
        using var context = TestDbContextFactory.Create();
        var service = new PostService(context);
        await service.CreateAsync(new Post { Content = "p1", UserId = "u1" });
        await service.CreateAsync(new Post { Content = "p2", UserId = "u2" });

        // when
        var posts = await service.GetAllAsync();

        // then
        Assert.Equal(2, posts.Count);
    }

    [Fact]
    // Kiểm tra xoá bài viết: Trả về False và đảm bảo an toàn thao tác nếu bài viết gốc không có.
    public async Task DeleteAsync_ShouldReturnFalse_WhenPostDoesNotExist()
    {
        // given
        using var context = TestDbContextFactory.Create();
        var service = new PostService(context);

        // when
        var result = await service.DeleteAsync(55);

        // then
        Assert.False(result);
    }

    [Fact]
    // Kiểm tra thao tác xoá bài: Trả về True và dọn dẹp sạch sẽ khỏi Database nếu thành công.
    public async Task DeleteAsync_ShouldRemovePost_WhenPostExists()
    {
        // given
        using var context = TestDbContextFactory.Create();
        var service = new PostService(context);
        var post = await service.CreateAsync(new Post { Content = "delete me", UserId = "u1" });

        // when
        var deleted = await service.DeleteAsync(post.Id);

        // then
        Assert.True(deleted);
        Assert.Empty(context.Posts);
    }
}
