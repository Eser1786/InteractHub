using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using InteractHub.Application.Interfaces;
using InteractHub.Application.Entities;
using InteractHub.Application.Entities.Enums;
using InteractHub.API.DTOs;
using InteractHub.API.DTOs.Response;
using InteractHub.API.Extensions;
using System.Security.Claims;

namespace InteractHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FriendshipsController : ControllerBase
{
    private readonly IFriendshipService _friendshipService;

    public FriendshipsController(IFriendshipService friendshipService)
    {
        _friendshipService = friendshipService;
    }

    /// <summary>
    /// Lấy chi tiết kết bạn
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<FriendshipResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var friendship = await _friendshipService.GetByIdAsync(id);
        if (friendship == null)
            return this.NotFoundResponse("Friendship not found");

        var friendshipDto = MapToFriendshipResponseDto(friendship);
        return this.SuccessResponse(friendshipDto);
    }

    /// <summary>
    /// Lấy danh sách bạn bè (chỉ những người đã chấp nhận)
    /// </summary>
    [HttpGet("user/{userId}/accepted")]
    [ProducesResponseType(typeof(ApiResponse<List<FriendshipResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAcceptedFriends(string userId)
    {
        var friends = await _friendshipService.GetAcceptedFriendsAsync(userId);
        var friendshipDtos = friends.Select(MapToFriendshipResponseDto).ToList();
        return this.SuccessResponse(friendshipDtos);
    }

    /// <summary>
    /// Lấy danh sách lời mời kết bạn chờ xử lý
    /// </summary>
    [HttpGet("user/{userId}/pending")]
    [ProducesResponseType(typeof(ApiResponse<List<FriendshipResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingRequests(string userId)
    {
        var userId_current = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId != userId_current)
            return this.ForbiddenResponse();

        var pendingRequests = await _friendshipService.GetPendingRequestsAsync(userId);
        var friendshipDtos = pendingRequests.Select(MapToFriendshipResponseDto).ToList();
        return this.SuccessResponse(friendshipDtos);
    }

    /// <summary>
    /// Gửi lời mời kết bạn
    /// </summary>
    [HttpPost("send-request")]
    [ProducesResponseType(typeof(ApiResponse<FriendshipResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SendFriendRequest([FromBody] SendFriendRequestDto requestDto)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return this.UnauthorizedResponse("User not authenticated");

            var friendship = await _friendshipService.SendFriendRequestAsync(userId, requestDto.FriendId);
            var friendshipDto = MapToFriendshipResponseDto(friendship);

            return this.CreatedResponse(friendshipDto);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestResponse(ex.Message);
        }
    }

    /// <summary>
    /// Chấp nhận lời mời kết bạn
    /// </summary>
    [HttpPost("{id}/accept")]
    [ProducesResponseType(typeof(ApiResponse<FriendshipResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AcceptFriendRequest(int id)
    {
        try
        {
            var friendship = await _friendshipService.AcceptFriendRequestAsync(id);
            var friendshipDto = MapToFriendshipResponseDto(friendship);
            return this.SuccessResponse(friendshipDto);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestResponse(ex.Message);
        }
    }

    /// <summary>
    /// Từ chối lời mời kết bạn
    /// </summary>
    [HttpPost("{id}/decline")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeclineFriendRequest(int id)
    {
        var result = await _friendshipService.DeclineFriendRequestAsync(id);
        if (!result)
            return this.BadRequestResponse("Cannot decline this request");

        return this.SuccessResponse("Friend request declined");
    }

    /// <summary>
    /// Xóa bạn bè
    /// </summary>
    [HttpDelete("remove/{friendId}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveFriend(string friendId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return this.UnauthorizedResponse("User not authenticated");

        var result = await _friendshipService.RemoveFriendAsync(userId, friendId);
        if (!result)
            return this.NotFoundResponse("Friend not found or not in accepted state");

        return this.SuccessResponse("Friend removed successfully");
    }

    /// <summary>
    /// Chặn người dùng
    /// </summary>
    [HttpPost("block/{blockUserId}")]
    [ProducesResponseType(typeof(ApiResponse<FriendshipResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> BlockUser(string blockUserId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return this.UnauthorizedResponse("User not authenticated");

        var friendship = await _friendshipService.BlockUserAsync(userId, blockUserId);
        var friendshipDto = MapToFriendshipResponseDto(friendship);

        return this.SuccessResponse(friendshipDto);
    }

    /// <summary>
    /// Kiểm tra trạng thái kết bạn
    /// </summary>
    [HttpGet("status/{friendId}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckFriendshipStatus(string friendId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return this.UnauthorizedResponse("User not authenticated");

        var status = await _friendshipService.CheckFriendshipStatusAsync(userId, friendId);

        var result = new
        {
            UserId = userId,
            FriendId = friendId,
            Status = status?.ToString() ?? "None"
        };

        return this.SuccessResponse(result);
    }

    // ==================== HELPERS ====================

    private FriendshipResponseDto MapToFriendshipResponseDto(Friendship friendship)
    {
        return new FriendshipResponseDto
        {
            Id = friendship.Id,
            UserId = friendship.UserId,
            FriendId = friendship.FriendId,
            Status = friendship.Status.ToString(),
            CreatedAt = friendship.CreatedAt,
            UpdatedAt = friendship.UpdatedAt
        };
    }
}
