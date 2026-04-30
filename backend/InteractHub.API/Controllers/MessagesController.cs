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
public class MessagesController : ControllerBase
{
    private readonly IMessageService _messageService;
    private readonly INotificationService _notificationService;

    public MessagesController(IMessageService messageService, INotificationService notificationService)
    {
        _messageService = messageService;
        _notificationService = notificationService;
    }

    [HttpGet("conversation/{userId}")]
    [ProducesResponseType(typeof(ApiResponse<List<MessageResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetConversation(string userId)
    {
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(currentUserId))
            return Unauthorized();

        var messages = await _messageService.GetMessagesBetweenUsersAsync(currentUserId, userId);
        var messageDtos = messages.Select(m => new MessageResponseDto
        {
            Id = m.Id,
            Content = m.Content,
            CreatedAt = m.CreatedAt,
            SenderId = m.SenderId,
            SenderName = m.Sender?.UserName ?? "Unknown",
            ReceiverId = m.ReceiverId,
            ReceiverName = m.Receiver?.UserName ?? "Unknown",
            IsRead = m.IsRead
        }).ToList();

        return this.SuccessResponse(messageDtos);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<MessageResponseDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> SendMessage([FromBody] CreateMessageDto dto)
    {
        var senderId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(senderId))
            return Unauthorized();

        var message = await _messageService.SendMessageAsync(senderId, dto.ReceiverId, dto.Content);

        if (message.ReceiverId != message.SenderId)
        {
            await _notificationService.NotifyMessageAsync(message.ReceiverId, message.SenderId, message.Id, message.Content);
        }

        var messageDto = new MessageResponseDto
        {
            Id = message.Id,
            Content = message.Content,
            CreatedAt = message.CreatedAt,
            SenderId = message.SenderId,
            SenderName = message.Sender?.UserName ?? "Unknown",
            ReceiverId = message.ReceiverId,
            ReceiverName = message.Receiver?.UserName ?? "Unknown",
            IsRead = message.IsRead
        };

        return this.CreatedResponse(messageDto);
    }

    [HttpPut("{messageId}/read")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkAsRead(int messageId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        await _messageService.MarkAsReadAsync(messageId, userId);
        return this.SuccessResponse(message: "Message marked as read");
    }

    [HttpGet("unread")]
    [ProducesResponseType(typeof(ApiResponse<List<MessageResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnreadMessages()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var messages = await _messageService.GetUnreadMessagesAsync(userId);
        var messageDtos = messages.Select(m => new MessageResponseDto
        {
            Id = m.Id,
            Content = m.Content,
            CreatedAt = m.CreatedAt,
            SenderId = m.SenderId,
            SenderName = m.Sender?.UserName ?? "Unknown",
            ReceiverId = m.ReceiverId,
            ReceiverName = m.Receiver?.UserName ?? "Unknown",
            IsRead = m.IsRead
        }).ToList();

        return this.SuccessResponse(messageDtos);
    }
}