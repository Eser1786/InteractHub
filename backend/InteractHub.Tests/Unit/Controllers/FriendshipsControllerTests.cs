using InteractHub.API.Controllers;
using InteractHub.API.DTOs;
using InteractHub.Application.Entities;
using InteractHub.Application.Entities.Enums;
using InteractHub.Application.Interfaces;
using InteractHub.Tests.Common;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace InteractHub.Tests.Unit.Controllers;

public class FriendshipsControllerTests
{
    // GetById tests - trả về friendship khi tồn tại
    [Fact]
    public async Task GetById_ShouldReturnFriendship_WhenFriendshipExists()
    {
        // Given
        var friendship = new Friendship { Id = 1, UserId = "u1", FriendId = "u2", Status = FriendshipStatus.Accepted, CreatedAt = DateTime.UtcNow };
        var serviceMock = new Mock<IFriendshipService>();
        serviceMock.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(friendship);
        var controller = new FriendshipsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetById(1);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
        serviceMock.Verify(s => s.GetByIdAsync(1), Times.Once);
    }

    // GetById tests - trả về 404 khi friendship không tồn tại
    [Fact]
    public async Task GetById_ShouldReturnNotFound_WhenFriendshipMissing()
    {
        // Given
        var serviceMock = new Mock<IFriendshipService>();
        serviceMock.Setup(s => s.GetByIdAsync(999)).ReturnsAsync((Friendship?)null);
        var controller = new FriendshipsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetById(999);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(404, objectResult.StatusCode);
    }

    // GetAcceptedFriends tests - trả về danh sách bạn bè đã chấp nhận
    [Fact]
    public async Task GetAcceptedFriends_ShouldReturnAcceptedFriends_WhenFriendsExist()
    {
        // Given
        var userId = "u1";
        var friends = new List<Friendship>
        {
            new Friendship { Id = 1, UserId = userId, FriendId = "u2", Status = FriendshipStatus.Accepted, CreatedAt = DateTime.UtcNow },
            new Friendship { Id = 2, UserId = userId, FriendId = "u3", Status = FriendshipStatus.Accepted, CreatedAt = DateTime.UtcNow }
        };
        var metadata = new InteractHub.Application.Helpers.PaginationMetadata { TotalCount = 2, PageNumber = 1, PageSize = 20, TotalPages = 1 };
        var serviceMock = new Mock<IFriendshipService>();
        serviceMock.Setup(s => s.GetAcceptedFriendsPaginatedAsync(userId, 1, 20)).ReturnsAsync((Friends: friends, Metadata: metadata));
        var controller = new FriendshipsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetAcceptedFriends(userId);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
        serviceMock.Verify(s => s.GetAcceptedFriendsPaginatedAsync(userId, 1, 20), Times.Once);
    }

    // GetAcceptedFriends tests - trả về danh sách rỗng khi không có bạn bè
    [Fact]
    public async Task GetAcceptedFriends_ShouldReturnEmpty_WhenNoAcceptedFriendships()
    {
        // Given
        var userId = "u1";
        var friends = new List<Friendship>();
        var metadata = new InteractHub.Application.Helpers.PaginationMetadata { TotalCount = 0, PageNumber = 1, PageSize = 20, TotalPages = 0 };
        var serviceMock = new Mock<IFriendshipService>();
        serviceMock.Setup(s => s.GetAcceptedFriendsPaginatedAsync(userId, 1, 20)).ReturnsAsync((Friends: friends, Metadata: metadata));
        var controller = new FriendshipsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetAcceptedFriends(userId);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
    }

    // GetPendingRequests tests - trả về danh sách lời mời chờ xử lý
    [Fact]
    public async Task GetPendingRequests_ShouldReturnPendingRequests_WhenRequestsExist()
    {
        // Given
        var userId = "u1";
        var requests = new List<Friendship>
        {
            new Friendship { Id = 1, UserId = "u2", FriendId = userId, Status = FriendshipStatus.Pending, CreatedAt = DateTime.UtcNow },
            new Friendship { Id = 2, UserId = "u3", FriendId = userId, Status = FriendshipStatus.Pending, CreatedAt = DateTime.UtcNow }
        };
        var metadata = new InteractHub.Application.Helpers.PaginationMetadata { TotalCount = 2, PageNumber = 1, PageSize = 20, TotalPages = 1 };
        var serviceMock = new Mock<IFriendshipService>();
        serviceMock.Setup(s => s.GetPendingRequestsPaginatedAsync(userId, 1, 20)).ReturnsAsync((Requests: requests, Metadata: metadata));
        var controller = new FriendshipsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, userId);

