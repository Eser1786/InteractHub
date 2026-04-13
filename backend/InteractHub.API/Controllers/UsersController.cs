using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using InteractHub.Application.Interfaces;
using InteractHub.Application.Entities;
using InteractHub.Application.Helpers;
using InteractHub.API.DTOs;
using InteractHub.API.DTOs.Response;
using InteractHub.API.Extensions;
using System.Security.Claims;

namespace InteractHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>
    /// Get all users with optional search filter
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAll([FromQuery] string? search = null)
    {
        try
        {
            var users = await _userService.GetUsersAsync();

            // ✅ Apply search filter using QueryHelper
            if (!string.IsNullOrWhiteSpace(search))
            {
                // Validate and sanitize search term
                var sanitizedSearch = QueryHelper.ValidateAndSanitizeSearchTerm(search);
                
                if (!string.IsNullOrEmpty(sanitizedSearch))
                {
                    users = users.Where(u => 
                        QueryHelper.IsFilterMatch(sanitizedSearch, u.UserName ?? string.Empty) ||
                        QueryHelper.IsFilterMatch(sanitizedSearch, u.Email ?? string.Empty) ||
                        QueryHelper.IsFilterMatch(sanitizedSearch, u.FullName ?? string.Empty)
                    ).ToList();
                }
            }

            var userDtos = users.Select(u => new UserResponseDto
            {
                Id = u.Id,
                UserName = u.UserName,
                Email = u.Email,
                FullName = u.FullName,
                ProfilePictureUrl = u.ProfilePictureUrl,
                Bio = u.Bio
            }).ToList();

            // Add metadata with search info
            var response = new
            {
                Data = userDtos,
                SearchTerm = search,
                TotalCount = userDtos.Count,
                Filtering = !string.IsNullOrWhiteSpace(search)
            };

            return this.SuccessResponse(response, "Users retrieved successfully", 200);
        }
        catch (Exception ex)
        {
            return this.BadRequestResponse(new List<ApiError> 
            { 
                ErrorHelper.CreateValidationError("search", ex.Message) 
            });
        }
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<UserResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetById(string id)
    {
        var user = await _userService.GetByIdAsync(id);
        if (user == null)
            return this.NotFoundResponse("User not found");

        var userDto = new UserResponseDto
        {
            Id = user.Id,
            UserName = user.UserName,
            Email = user.Email,
            FullName = user.FullName,
            ProfilePictureUrl = user.ProfilePictureUrl,
            Bio = user.Bio
        };

        return this.SuccessResponse(userDto, "User retrieved successfully", 200);
    }

    [HttpGet("email/{email}")]
    [ProducesResponseType(typeof(ApiResponse<UserResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetByEmail(string email)
    {
        var user = await _userService.GetByEmailAsync(email);
        if (user == null)
            return this.NotFoundResponse("User not found");

        var userDto = new UserResponseDto
        {
            Id = user.Id,
            UserName = user.UserName,
            Email = user.Email,
            FullName = user.FullName,
            ProfilePictureUrl = user.ProfilePictureUrl,
            Bio = user.Bio
        };

        return this.SuccessResponse(userDto, "User retrieved successfully", 200);
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateUserDto updateUserDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (id != userId)
            return this.ForbiddenResponse("You cannot update this user");

        var user = await _userService.GetByIdAsync(id);
        if (user == null)
            return this.NotFoundResponse("User not found");

        user.FullName = updateUserDto.FullName;
        user.ProfilePictureUrl = updateUserDto.ProfilePictureUrl;
        user.Bio = updateUserDto.Bio;

        await _userService.UpdateAsync(user);

        return this.SuccessResponse(message: "User updated successfully", statusCode: 200);
    }
}