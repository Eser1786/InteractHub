using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using InteractHub.Application.Interfaces;
using InteractHub.Application.Entities;
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

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<FriendshipResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetById(int id)
    {
        var friendship = await _friendshipService.GetByIdAsync(id);
        if (friendship == null)
            return this.NotFoundResponse("Friendship not found");

        var friendshipDto = new FriendshipResponseDto
        {
            Id = friendship.Id,
            UserId = friendship.UserId,
            FriendId = friendship.FriendId,
            CreatedAt = friendship.CreatedAt
        };

        return this.SuccessResponse(friendshipDto);
    }

    [HttpGet("user/{userId}")]
    [ProducesResponseType(typeof(ApiResponse<List<FriendshipResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetFriends(string userId)
    {
        var friends = await _friendshipService.GetFriendsAsync(userId);
        var friendshipDtos = friends.Select(f => new FriendshipResponseDto
        {
            Id = f.Id,
            UserId = f.UserId,
            FriendId = f.FriendId,
            CreatedAt = f.CreatedAt
        }).ToList();

        return this.SuccessResponse(friendshipDtos);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<FriendshipResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateFriendshipDto createFriendshipDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return this.UnauthorizedResponse("User not authenticated");

        var friendship = new Friendship
        {
            UserId = userId,
            FriendId = createFriendshipDto.FriendId
        };

        var created = await _friendshipService.CreateAsync(friendship);

        var friendshipDto = new FriendshipResponseDto
        {
            Id = created.Id,
            UserId = created.UserId,
            FriendId = created.FriendId,
            CreatedAt = created.CreatedAt
        };

        return this.CreatedResponse(friendshipDto);
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var friendship = await _friendshipService.GetByIdAsync(id);
        if (friendship == null)
            return this.NotFoundResponse("Friendship not found");

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (friendship.UserId != userId)
            return this.ForbiddenResponse();

        var result = await _friendshipService.DeleteAsync(id);
        if (!result)
            return this.NotFoundResponse("Friendship not found");

        return this.SuccessResponse(statusCode: 204);
    }
}
