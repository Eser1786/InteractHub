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
public class StoriesController : ControllerBase
{
    private readonly IStoryService _storyService;

    public StoriesController(IStoryService storyService)
    {
        _storyService = storyService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<StoryResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAll()
    {
        var stories = await _storyService.GetAllAsync();
        var storyDtos = stories.Select(s => new StoryResponseDto
        {
            Id = s.Id,
            ImageUrl = s.ImageUrl,
            Content = s.Content,
            CreatedAt = s.CreatedAt,
            ExpireAt = s.ExpireAt,
            UserId = s.UserId
        }).ToList();

        return this.SuccessResponse(storyDtos);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<StoryResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetById(int id)
    {
        var story = await _storyService.GetByIdAsync(id);
        if (story == null)
            return this.NotFoundResponse("Story not found");

        var storyDto = new StoryResponseDto
        {
            Id = story.Id,
            ImageUrl = story.ImageUrl,
            Content = story.Content,
            CreatedAt = story.CreatedAt,
            ExpireAt = story.ExpireAt,
            UserId = story.UserId
        };

        return this.SuccessResponse(storyDto);
    }

    [HttpGet("user/{userId}")]
    [ProducesResponseType(typeof(ApiResponse<List<StoryResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetByUserId(string userId)
    {
        var stories = await _storyService.GetByUserIdAsync(userId);
        var storyDtos = stories.Select(s => new StoryResponseDto
        {
            Id = s.Id,
            ImageUrl = s.ImageUrl,
            Content = s.Content,
            CreatedAt = s.CreatedAt,
            ExpireAt = s.ExpireAt,
            UserId = s.UserId
        }).ToList();

        return this.SuccessResponse(storyDtos);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<StoryResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateStoryDto createStoryDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return this.UnauthorizedResponse("User not authenticated");

        var story = new Story
        {
            ImageUrl = createStoryDto.ImageUrl,
            Content = createStoryDto.Content,
            ExpireAt = createStoryDto.ExpireAt,
            UserId = userId
        };

        var created = await _storyService.CreateAsync(story);

        var storyDto = new StoryResponseDto
        {
            Id = created.Id,
            ImageUrl = created.ImageUrl,
            Content = created.Content,
            CreatedAt = created.CreatedAt,
            ExpireAt = created.ExpireAt,
            UserId = created.UserId
        };

        return this.CreatedResponse(storyDto);
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var story = await _storyService.GetByIdAsync(id);
        if (story == null)
            return this.NotFoundResponse("Story not found");

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (story.UserId != userId)
            return this.ForbiddenResponse();

        var result = await _storyService.DeleteAsync(id);
        if (!result)
            return this.NotFoundResponse("Story not found");

        return this.SuccessResponse(statusCode: 204);
    }
}
