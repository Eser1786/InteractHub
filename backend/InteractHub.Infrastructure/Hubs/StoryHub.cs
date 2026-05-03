using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace InteractHub.Infrastructure.Hubs;

[Authorize]
public class StoryHub : Hub
{
    public async Task JoinStoriesFeed()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "stories-feed");
    }
}
