using InteractHub.Application.Entities;
using InteractHub.Infrastructure.Service;
using InteractHub.Tests.Common;

namespace InteractHub.Tests.Unit.Services;

public class PostReportServiceTests
{
    [Fact]
    // Kiểm tra cập nhật báo cáo: Phải lưu lại được đúng lý do vi phạm mới chỉnh sửa vào hệ thống.
    public async Task UpdateAsync_ShouldPersistChangedReason()
    {
        using var context = TestDbContextFactory.Create();
        var service = new PostReportService(context);
        context.Users.Add(new User { Id = "u1", UserName = "u1", Email = "u1@mail.com", FullName = "User One" });
        context.Posts.Add(new Post { Id = 1, UserId = "u1", Content = "post" });
        await context.SaveChangesAsync();

        var created = await service.CreateAsync(new PostReport { PostId = 1, UserId = "u1", Reason = "spam" });
        created.Reason = "abuse";

        var updated = await service.UpdateAsync(created);
        var reloaded = context.PostReports.Single();

        Assert.True(updated);
        Assert.Equal("abuse", reloaded!.Reason);
    }

    [Fact]
    // Kiểm tra xóa báo cáo (Report): Trả về False và không sập nguồn nếu ID của bản báo lỗi không tồn tại.
    public async Task DeleteAsync_ShouldReturnFalse_WhenReportMissing()
    {
        using var context = TestDbContextFactory.Create();
        var service = new PostReportService(context);

        var deleted = await service.DeleteAsync(809);

        Assert.False(deleted);
    }
}
