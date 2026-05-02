using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using InteractHub.Application.Interfaces;
using InteractHub.Application.Entities;
using InteractHub.API.DTOs;
using InteractHub.API.DTOs.Response;
using InteractHub.API.Extensions;
using System.Security.Claims;
using System.Linq;

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

    /// <summary>
    /// Helper method to map Post to PostResponseDto
    /// </summary>
    private PostResponseDto MapToPostResponseDto(Post post)
    {
        var dto = new PostResponseDto
        {
            Id = post.Id,
            GroupId = post.GroupId,
            Content = post.Content,
            ImageUrl = post.ImageUrl,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt,
            UserId = post.UserId,
            UserName = post.User?.UserName,
            UserFullName = post.User?.FullName,
            UserProfilePictureUrl = post.User?.ProfilePictureUrl,
            LikesCount = post.Likes?.Count ?? 0,
            CommentsCount = post.Comments?.Count ?? 0,
            LikedByUserIds = post.Likes?.Select(l => l.UserId).ToList() ?? new(),
            IsShared = post.SharedPostId.HasValue,
            SharedPostId = post.SharedPostId
        };

        // Map shared post if exists
        if (post.SharedPost != null)
        {
            dto.SharedPost = new SharedPostDto
            {
                Id = post.SharedPost.Id,
                Content = post.SharedPost.Content,
                ImageUrl = post.SharedPost.ImageUrl,
                CreatedAt = post.SharedPost.CreatedAt,
                UpdatedAt = post.SharedPost.UpdatedAt,
                UserId = post.SharedPost.UserId,
                UserName = post.SharedPost.User?.UserName,
                UserFullName = post.SharedPost.User?.FullName,
                UserProfilePictureUrl = post.SharedPost.User?.ProfilePictureUrl,
                LikesCount = post.SharedPost.Likes?.Count ?? 0,
                CommentsCount = post.SharedPost.Comments?.Count ?? 0
            };
        }

        return dto;
    }

    [HttpGet("user/{userId}")]
    [ProducesResponseType(typeof(ApiResponse<List<PostResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetByUserId(string userId)
    {
        var posts = await _postService.GetAllAsync();
        var userPosts = posts.Where(p => p.UserId == userId && p.GroupId == null)
            .OrderByDescending(p => p.CreatedAt)
            .ToList();
        
        var postDtos = userPosts.Select(p => MapToPostResponseDto(p)).ToList();
        
        return this.SuccessResponse(postDtos, "User posts retrieved successfully", 200);
    }

    [HttpGet("group/{groupId}")]
    [ProducesResponseType(typeof(ApiResponse<List<PostResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetByGroupId(int groupId)
    {
        var posts = await _postService.GetAllAsync();
        var groupPosts = posts.Where(p => p.GroupId == groupId)
            .OrderByDescending(p => p.CreatedAt)
            .ToList();
        
        var postDtos = groupPosts.Select(p => MapToPostResponseDto(p)).ToList();
        
        return this.SuccessResponse(postDtos, "Group posts retrieved successfully", 200);
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<PostResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        // Ensure valid pagination
        page = Math.Max(1, page);
        pageSize = Math.Max(1, Math.Min(pageSize, 100)); // Cap pageSize at 100

        var posts = await _postService.GetAllAsync();
        
        // Sort by CreatedAt descending (newest first)
        var sortedPosts = posts.Where(p => p.GroupId == null)
            .OrderByDescending(p => p.CreatedAt)
            .ToList();

        // Apply pagination
        var totalCount = sortedPosts.Count;
        var pagedPosts = sortedPosts
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var postDtos = pagedPosts.Select(p => MapToPostResponseDto(p)).ToList();

        var response = new 
        {
            data = postDtos,
            pagination = new 
            {
                page,
                pageSize,
                totalCount,
                totalPages = (totalCount + pageSize - 1) / pageSize,
                hasMore = page * pageSize < totalCount
            }
        };
        
        return Ok(new { success = true, message = "Posts retrieved successfully", data = postDtos, pagination = response.pagination });
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

        var postDto = MapToPostResponseDto(post);

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
            UserId = userId,
            GroupId = createPostDto.GroupId,
            SharedPostId = createPostDto.SharedPostId
        };

        var created = await _postService.CreateAsync(post);
        
        // Reload post with User data
        var createdWithUser = await _postService.GetByIdAsync(created.Id);
        
        if (createdWithUser == null)
            return this.ErrorResponse("Failed to retrieve created post", statusCode: 500);

        var postDto = MapToPostResponseDto(createdWithUser);

        return this.CreatedResponse(postDto, "Post created successfully");
    }

    [HttpPost("{postId}/share")]
    [ProducesResponseType(typeof(ApiResponse<PostResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SharePost(int postId, [FromBody] CreatePostDto? shareDto = null)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return this.UnauthorizedResponse("User not authenticated");

        // Check if original post exists
        var originalPost = await _postService.GetByIdAsync(postId);
        if (originalPost == null)
            return this.NotFoundResponse("Original post not found");

        // Create a new post that references the original
        var sharedPost = new Post
        {
            Content = shareDto?.Content ?? string.Empty, // Optional caption
            ImageUrl = null, // Shared posts don't have their own image
            UserId = userId,
            GroupId = shareDto?.GroupId,
            SharedPostId = postId // Reference to original post
        };

        var created = await _postService.CreateAsync(sharedPost);
        
        // Reload post with related data
        var createdWithData = await _postService.GetByIdAsync(created.Id);
        
        if (createdWithData == null)
            return this.ErrorResponse("Failed to retrieve created shared post", statusCode: 500);

        var postDto = MapToPostResponseDto(createdWithData);

        return this.CreatedResponse(postDto, "Post shared successfully");
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