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
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<UserResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAll()
    {
        var users = await _userService.GetUsersAsync();
        var userDtos = users.Select(u => new UserResponseDto
        {
            Id = u.Id,
            UserName = u.UserName,
            Email = u.Email,
            FullName = u.FullName,
            ProfilePictureUrl = u.ProfilePictureUrl,
            Bio = u.Bio
        }).ToList();

        return this.SuccessResponse(userDtos, "Users retrieved successfully", 200);
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