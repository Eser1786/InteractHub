using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace InteractHub.Infrastructure.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    public async Task JoinNotificationsGroup(string userId)
    {
        var currentUserId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(currentUserId))
            return;

        await Groups.AddToGroupAsync(Context.ConnectionId, GetGroupName(currentUserId));
    }

    public async Task LeaveNotificationsGroup(string userId)
    {
        var currentUserId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(currentUserId))
            return;

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetGroupName(currentUserId));
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, GetGroupName(userId));
        }

        await base.OnConnectedAsync();
    }

    private static string GetGroupName(string userId) => $"notifications-{userId}";
}
