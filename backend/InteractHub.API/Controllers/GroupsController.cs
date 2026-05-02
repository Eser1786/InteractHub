using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using InteractHub.Application.Interfaces;
using InteractHub.API.DTOs;
using InteractHub.API.Extensions;
using InteractHub.Application.Entities;
using InteractHub.API.DTOs.Response;

namespace InteractHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GroupsController : ControllerBase
{
    private readonly IGroupService _groupService;

    public GroupsController(IGroupService groupService)
    {
        _groupService = groupService;
    }

    private string GetCurrentUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<GroupResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetGroups()
    {
        var userId = GetCurrentUserId();
        var groups = await _groupService.GetAllWithUserMembershipAsync(userId);

        var groupDtos = groups.Select(g => new GroupResponseDto
        {
            Id = g.Id,
            Name = g.Name,
            Slug = g.Slug,
            Description = g.Description,
            CreatorId = g.CreatorId,
            IsJoined = g.Memberships.Any(m => m.UserId == userId),
            MemberCount = g.Memberships.Count,
            CreatedAt = g.CreatedAt
        }).ToList();

        return this.SuccessResponse(groupDtos, "Groups retrieved successfully", 200);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<GroupResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateGroup([FromBody] CreateGroupDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return this.BadRequestResponse(new List<ApiError> { new ApiError("Group name is required", "Name") });

        if (dto.MemberIds == null || dto.MemberIds.Count < 2)
            return this.BadRequestResponse(new List<ApiError> { new ApiError("Group must have at least 3 members including creator", "MemberIds") });

        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
            return this.UnauthorizedResponse("Unable to determine current user");

        var newGroup = new Group
        {
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim()
        };

        var createdGroup = await _groupService.CreateWithMembersAsync(newGroup, userId, dto.MemberIds);

        var groupDto = new GroupResponseDto
        {
            Id = createdGroup.Id,
            Name = createdGroup.Name,
            Slug = createdGroup.Slug,
            Description = createdGroup.Description,
            CreatorId = createdGroup.CreatorId,
            IsJoined = true,
            MemberCount = createdGroup.Memberships.Count,
            CreatedAt = createdGroup.CreatedAt
        };

        return this.CreatedResponse(groupDto, "Group created successfully");
    }

    [HttpPost("{id}/join")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> JoinGroup(int id)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
            return this.UnauthorizedResponse("Unable to determine current user");

        var joined = await _groupService.JoinAsync(id, userId);
        if (!joined)
            return this.NotFoundResponse("Group not found");

        return this.SuccessResponse(message: "Joined group successfully");
    }

    [HttpDelete("{id}/leave")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> LeaveGroup(int id)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
            return this.UnauthorizedResponse("Unable to determine current user");

        var left = await _groupService.LeaveAsync(id, userId);
        if (!left)
            return this.NotFoundResponse("Group membership not found");

        return this.SuccessResponse(message: "Left group successfully");
    }
}
