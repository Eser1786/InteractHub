using Microsoft.AspNetCore.SignalR;

public class PostHub : Hub
{
    public async Task JoinFeed()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "feed");
    }

    public async Task JoinGroup(int groupId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"group_{groupId}");
    }
}