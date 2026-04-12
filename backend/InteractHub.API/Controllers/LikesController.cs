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
public class LikesController : ControllerBase
{
    private readonly ILikeService _likeService;

    public LikesController(ILikeService likeService)
    {
        _likeService = likeService;
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<LikeResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetById(int id)
    {
        var like = await _likeService.GetByIdAsync(id);
        if (like == null)
            return this.NotFoundResponse("Like not found");

        var likeDto = new LikeResponseDto
        {
            Id = like.Id,
            PostId = like.PostId,
            UserId = like.UserId
        };

        return this.SuccessResponse(likeDto, "Like retrieved successfully", 200);
    }

    [HttpGet("post/{postId}")]
    [ProducesResponseType(typeof(ApiResponse<List<LikeResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetByPostId(int postId)
    {
        var likes = await _likeService.GetByPostIdAsync(postId);
        var likeDtos = likes.Select(l => new LikeResponseDto
        {
            Id = l.Id,
            PostId = l.PostId,
            UserId = l.UserId
        }).ToList();

        return this.SuccessResponse(likeDtos, "Likes retrieved successfully", 200);
    }

    [HttpGet("post/{postId}/count")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetLikeCount(int postId)
    {
        var count = await _likeService.GetLikeCountAsync(postId);
        return this.SuccessResponse(new { count }, "Like count retrieved successfully", 200);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<LikeResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateLikeDto createLikeDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return this.UnauthorizedResponse("User not authenticated");

        var like = new Like
        {
            PostId = createLikeDto.PostId,
            UserId = userId
        };

        var created = await _likeService.CreateAsync(like);

        var likeDto = new LikeResponseDto
        {
            Id = created.Id,
            PostId = created.PostId,
            UserId = created.UserId
        };

        return this.CreatedResponse(likeDto, "Like created successfully");
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var like = await _likeService.GetByIdAsync(id);
        if (like == null)
            return this.NotFoundResponse("Like not found");

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (like.UserId != userId)
            return this.ForbiddenResponse("You cannot delete this like");

        var result = await _likeService.DeleteAsync(id);
        if (!result)
            return this.NotFoundResponse("Like not found");

        return this.SuccessResponse(message: "Like deleted successfully", statusCode: 200);
    }
}
