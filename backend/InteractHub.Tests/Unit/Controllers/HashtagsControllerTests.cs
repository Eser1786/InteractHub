using InteractHub.API.Controllers;
using InteractHub.Application.Entities;
using InteractHub.Application.Interfaces;
using InteractHub.Tests.Common;
using Microsoft.AspNetCore.Mvc;
using Moq;
using InteractHub.API.DTOs;

namespace InteractHub.Tests.Unit.Controllers;

public class HashtagsControllerTests
{
    // GetAll tests - trả về tất cả hashtags
    [Fact]
    public async Task GetAll_ShouldReturnAllHashtags_WhenHashtagsExist()
    {
        // Given
        var hashtags = new List<Hashtag>
        {
            new Hashtag { Id = 1, Name = "#csharp" },
            new Hashtag { Id = 2, Name = "#dotnet" }
        };
        var serviceMock = new Mock<IHashtagService>();
        serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(hashtags);
        var controller = new HashtagsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetAll();

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
        serviceMock.Verify(s => s.GetAllAsync(), Times.Once);
    }

    // GetAll tests - trả về danh sách rỗng khi không có hashtags
    [Fact]
    public async Task GetAll_ShouldReturnEmpty_WhenNoHashtagsExist()
    {
        // Given
        var hashtags = new List<Hashtag>();
        var serviceMock = new Mock<IHashtagService>();
        serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(hashtags);
        var controller = new HashtagsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetAll();

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
    }

    // GetById tests - trả về hashtag khi tồn tại
    [Fact]
    public async Task GetById_ShouldReturnHashtag_WhenHashtagExists()
    {
        // Given
        var hashtag = new Hashtag { Id = 1, Name = "#csharp" };
        var serviceMock = new Mock<IHashtagService>();
        serviceMock.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(hashtag);
        var controller = new HashtagsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetById(1);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
        serviceMock.Verify(s => s.GetByIdAsync(1), Times.Once);
    }

    // GetById tests - trả về 404 khi hashtag không tồn tại
    [Fact]
    public async Task GetById_ShouldReturnNotFound_WhenHashtagMissing()
    {
        // Given
        var serviceMock = new Mock<IHashtagService>();
        serviceMock.Setup(s => s.GetByIdAsync(100)).ReturnsAsync((Hashtag?)null);
        var controller = new HashtagsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetById(100);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(404, objectResult.StatusCode);
    }

    // GetByName tests - trả về hashtag theo tên
    [Fact]
    public async Task GetByName_ShouldReturnHashtag_WhenHashtagExists()
    {
        // Given
        var hashtag = new Hashtag { Id = 1, Name = "#csharp" };
        var serviceMock = new Mock<IHashtagService>();
        serviceMock.Setup(s => s.GetByNameAsync("#csharp")).ReturnsAsync(hashtag);
        var controller = new HashtagsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetByName("#csharp");

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
        serviceMock.Verify(s => s.GetByNameAsync("#csharp"), Times.Once);
    }

    // GetByName tests - trả về 404 khi hashtag không tồn tại
    [Fact]
    public async Task GetByName_ShouldReturnNotFound_WhenHashtagMissing()
    {
        // Given
        var serviceMock = new Mock<IHashtagService>();
        serviceMock.Setup(s => s.GetByNameAsync("#nonexistent")).ReturnsAsync((Hashtag?)null);
        var controller = new HashtagsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetByName("#nonexistent");

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(404, objectResult.StatusCode);
    }

    // Create tests - tạo hashtag thành công
    [Fact]
    public async Task Create_ShouldReturnCreated_WhenHashtagIsValid()
    {
        // Given
        var createDto = new CreateHashtagDto { Name = "#newhashtag" };
        var hashtag = new Hashtag { Id = 1, Name = createDto.Name };
        var serviceMock = new Mock<IHashtagService>();
        serviceMock.Setup(s => s.CreateAsync(It.IsAny<Hashtag>())).ReturnsAsync(hashtag);
        var controller = new HashtagsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.Create(createDto);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(201, objectResult.StatusCode);
        serviceMock.Verify(s => s.CreateAsync(It.IsAny<Hashtag>()), Times.Once);
    }

    // Delete tests - xóa hashtag thành công
    [Fact]
    public async Task Delete_ShouldReturnNoContent_WhenHashtagDeleted()
    {
        // Given
        var serviceMock = new Mock<IHashtagService>();
        serviceMock.Setup(s => s.DeleteAsync(5)).ReturnsAsync(true);
        var controller = new HashtagsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.Delete(5);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(204, objectResult.StatusCode);
        serviceMock.Verify(s => s.DeleteAsync(5), Times.Once);
    }

    // Delete tests - trả về 404 khi xóa thất bại
    [Fact]
    public async Task Delete_ShouldReturnNotFound_WhenDeleteFails()
    {
        // Given
        var serviceMock = new Mock<IHashtagService>();
        serviceMock.Setup(s => s.DeleteAsync(5)).ReturnsAsync(false);
        var controller = new HashtagsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.Delete(5);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(404, objectResult.StatusCode);
    }
}
