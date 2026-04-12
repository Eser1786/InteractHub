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
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<NotificationResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetById(int id)
    {
        var notification = await _notificationService.GetByIdAsync(id);
        if (notification == null)
            return this.NotFoundResponse("Notification not found");

        var notificationDto = new NotificationResponseDto
        {
            Id = notification.Id,
            Content = notification.Content,
            IsRead = notification.IsRead,
            UserId = notification.UserId,
            CreatedAt = notification.CreatedAt
        };

        return this.SuccessResponse(notificationDto);
    }

    [HttpGet("user/{userId}")]
    [ProducesResponseType(typeof(ApiResponse<List<NotificationResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetByUserId(string userId)
    {
        var userId_current = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId != userId_current)
            return this.ForbiddenResponse();

        var notifications = await _notificationService.GetByUserIdAsync(userId);
        var notificationDtos = notifications.Select(n => new NotificationResponseDto
        {
            Id = n.Id,
            Content = n.Content,
            IsRead = n.IsRead,
            UserId = n.UserId,
            CreatedAt = n.CreatedAt
        }).ToList();

        return this.SuccessResponse(notificationDtos);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<NotificationResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateNotificationDto createNotificationDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return this.UnauthorizedResponse("User not authenticated");

        var notification = new Notification
        {
            Content = createNotificationDto.Content,
            UserId = userId
        };

        var created = await _notificationService.CreateAsync(notification);

        var notificationDto = new NotificationResponseDto
        {
            Id = created.Id,
            Content = created.Content,
            IsRead = created.IsRead,
            UserId = created.UserId,
            CreatedAt = created.CreatedAt
        };

        return this.CreatedResponse(notificationDto);
    }

    [HttpPut("{id}/read")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var notification = await _notificationService.GetByIdAsync(id);
        if (notification == null)
            return this.NotFoundResponse("Notification not found");

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (notification.UserId != userId)
            return this.ForbiddenResponse();

        var result = await _notificationService.MarkAsReadAsync(id);
        if (!result)
            return this.NotFoundResponse("Notification not found");

        return this.SuccessResponse(statusCode: 204);
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var notification = await _notificationService.GetByIdAsync(id);
        if (notification == null)
            return this.NotFoundResponse("Notification not found");

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (notification.UserId != userId)
            return this.ForbiddenResponse();

        var result = await _notificationService.DeleteAsync(id);
        if (!result)
            return this.NotFoundResponse("Notification not found");

        return this.SuccessResponse(statusCode: 204);
    }
}
