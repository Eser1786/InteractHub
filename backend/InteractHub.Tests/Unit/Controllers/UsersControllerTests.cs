using InteractHub.API.Controllers;
using InteractHub.API.DTOs;
using InteractHub.Application.Entities;
using InteractHub.Application.Interfaces;
using InteractHub.Tests.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Query.SqlExpressions;
using Moq;

namespace InteractHub.Tests.Unit.Controllers;

public class UsersControllerTests
{
    // GetById tests trường hợp người dùng không tồn tại
    [Fact]
    public async Task GetById_ShouldReturnNotFound_WhenUserMissing()
    {
        var userServiceMock = new Mock<IUserService>();
        userServiceMock.Setup(s => s.GetByIdAsync("missing")).ReturnsAsync((User?)null);
        var controller = new UsersController(userServiceMock.Object);

        var result = await controller.GetById("missing");

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(404, objectResult.StatusCode);
    }
    // GetById tests trường hợp người dùng tồn tại
    [Fact]
    public async Task GetById_ShouldReturnUser_WhenUserExists()
    {
        var userServiceMock = new Mock<IUserService>();
        userServiceMock.Setup(s => s.GetByIdAsync("u1"))
        .ReturnsAsync(new User { Id = "u1"});
        var controller = new UsersController(userServiceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        var result = await controller.GetById("u1");

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
    }


    // Update tests trường hợp người dùng cố gắng cập nhật thông tin của người khác
    [Fact]
    public async Task Update_ShouldReturnForbidden_WhenUserIdDoesNotMatchCurrentUser()
    {
        var userServiceMock = new Mock<IUserService>();
        var controller = new UsersController(userServiceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        var result = await controller.Update("u2", new UpdateUserDto { FullName = "Changed" });

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(403, objectResult.StatusCode);
    }

    // Update tests trường hợp người dùng cố gắng cập nhật thông tin của chính mình
    [Fact]
    public async Task Update_ShouldReturnOk_WhenUserIdMatchesCurrentUser()
    {
        // Given
        var user = new User { Id = "u1", FullName = "Old Name", ProfilePictureUrl = "old.jpg", Bio = "Old bio" };
        var userServiceMock = new Mock<IUserService>();
        userServiceMock.Setup(s => s.GetByIdAsync("u1")).ReturnsAsync(user);
        userServiceMock.Setup(s => s.UpdateAsync(It.IsAny<User>())).ReturnsAsync(true);
        var controller = new UsersController(userServiceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.Update("u1", new UpdateUserDto { FullName = "Changed", ProfilePictureUrl = "new.jpg", Bio = "New bio" });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        userServiceMock.Verify(s => s.UpdateAsync(It.Is<User>(u => u.Id == "u1" && u.FullName == "Changed")));
    }

    // Update tests trường hợp người dùng không tồn tại
    [Fact]
    public async Task Update_ShouldReturnNotFound_WhenUserNotFound()
    {
        // Given
        var userServiceMock = new Mock<IUserService>();
        userServiceMock.Setup(s => s.GetByIdAsync("u1")).ReturnsAsync((User?)null);
        var controller = new UsersController(userServiceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.Update("u1", new UpdateUserDto { FullName = "Changed" });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(404, objectResult.StatusCode);
    }
    

    // GetAll tests trường hợp trả về tất cả người dùng khi không có tham số tìm kiếm
    [Fact]
    public async Task GetAll_ShouldReturnAllUsers_WhenNoSearch()
    {
        // Given
        var users = new List<User>
        {
            new User { Id = "u1", UserName = "user1", Email = "user1@example.com", FullName = "User One", ProfilePictureUrl = "pic1.jpg", Bio = "Bio 1" },
            new User { Id = "u2", UserName = "user2", Email = "user2@example.com", FullName = "User Two", ProfilePictureUrl = "pic2.jpg", Bio = "Bio 2" }
        };

        var userServiceMock = new Mock<IUserService>();
        userServiceMock.Setup(s => s.GetUsersAsync()).ReturnsAsync(users);
        var controller = new UsersController(userServiceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetAll();

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
    }

    // GetAll tests trường hợp trả về người dùng phù hợp với tham số tìm kiếm
    [Fact]
    public async Task GetAll_ShouldReturnFilteredUsers_WhenSearchMatches()
    {
        // Given
        var users = new List<User>
        {
            new User { Id = "u1", UserName = "john_doe", Email = "john@example.com", FullName = "John Doe", ProfilePictureUrl = "pic1.jpg", Bio = "Bio 1" },
            new User { Id = "u2", UserName = "jane_smith", Email = "jane@example.com", FullName = "Jane Smith", ProfilePictureUrl = "pic2.jpg", Bio = "Bio 2" },
            new User { Id = "u3", UserName = "john_smith", Email = "johnsmith@example.com", FullName = "John Smith", ProfilePictureUrl = "pic3.jpg", Bio = "Bio 3" }
        };

        var userServiceMock = new Mock<IUserService>();
        userServiceMock.Setup(s => s.GetUsersAsync()).ReturnsAsync(users);
        var controller = new UsersController(userServiceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetAll(search: "john");

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
    }

    // GetAll tests trường hợp rổng khi khônh có người dùng nào tồn tại
    [Fact]
    public async Task GetAll_ShouldReturnEmpty_WhenNoUsersExist()
    {
        // Given
        var users = new List<User>();
        var userServiceMock = new Mock<IUserService>();
        userServiceMock.Setup(s => s.GetUsersAsync()).ReturnsAsync(users);
        var controller = new UsersController(userServiceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetAll();

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
    }

    // GetAll tests trường hợp không có người dùng nào phù hợp với tham số tìm kiếm
    [Fact]
    public async Task GetAll_ShouldReturnEmpty_WhenSearchDoesNotMatch()
    {
        // Given
        var users = new List<User>
        {
            new User { Id = "u1", UserName = "john_doe", Email = "john@example.com", FullName = "John Doe", ProfilePictureUrl = "pic1.jpg", Bio = "Bio 1" },
            new User { Id = "u2", UserName = "jane_smith", Email = "jane@example.com", FullName = "Jane Smith", ProfilePictureUrl = "pic2.jpg", Bio = "Bio 2" }
        };

        var userServiceMock = new Mock<IUserService>();
        userServiceMock.Setup(s => s.GetUsersAsync()).ReturnsAsync(users);
        var controller = new UsersController(userServiceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetAll(search: "xyz");

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
    }
}