        // When
        var result = await controller.GetPendingRequests(userId);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
        serviceMock.Verify(s => s.GetPendingRequestsPaginatedAsync(userId, 1, 20), Times.Once);
    }

    // GetPendingRequests tests - trả về 403 khi user cố xem lời mời của người khác
    [Fact]
    public async Task GetPendingRequests_ShouldReturnForbidden_WhenUserId_NotMatchCurrentUser()
    {
        // Given
        var serviceMock = new Mock<IFriendshipService>();
        var controller = new FriendshipsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.GetPendingRequests("u2");

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(403, objectResult.StatusCode);
    }

    // GetPendingRequests tests - trả về danh sách rỗng khi không có lời mời
    [Fact]
    public async Task GetPendingRequests_ShouldReturnEmpty_WhenNoPendingRequests()
    {
        // Given
        var userId = "u1";
        var requests = new List<Friendship>();
        var metadata = new InteractHub.Application.Helpers.PaginationMetadata { TotalCount = 0, PageNumber = 1, PageSize = 20, TotalPages = 0 };
        var serviceMock = new Mock<IFriendshipService>();
        serviceMock.Setup(s => s.GetPendingRequestsPaginatedAsync(userId, 1, 20)).ReturnsAsync((Requests: requests, Metadata: metadata));
        var controller = new FriendshipsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, userId);

        // When
        var result = await controller.GetPendingRequests(userId);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
    }

    // SendFriendRequest tests - gửi lời mời kết bạn thành công
    [Fact]
    public async Task SendFriendRequest_ShouldReturnCreated_WhenRequestIsValid()
    {
        // Given
        var requestDto = new SendFriendRequestDto { FriendId = "u2" };
        var friendship = new Friendship { Id = 1, UserId = "u1", FriendId = "u2", Status = FriendshipStatus.Pending, CreatedAt = DateTime.UtcNow };
        var serviceMock = new Mock<IFriendshipService>();
        serviceMock.Setup(s => s.SendFriendRequestAsync("u1", "u2")).ReturnsAsync(friendship);
        var controller = new FriendshipsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.SendFriendRequest(requestDto);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(201, objectResult.StatusCode);
        serviceMock.Verify(s => s.SendFriendRequestAsync("u1", "u2"), Times.Once);
    }

    // SendFriendRequest tests - trả về 401 khi không có user claim
    [Fact]
    public async Task SendFriendRequest_ShouldReturnUnauthorized_WhenNoUserClaim()
    {
        // Given
        var serviceMock = new Mock<IFriendshipService>();
        var controller = new FriendshipsController(serviceMock.Object);
        ControllerTestHelper.SetAnonymous(controller);

        // When
        var result = await controller.SendFriendRequest(new SendFriendRequestDto { FriendId = "u2" });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(401, objectResult.StatusCode);
    }

    // SendFriendRequest tests - trả về 400 khi có lỗi validation
    [Fact]
    public async Task SendFriendRequest_ShouldReturnBadRequest_WhenServiceThrowsException()
    {
        // Given
        var requestDto = new SendFriendRequestDto { FriendId = "u2" };
        var serviceMock = new Mock<IFriendshipService>();
        serviceMock.Setup(s => s.SendFriendRequestAsync("u1", "u2")).ThrowsAsync(new InvalidOperationException("Already friends"));
        var controller = new FriendshipsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.SendFriendRequest(requestDto);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(400, objectResult.StatusCode);
    }

    // AcceptFriendRequest tests - chấp nhận lời mời thành công
    [Fact]
    public async Task AcceptFriendRequest_ShouldReturnOk_WhenRequestIsValid()
    {
        // Given
        var friendship = new Friendship { Id = 1, UserId = "u2", FriendId = "u1", Status = FriendshipStatus.Accepted, CreatedAt = DateTime.UtcNow };
        var serviceMock = new Mock<IFriendshipService>();
        serviceMock.Setup(s => s.AcceptFriendRequestAsync(1)).ReturnsAsync(friendship);
        var controller = new FriendshipsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.AcceptFriendRequest(1);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        serviceMock.Verify(s => s.AcceptFriendRequestAsync(1), Times.Once);
    }

    // AcceptFriendRequest tests - trả về 400 khi lời mời không hợp lệ
    [Fact]
    public async Task AcceptFriendRequest_ShouldReturnBadRequest_WhenRequestInvalid()
    {
        // Given
        var serviceMock = new Mock<IFriendshipService>();
        serviceMock.Setup(s => s.AcceptFriendRequestAsync(999)).ThrowsAsync(new InvalidOperationException("Request not found"));
        var controller = new FriendshipsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.AcceptFriendRequest(999);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(400, objectResult.StatusCode);
    }

    // DeclineFriendRequest tests - từ chối lời mời thành công
    [Fact]
    public async Task DeclineFriendRequest_ShouldReturnOk_WhenRequestIsValid()
    {
        // Given
        var serviceMock = new Mock<IFriendshipService>();
        serviceMock.Setup(s => s.DeclineFriendRequestAsync(22)).ReturnsAsync(true);
        var controller = new FriendshipsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.DeclineFriendRequest(22);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        serviceMock.Verify(s => s.DeclineFriendRequestAsync(22), Times.Once);
    }

    // DeclineFriendRequest tests - trả về 400 khi từ chối thất bại
    [Fact]
    public async Task DeclineFriendRequest_ShouldReturnBadRequest_WhenServiceReturnsFalse()
    {
        // Given
        var serviceMock = new Mock<IFriendshipService>();
        serviceMock.Setup(s => s.DeclineFriendRequestAsync(22)).ReturnsAsync(false);
        var controller = new FriendshipsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.DeclineFriendRequest(22);

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(400, objectResult.StatusCode);
    }

    // RemoveFriend tests - xóa bạn thành công
    [Fact]
    public async Task RemoveFriend_ShouldReturnOk_WhenFriendExists()
    {
        // Given
        var serviceMock = new Mock<IFriendshipService>();
        serviceMock.Setup(s => s.RemoveFriendAsync("u1", "u2")).ReturnsAsync(true);
        var controller = new FriendshipsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.RemoveFriend("u2");

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        serviceMock.Verify(s => s.RemoveFriendAsync("u1", "u2"), Times.Once);
    }

    // RemoveFriend tests - trả về 404 khi bạn không tồn tại
    [Fact]
    public async Task RemoveFriend_ShouldReturnNotFound_WhenFriendDoesNotExist()
    {
        // Given
        var serviceMock = new Mock<IFriendshipService>();
        serviceMock.Setup(s => s.RemoveFriendAsync("u1", "u999")).ReturnsAsync(false);
        var controller = new FriendshipsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.RemoveFriend("u999");

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(404, objectResult.StatusCode);
    }

    // RemoveFriend tests - trả về 401 khi không có user claim
    [Fact]
    public async Task RemoveFriend_ShouldReturnUnauthorized_WhenNoUserClaim()
    {
        // Given
        var serviceMock = new Mock<IFriendshipService>();
        var controller = new FriendshipsController(serviceMock.Object);
        ControllerTestHelper.SetAnonymous(controller);

        // When
        var result = await controller.RemoveFriend("u2");

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(401, objectResult.StatusCode);
    }

    // BlockUser tests - chặn người dùng thành công
    [Fact]
    public async Task BlockUser_ShouldReturnOk_WhenBlockIsValid()
    {
        // Given
        var friendship = new Friendship { Id = 1, UserId = "u1", FriendId = "u2", Status = FriendshipStatus.Blocked, CreatedAt = DateTime.UtcNow };
        var serviceMock = new Mock<IFriendshipService>();
        serviceMock.Setup(s => s.BlockUserAsync("u1", "u2")).ReturnsAsync(friendship);
        var controller = new FriendshipsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.BlockUser("u2");

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        serviceMock.Verify(s => s.BlockUserAsync("u1", "u2"), Times.Once);
    }

    // BlockUser tests - trả về 401 khi không có user claim
    [Fact]
    public async Task BlockUser_ShouldReturnUnauthorized_WhenNoUserClaim()
    {
        // Given
        var serviceMock = new Mock<IFriendshipService>();
        var controller = new FriendshipsController(serviceMock.Object);
        ControllerTestHelper.SetAnonymous(controller);

        // When
        var result = await controller.BlockUser("u2");

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(401, objectResult.StatusCode);
    }

    // CheckFriendshipStatus tests - kiểm tra trạng thái kết bạn
    [Fact]
    public async Task CheckFriendshipStatus_ShouldReturnStatus_WhenStatusExists()
    {
        // Given
        var serviceMock = new Mock<IFriendshipService>();
        serviceMock.Setup(s => s.CheckFriendshipStatusAsync("u1", "u2")).ReturnsAsync(FriendshipStatus.Accepted);
        var controller = new FriendshipsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.CheckFriendshipStatus("u2");

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
        serviceMock.Verify(s => s.CheckFriendshipStatusAsync("u1", "u2"), Times.Once);
    }

    // CheckFriendshipStatus tests - trả về None khi không có kết bạn
    [Fact]
    public async Task CheckFriendshipStatus_ShouldReturnNone_WhenStatusDoesNotExist()
    {
        // Given
        var serviceMock = new Mock<IFriendshipService>();
        serviceMock.Setup(s => s.CheckFriendshipStatusAsync("u1", "u999")).ReturnsAsync((FriendshipStatus?)null);
        var controller = new FriendshipsController(serviceMock.Object);
        ControllerTestHelper.SetUser(controller, "u1");

        // When
        var result = await controller.CheckFriendshipStatus("u999");

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
    }

    // CheckFriendshipStatus tests - trả về 401 khi không có user claim
    [Fact]
    public async Task CheckFriendshipStatus_ShouldReturnUnauthorized_WhenNoUserClaim()
    {
        // Given
        var serviceMock = new Mock<IFriendshipService>();
        var controller = new FriendshipsController(serviceMock.Object);
        ControllerTestHelper.SetAnonymous(controller);

        // When
        var result = await controller.CheckFriendshipStatus("u2");

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(401, objectResult.StatusCode);
    }
}
