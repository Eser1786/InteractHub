using InteractHub.API.Controllers;
using InteractHub.API.DTOs;
using InteractHub.Application.Entities;
using InteractHub.Application.Interfaces;
using InteractHub.Tests.Common;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace InteractHub.Tests.Unit.Controllers;

public class PostsControllerTests
{
    // GetAll tests - trả về tất cả bài viết
    [Fact]
    public async Task GetAll_ShouldReturnAllPosts_WhenPostsExist()
    {
        // Given
        var posts = new List<Post>
        {
            new Post { Id = 1, UserId = "u1", Content = "post 1", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Post { Id = 2, UserId = "u2", Content = "post 2", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };
        var postServiceMock = new Mock<IPostService>();
        postServiceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(posts);
        var controller = new PostsController(postServiceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetAll();

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
        postServiceMock.Verify(s => s.GetAllAsync(), Times.Once);
    }

    // GetAll tests - trả về danh sách rỗng khi không có bài viết
    [Fact]
    public async Task GetAll_ShouldReturnEmpty_WhenNoPostsExist()
    {
        // Given
        var posts = new List<Post>();
        var postServiceMock = new Mock<IPostService>();
        postServiceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(posts);
        var controller = new PostsController(postServiceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetAll();

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
    }

    // GetById tests - trả về bài viết khi tồn tại
    [Fact]
    public async Task GetById_ShouldReturnPost_WhenPostExists()
    {
        // Given
        var post = new Post { Id = 1, UserId = "u1", Content = "test post", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var postServiceMock = new Mock<IPostService>();
        postServiceMock.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(post);
        var controller = new PostsController(postServiceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetById(1);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
        postServiceMock.Verify(s => s.GetByIdAsync(1), Times.Once);
    }

    // GetById tests - trả về 404 khi bài viết không tồn tại
    [Fact]
    public async Task GetById_ShouldReturnNotFound_WhenPostMissing()
    {
        // Given
        var postServiceMock = new Mock<IPostService>();
        postServiceMock.Setup(s => s.GetByIdAsync(999)).ReturnsAsync((Post?)null);
        var controller = new PostsController(postServiceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetById(999);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(404, objectResult.StatusCode);
    }

    // Create tests - tạo bài viết thành công
    [Fact]
    public async Task Create_ShouldReturnCreated_WhenPostIsValid()
    {
        // Given
        var createDto = new CreatePostDto { Content = "new post", ImageUrl = "image.jpg" };
        var post = new Post { Id = 1, UserId = "u1", Content = createDto.Content, ImageUrl = createDto.ImageUrl, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var postServiceMock = new Mock<IPostService>();
        postServiceMock.Setup(s => s.CreateAsync(It.IsAny<Post>())).ReturnsAsync(post);
        var controller = new PostsController(postServiceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.Create(createDto);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(201, objectResult.StatusCode);
        postServiceMock.Verify(s => s.CreateAsync(It.IsAny<Post>()), Times.Once);
    }

    // Create tests - trả về 401 khi không có user claim
    [Fact]
    public async Task Create_ShouldReturnUnauthorized_WhenNoUserClaim()
    {
        // Given
        var postServiceMock = new Mock<IPostService>();
        var controller = new PostsController(postServiceMock.Object);
        ControllerTestHelper.SetAnonymous(controller);

        // When
        var result = await controller.Create(new CreatePostDto { Content = "post content" });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(401, objectResult.StatusCode);
    }

    // Delete tests - xóa bài viết thành công
    [Fact]
    public async Task Delete_ShouldReturnOk_WhenPostOwner()
    {
        // Given
        var post = new Post { Id = 10, UserId = "u1", Content = "hello", CreatedAt = DateTime.UtcNow };
        var postServiceMock = new Mock<IPostService>();
        postServiceMock.Setup(s => s.GetByIdAsync(10)).ReturnsAsync(post);
        postServiceMock.Setup(s => s.DeleteAsync(10)).ReturnsAsync(true);
        var controller = new PostsController(postServiceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.Delete(10);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        postServiceMock.Verify(s => s.DeleteAsync(10), Times.Once);
    }

    // Delete tests - trả về 403 khi không phải chủ sở hữu
    [Fact]
    public async Task Delete_ShouldReturnForbidden_WhenCurrentUserIsNotOwner()
    {
        // Given
        var post = new Post { Id = 10, UserId = "owner", Content = "hello", CreatedAt = DateTime.UtcNow };
        var postServiceMock = new Mock<IPostService>();
        postServiceMock.Setup(s => s.GetByIdAsync(10)).ReturnsAsync(post);
        var controller = new PostsController(postServiceMock.Object);
        ControllerTestHelper.SetUser(controller, "other-user");

        // When
        var result = await controller.Delete(10);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(403, objectResult.StatusCode);
    }

    // Delete tests - trả về 404 khi bài viết không tồn tại
    [Fact]
    public async Task Delete_ShouldReturnNotFound_WhenPostMissing()
    {
        // Given
        var postServiceMock = new Mock<IPostService>();
        postServiceMock.Setup(s => s.GetByIdAsync(999)).ReturnsAsync((Post?)null);
        var controller = new PostsController(postServiceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.Delete(999);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(404, objectResult.StatusCode);
    }

    // Delete tests - trả về 404 khi xóa thất bại
    [Fact]
    public async Task Delete_ShouldReturnNotFound_WhenDeleteFails()
    {
        // Given
        var post = new Post { Id = 10, UserId = "u1", Content = "hello", CreatedAt = DateTime.UtcNow };
        var postServiceMock = new Mock<IPostService>();
        postServiceMock.Setup(s => s.GetByIdAsync(10)).ReturnsAsync(post);
        postServiceMock.Setup(s => s.DeleteAsync(10)).ReturnsAsync(false);
        var controller = new PostsController(postServiceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.Delete(10);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(404, objectResult.StatusCode);
    }
}
