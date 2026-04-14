using InteractHub.Application.Entities;
using InteractHub.Infrastructure.Service;
using InteractHub.Tests.Common;

namespace InteractHub.Tests.Unit.Services;

public class UserServiceTests
{
    [Fact]
    // Kiểm tra tra cứu User: Nhập đúng Email thì phải tìm lại được profile nguyên vẹn của tài khoản.
    public async Task GetByEmailAsync_ShouldReturnUser_WhenExists()
    {
        using var context = TestDbContextFactory.Create();
        var service = new UserService(context);
        await service.CreateAsync(new User { Id = "u1", UserName = "u1", Email = "u1@mail.com", FullName = "User One" });

        var user = await service.GetByEmailAsync("u1@mail.com");

        Assert.NotNull(user);
        Assert.Equal("u1", user!.Id);
    }

    [Fact]
    // Kiểm tra xoá User an toàn: Truyền dữ liệu rỗng (Null) thì hàm phải chặn đứng (Trả False) ngay lập tức.
    public async Task DeleteAsync_ShouldReturnFalse_WhenUserIsNull()
    {
        using var context = TestDbContextFactory.Create();
        var service = new UserService(context);

        var deleted = await service.DeleteAsync(null!);

        Assert.False(deleted);
    }
}
