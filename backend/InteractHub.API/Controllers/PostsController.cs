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
public class PostsController : ControllerBase
{
    private readonly IPostService _postService;

    public PostsController(IPostService postService)
    {
        _postService = postService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<PostResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAll()
    {
        var posts = await _postService.GetAllAsync();
        var postDtos = posts.Select(p => new PostResponseDto
        {
            Id = p.Id,
            Content = p.Content,
            ImageUrl = p.ImageUrl,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt,
            UserId = p.UserId,
            LikesCount = p.Likes?.Count ?? 0,
            CommentsCount = p.Comments?.Count ?? 0
        }).ToList();
        
        return this.SuccessResponse(postDtos, "Posts retrieved successfully", 200);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<PostResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetById(int id)
    {
        var post = await _postService.GetByIdAsync(id);
        if (post == null)
            return this.NotFoundResponse("Post not found");

        var postDto = new PostResponseDto
        {
            Id = post.Id,
            Content = post.Content,
            ImageUrl = post.ImageUrl,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt,
            UserId = post.UserId,
            LikesCount = post.Likes?.Count ?? 0,
            CommentsCount = post.Comments?.Count ?? 0
        };

        return this.SuccessResponse(postDto, "Post retrieved successfully", 200);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<PostResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreatePostDto createPostDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return this.UnauthorizedResponse("User not authenticated");

        var post = new Post
        {
            Content = createPostDto.Content,
            ImageUrl = createPostDto.ImageUrl,
            UserId = userId
        };

        var created = await _postService.CreateAsync(post);

        var postDto = new PostResponseDto
        {
            Id = created.Id,
            Content = created.Content,
            ImageUrl = created.ImageUrl,
            CreatedAt = created.CreatedAt,
            UpdatedAt = created.UpdatedAt,
            UserId = created.UserId,
            LikesCount = 0,
            CommentsCount = 0
        };

        return this.CreatedResponse(postDto, "Post created successfully");
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Delete(int id)
    {
        var post = await _postService.GetByIdAsync(id);
        if (post == null)
            return this.NotFoundResponse("Post not found");

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (post.UserId != userId)
            return this.ForbiddenResponse("You cannot delete this post");

        var result = await _postService.DeleteAsync(id);
        if (!result)
            return this.NotFoundResponse("Post not found");

        return this.SuccessResponse(message: "Post deleted successfully", statusCode: 200);
    }
}