using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using InteractHub.Application.Interfaces;
using InteractHub.Application.Entities;
using InteractHub.API.DTOs;
using InteractHub.API.DTOs.Response;
using InteractHub.API.Extensions;
using System.Security.Claims;
using InteractHub.Infrastructure.Hubs;

namespace InteractHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly IMessageService _messageService;
    private readonly INotificationService _notificationService;
    private readonly IHubContext<MessageHub> _messageHubContext;

    public MessagesController(
        IMessageService messageService, 
        INotificationService notificationService,
        IHubContext<MessageHub> messageHubContext)
    {
        _messageService = messageService;
        _notificationService = notificationService;
        _messageHubContext = messageHubContext;
    }

    [HttpGet("conversation/{userId}")]
    [ProducesResponseType(typeof(ApiResponse<List<MessageResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetConversation(string userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(currentUserId))
            return Unauthorized();

        // Ensure valid pagination
        page = Math.Max(1, page);
        pageSize = Math.Max(1, Math.Min(pageSize, 100)); // Cap pageSize at 100

        var messages = await _messageService.GetMessagesBetweenUsersAsync(currentUserId, userId);
        
        // Sort by CreatedAt ascending (oldest first) to support pagination from top
        var sortedMessages = messages
            .OrderBy(m => m.CreatedAt)
            .ToList();

        // Apply pagination
        var totalCount = sortedMessages.Count;
        var pagedMessages = sortedMessages
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var messageDtos = pagedMessages.Select(m => new MessageResponseDto
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

        // Add pagination metadata to response
        var response = new 
        {
            data = messageDtos,
            pagination = new 
            {
                page,
                pageSize,
                totalCount,
                totalPages = (totalCount + pageSize - 1) / pageSize,
                hasMore = page * pageSize < totalCount
            }
        };

        return Ok(new { success = true, message = "Messages retrieved successfully", data = messageDtos, pagination = response.pagination });
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

        // 🔄 Send message to both users via SignalR for real-time update
        var conversationGroup = GetConversationGroupName(senderId, dto.ReceiverId);
        Console.WriteLine($"[MessagesController] 📡 Broadcasting message to group: {conversationGroup}");
        Console.WriteLine($"[MessagesController] 📨 Message content: {messageDto.Content}");

        await _messageHubContext.Clients.Group(conversationGroup).SendAsync("ReceiveMessage", messageDto);

        await _messageHubContext.Clients.Group($"user_{dto.ReceiverId}")
            .SendAsync("ReceiveMessage", messageDto);

        await _messageHubContext.Clients.Group($"user_{senderId}")
            .SendAsync("ReceiveMessage", messageDto);
        Console.WriteLine($"[MessagesController] ✅ Message broadcasted successfully");

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

    /// <summary>
    /// Helper: Generate conversation group name (sorted to ensure consistency with MessageHub)
    /// </summary>
    private static string GetConversationGroupName(string userId1, string userId2)
    {
        var ids = new[] { userId1, userId2 }.OrderBy(x => x).ToArray();
        return $"conversation_{ids[0]}_{ids[1]}";
    }
}