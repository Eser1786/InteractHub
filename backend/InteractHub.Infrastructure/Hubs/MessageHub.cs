using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace InteractHub.Infrastructure.Hubs;

[Authorize]
public class MessageHub : Hub
{
    /// <summary>
    /// User joins the conversation group for real-time messaging
    /// Group format: "conversation_{userId1}_{userId2}" (sorted to ensure consistency)
    /// </summary>
    public async Task JoinConversation(string userId)
    {
        Console.WriteLine($"[MessageHub] 🔍 JoinConversation called with userId: {userId}");
        
        if (string.IsNullOrEmpty(userId))
        {
            Console.WriteLine($"[MessageHub] ⚠️ JoinConversation: userId is empty");
            return;
        }

        var currentUserId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Console.WriteLine($"[MessageHub] 🔐 Current user from token: {currentUserId}");
        
        if (string.IsNullOrEmpty(currentUserId))
        {
            Console.WriteLine($"[MessageHub] ⚠️ JoinConversation: currentUserId is empty");
            return;
        }

        // Create a group name for the conversation (sorted IDs to ensure consistency)
        var groupName = GetConversationGroupName(currentUserId, userId);
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        Console.WriteLine($"[MessageHub] 📌 User {currentUserId} joined conversation group: {groupName}");
    }

    /// <summary>
    /// User leaves the conversation group
    /// </summary>
    public async Task LeaveConversation(string userId)
    {
        if (string.IsNullOrEmpty(userId))
            return;

        var currentUserId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(currentUserId))
            return;

        var groupName = GetConversationGroupName(currentUserId, userId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }

    /// <summary>
    /// Called automatically when user connects
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Console.WriteLine($"[MessageHub] 🔌 User connected: {userId}, ConnectionId: {Context.ConnectionId}");
        
        if (!string.IsNullOrEmpty(userId))
        {
            // Add user to their own group so we can send them direct messages
            await Groups.AddToGroupAsync(Context.ConnectionId, GetUserGroupName(userId));
            Console.WriteLine($"[MessageHub] ✅ User {userId} added to group: {GetUserGroupName(userId)}");
        }
        else
        {
            Console.WriteLine($"[MessageHub] ⚠️ Failed to get userId from claims!");
        }

        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Called when user disconnects
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Console.WriteLine($"[MessageHub] 👋 User disconnected: {userId}, ConnectionId: {Context.ConnectionId}");
        
        if (exception != null)
        {
            Console.WriteLine($"[MessageHub] Error during disconnect: {exception.Message}");
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Helper: Generate conversation group name (sorted to ensure consistency)
    /// </summary>
    private static string GetConversationGroupName(string userId1, string userId2)
    {
        var ids = new[] { userId1, userId2 }.OrderBy(x => x).ToArray();
        return $"conversation_{ids[0]}_{ids[1]}";
    }

    /// <summary>
    /// Helper: Generate user group name for direct messages
    /// </summary>
    private static string GetUserGroupName(string userId) => $"user_{userId}";
}
