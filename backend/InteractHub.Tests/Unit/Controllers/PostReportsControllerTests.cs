using InteractHub.API.Controllers;
using InteractHub.API.DTOs;
using InteractHub.Application.Entities;
using InteractHub.Application.Interfaces;
using InteractHub.Tests.Common;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace InteractHub.Tests.Unit.Controllers;

public class PostReportsControllerTests
{
    // GetAll tests - trả về tất cả reports (Admin only)
    [Fact]
    public async Task GetAll_ShouldReturnAllReports_WhenReportsExist()
    {
        // Given
        var reports = new List<PostReport>
        {
            new PostReport { Id = 1, UserId = "u1", PostId = 1, Reason = "spam", CreatedAt = DateTime.UtcNow },
            new PostReport { Id = 2, UserId = "u2", PostId = 2, Reason = "inappropriate", CreatedAt = DateTime.UtcNow }
        };
        var serviceMock = new Mock<IPostReportService>();
        serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(reports);
        var controller = new PostReportsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "admin");

        // When
        var result = await controller.GetAll();

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
        serviceMock.Verify(s => s.GetAllAsync(), Times.Once);
    }

    // GetAll tests - trả về danh sách rỗng khi không có reports
    [Fact]
    public async Task GetAll_ShouldReturnEmpty_WhenNoReportsExist()
    {
        // Given
        var reports = new List<PostReport>();
        var serviceMock = new Mock<IPostReportService>();
        serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(reports);
        var controller = new PostReportsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "admin");

        // When
        var result = await controller.GetAll();

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
    }

    // GetById tests - trả về report khi tồn tại
    [Fact]
    public async Task GetById_ShouldReturnReport_WhenReportExists()
    {
        // Given
        var report = new PostReport { Id = 1, UserId = "u1", PostId = 1, Reason = "spam", CreatedAt = DateTime.UtcNow };
        var serviceMock = new Mock<IPostReportService>();
        serviceMock.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(report);
        var controller = new PostReportsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetById(1);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
        serviceMock.Verify(s => s.GetByIdAsync(1), Times.Once);
    }

    // GetById tests - trả về 404 khi report không tồn tại
    [Fact]
    public async Task GetById_ShouldReturnNotFound_WhenReportMissing()
    {
        // Given
        var serviceMock = new Mock<IPostReportService>();
        serviceMock.Setup(s => s.GetByIdAsync(999)).ReturnsAsync((PostReport?)null);
        var controller = new PostReportsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetById(999);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(404, objectResult.StatusCode);
    }

    // Create tests - tạo report thành công
    [Fact]
    public async Task Create_ShouldReturnCreated_WhenReportIsValid()
    {
        // Given
        var createDto = new CreatePostReportDto { PostId = 1, Reason = "spam" };
        var report = new PostReport { Id = 1, UserId = "u1", PostId = 1, Reason = createDto.Reason, CreatedAt = DateTime.UtcNow };
        var serviceMock = new Mock<IPostReportService>();
        serviceMock.Setup(s => s.CreateAsync(It.IsAny<PostReport>())).ReturnsAsync(report);
        var controller = new PostReportsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.Create(createDto);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(201, objectResult.StatusCode);
        serviceMock.Verify(s => s.CreateAsync(It.IsAny<PostReport>()), Times.Once);
    }

    // Create tests - trả về 401 khi không có user claim
    [Fact]
    public async Task Create_ShouldReturnUnauthorized_WhenNoUserClaim()
    {
        // Given
        var serviceMock = new Mock<IPostReportService>();
        var controller = new PostReportsController(serviceMock.Object);
        ControllerTestHelper.SetAnonymous(controller);

        // When
        var result = await controller.Create(new CreatePostReportDto { PostId = 1, Reason = "spam" });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(401, objectResult.StatusCode);
    }

    // Delete tests - xóa report thành công
    [Fact]
    public async Task Delete_ShouldReturnNoContent_WhenReportDeleted()
    {
        // Given
        var report = new PostReport { Id = 11, UserId = "u1", PostId = 1, Reason = "spam", CreatedAt = DateTime.UtcNow };
        var serviceMock = new Mock<IPostReportService>();
        serviceMock.Setup(s => s.GetByIdAsync(11)).ReturnsAsync(report);
        serviceMock.Setup(s => s.DeleteAsync(11)).ReturnsAsync(true);
        var controller = new PostReportsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "admin");

        // When
        var result = await controller.Delete(11);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(204, objectResult.StatusCode);
        serviceMock.Verify(s => s.DeleteAsync(11), Times.Once);
    }

    // Delete tests - trả về 404 khi report không tồn tại
    [Fact]
    public async Task Delete_ShouldReturnNotFound_WhenReportMissing()
    {
        // Given
        var serviceMock = new Mock<IPostReportService>();
        serviceMock.Setup(s => s.GetByIdAsync(11)).ReturnsAsync((PostReport?)null);
        var controller = new PostReportsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "admin");

        // When
        var result = await controller.Delete(11);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(404, objectResult.StatusCode);
    }

    // Delete tests - trả về 404 khi xóa thất bại
    [Fact]
    public async Task Delete_ShouldReturnNotFound_WhenDeleteFails()
    {
        // Given
        var report = new PostReport { Id = 11, UserId = "u1", PostId = 1, Reason = "spam", CreatedAt = DateTime.UtcNow };
        var serviceMock = new Mock<IPostReportService>();
        serviceMock.Setup(s => s.GetByIdAsync(11)).ReturnsAsync(report);
        serviceMock.Setup(s => s.DeleteAsync(11)).ReturnsAsync(false);
        var controller = new PostReportsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "admin");

        // When
        var result = await controller.Delete(11);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(404, objectResult.StatusCode);
    }
}
