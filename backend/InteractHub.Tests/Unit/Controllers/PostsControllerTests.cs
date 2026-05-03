using InteractHub.API.Controllers;
using InteractHub.API.DTOs;
using InteractHub.Application.Entities;
using InteractHub.Application.Interfaces;
using InteractHub.Infrastructure.Hubs;
using InteractHub.Tests.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Moq;

namespace InteractHub.Tests.Unit.Controllers;

public class PostsControllerTests
{
    private PostsController CreateController(
        Mock<IPostService> postServiceMock,
        Mock<IFriendshipService>? friendshipServiceMock = null,
        Mock<INotificationService>? notificationServiceMock = null,
        Mock<IHubContext<PostHub>>? postHubMock = null)
    {
        var friendshipMock = friendshipServiceMock ?? new Mock<IFriendshipService>();
        var notificationMock = notificationServiceMock ?? new Mock<INotificationService>();
        var postHubContextMock = postHubMock ?? new Mock<IHubContext<PostHub>>();

        return new PostsController(
            postServiceMock.Object,
            friendshipMock.Object,
            notificationMock.Object,
            postHubContextMock.Object);
    }

    [Fact]
    public async Task GetAll_ShouldReturnOkResult_WithPaginatedPosts()
    {
        // Arrange
        var posts = new List<Post>
        {
            new Post { Id = 1, UserId = "u1", Content = "post 1", CreatedAt = DateTime.UtcNow },
            new Post { Id = 2, UserId = "u1", Content = "post 2", CreatedAt = DateTime.UtcNow }
        };

        var postServiceMock = new Mock<IPostService>();
        postServiceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(posts);

        var controller = CreateController(postServiceMock);
        ControllerTestHelper.SetUser(controller, "u1");

        // Act
        var result = await controller.GetAll(page: 1, pageSize: 20);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
        postServiceMock.Verify(s => s.GetAllAsync(), Times.Once);
    }

    [Fact]
    public async Task GetAll_ShouldReturnEmpty_WhenNoPosts()
    {
        // Arrange
        var posts = new List<Post>();
        var postServiceMock = new Mock<IPostService>();
        postServiceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(posts);

        var controller = CreateController(postServiceMock);
        ControllerTestHelper.SetUser(controller, "u1");

        // Act
        var result = await controller.GetAll(page: 1, pageSize: 20);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task GetAll_ShouldReturnUnauthorized_WhenUserNotAuthenticated()
    {
        // Arrange
        var postServiceMock = new Mock<IPostService>();
        var controller = CreateController(postServiceMock);
        ControllerTestHelper.SetAnonymous(controller);

        // Act
        var result = await controller.GetAll(page: 1, pageSize: 20);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(401, objectResult.StatusCode);
    }

    [Fact]
    public async Task GetById_ShouldReturnPost_WhenPostExists()
    {
        // Arrange
        var post = new Post 
        { 
            Id = 1, 
            UserId = "u1", 
            Content = "test post", 
            CreatedAt = DateTime.UtcNow
        };

        var postServiceMock = new Mock<IPostService>();
        postServiceMock.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(post);

        var controller = CreateController(postServiceMock);
        ControllerTestHelper.SetUser(controller, "u1");

        // Act
        var result = await controller.GetById(1);

        // Assert
        var okResult = Assert.IsType<ObjectResult>(result);
        Assert.NotNull(okResult.Value);
        postServiceMock.Verify(s => s.GetByIdAsync(1), Times.Once);
    }

    [Fact]
    public async Task GetById_ShouldReturnNotFound_WhenPostDoesNotExist()
    {
        // Arrange
        var postServiceMock = new Mock<IPostService>();
        postServiceMock.Setup(s => s.GetByIdAsync(999)).ReturnsAsync((Post?)null);

        var controller = CreateController(postServiceMock);
        ControllerTestHelper.SetUser(controller, "u1");

        // Act
        var result = await controller.GetById(999);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(404, objectResult.StatusCode);
    }

    [Fact]
    public async Task Create_ShouldReturnCreated_WhenValidPostSubmitted()
    {
        // Arrange
        var createDto = new CreatePostDto { Content = "new post", ImageUrl = null };
        var createdPost = new Post 
        { 
            Id = 1, 
            UserId = "u1", 
            Content = "new post",
            CreatedAt = DateTime.UtcNow
        };

        var postServiceMock = new Mock<IPostService>();
        postServiceMock.Setup(s => s.CreateAsync(It.IsAny<Post>())).ReturnsAsync(createdPost);

        var controller = CreateController(postServiceMock);
        ControllerTestHelper.SetUser(controller, "u1");

        // Act
        var result = await controller.Create(createDto);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result);
        Assert.NotNull(createdResult.Value);
        postServiceMock.Verify(s => s.CreateAsync(It.IsAny<Post>()), Times.Once);
    }

    [Fact]
    public async Task Create_ShouldReturnBadRequest_WhenEmptyContent()
    {
        // Arrange
        var createDto = new CreatePostDto { Content = "", ImageUrl = null };
        var postServiceMock = new Mock<IPostService>();
        var controller = CreateController(postServiceMock);
        ControllerTestHelper.SetUser(controller, "u1");

        // Act
        var result = await controller.Create(createDto);

        // Assert
        var badRequestResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(400, badRequestResult.StatusCode);
    }
}
