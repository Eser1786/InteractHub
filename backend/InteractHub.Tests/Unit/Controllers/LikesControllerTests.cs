using InteractHub.API.Controllers;
using InteractHub.API.DTOs;
using InteractHub.Application.Entities;
using InteractHub.Application.Interfaces;
using InteractHub.Tests.Common;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace InteractHub.Tests.Unit.Controllers;

public class LikesControllerTests
{
    // GetById tests - trả về like khi tồn tại
    [Fact]
    public async Task GetById_ShouldReturnLike_WhenLikeExists()
    {
        // Given
        var like = new Like { Id = 1, PostId = 1, UserId = "u1" };
        var serviceMock = new Mock<ILikeService>();
        serviceMock.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(like);
        var controller = new LikesController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetById(1);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
        serviceMock.Verify(s => s.GetByIdAsync(1), Times.Once);
    }

    // GetById tests - trả về 404 khi like không tồn tại
    [Fact]
    public async Task GetById_ShouldReturnNotFound_WhenLikeMissing()
    {
        // Given
        var serviceMock = new Mock<ILikeService>();
        serviceMock.Setup(s => s.GetByIdAsync(999)).ReturnsAsync((Like?)null);
        var controller = new LikesController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetById(999);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(404, objectResult.StatusCode);
    }

    // GetByPostId tests - trả về likes của một bài viết
    [Fact]
    public async Task GetByPostId_ShouldReturnPostLikes_WhenLikesExist()
    {
        // Given
        var postId = 5;
        var likes = new List<Like>
        {
            new Like { Id = 1, PostId = postId, UserId = "u1" },
            new Like { Id = 2, PostId = postId, UserId = "u2" }
        };
        var serviceMock = new Mock<ILikeService>();
        serviceMock.Setup(s => s.GetByPostIdAsync(postId)).ReturnsAsync(likes);
        var controller = new LikesController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetByPostId(postId);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
        serviceMock.Verify(s => s.GetByPostIdAsync(postId), Times.Once);
    }

    // GetByPostId tests - trả về danh sách rỗng khi không có likes
    [Fact]
    public async Task GetByPostId_ShouldReturnEmpty_WhenNoLikesForPost()
    {
        // Given
        var postId = 5;
        var likes = new List<Like>();
        var serviceMock = new Mock<ILikeService>();
        serviceMock.Setup(s => s.GetByPostIdAsync(postId)).ReturnsAsync(likes);
        var controller = new LikesController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetByPostId(postId);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
    }

    // GetLikeCount tests - trả về số like của một bài viết
    [Fact]
    public async Task GetLikeCount_ShouldReturnLikeCount_WhenPostExists()
    {
        // Given
        var postId = 5;
        var count = 10;
        var serviceMock = new Mock<ILikeService>();
        serviceMock.Setup(s => s.GetLikeCountAsync(postId)).ReturnsAsync(count);
        var controller = new LikesController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetLikeCount(postId);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
        serviceMock.Verify(s => s.GetLikeCountAsync(postId), Times.Once);
    }

    // GetLikeCount tests - trả về 0 khi không có likes
    [Fact]
    public async Task GetLikeCount_ShouldReturnZero_WhenNoLikesForPost()
    {
        // Given
        var postId = 5;
        var count = 0;
        var serviceMock = new Mock<ILikeService>();
        serviceMock.Setup(s => s.GetLikeCountAsync(postId)).ReturnsAsync(count);
        var controller = new LikesController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetLikeCount(postId);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
    }

    // Create tests - tạo like thành công
    [Fact]
    public async Task Create_ShouldReturnCreated_WhenLikeIsValid()
    {
        // Given
        var createDto = new CreateLikeDto { PostId = 10 };
        var like = new Like { Id = 1, PostId = 10, UserId = "u1" };
        var serviceMock = new Mock<ILikeService>();
        serviceMock.Setup(s => s.CreateAsync(It.IsAny<Like>())).ReturnsAsync(like);
        var controller = new LikesController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.Create(createDto);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(201, objectResult.StatusCode);
        serviceMock.Verify(s => s.CreateAsync(It.IsAny<Like>()), Times.Once);
    }

    // Create tests - trả về 401 khi không có user claim
    [Fact]
    public async Task Create_ShouldReturnUnauthorized_WhenNoUserClaim()
    {
        // Given
        var serviceMock = new Mock<ILikeService>();
        var controller = new LikesController(serviceMock.Object);
        ControllerTestHelper.SetAnonymous(controller);

        // When
        var result = await controller.Create(new CreateLikeDto { PostId = 9 });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(401, objectResult.StatusCode);
    }

    // Delete tests - xóa like thành công
    [Fact]
    public async Task Delete_ShouldReturnOk_WhenLikeOwner()
    {
        // Given
        var like = new Like { Id = 6, PostId = 2, UserId = "u1" };
        var serviceMock = new Mock<ILikeService>();
        serviceMock.Setup(s => s.GetByIdAsync(6)).ReturnsAsync(like);
        serviceMock.Setup(s => s.DeleteAsync(6)).ReturnsAsync(true);
        var controller = new LikesController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.Delete(6);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        serviceMock.Verify(s => s.DeleteAsync(6), Times.Once);
    }

    // Delete tests - trả về 404 khi like không tồn tại
    [Fact]
    public async Task Delete_ShouldReturnNotFound_WhenLikeMissing()
    {
        // Given
        var serviceMock = new Mock<ILikeService>();
        serviceMock.Setup(s => s.GetByIdAsync(999)).ReturnsAsync((Like?)null);
        var controller = new LikesController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.Delete(999);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(404, objectResult.StatusCode);
    }

    // Delete tests - trả về 403 khi không phải chủ sở hữu
    [Fact]
    public async Task Delete_ShouldReturnForbidden_WhenCurrentUserIsNotLikeOwner()
    {
        // Given
        var like = new Like { Id = 6, PostId = 2, UserId = "owner" };
        var serviceMock = new Mock<ILikeService>();
        serviceMock.Setup(s => s.GetByIdAsync(6)).ReturnsAsync(like);
        var controller = new LikesController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "other");

        // When
        var result = await controller.Delete(6);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(403, objectResult.StatusCode);
    }

    // Delete tests - trả về 404 khi xóa thất bại
    [Fact]
    public async Task Delete_ShouldReturnNotFound_WhenDeleteFails()
    {
        // Given
        var like = new Like { Id = 6, PostId = 2, UserId = "u1" };
        var serviceMock = new Mock<ILikeService>();
        serviceMock.Setup(s => s.GetByIdAsync(6)).ReturnsAsync(like);
        serviceMock.Setup(s => s.DeleteAsync(6)).ReturnsAsync(false);
        var controller = new LikesController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.Delete(6);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(404, objectResult.StatusCode);
    }
}
