namespace InteractHub.API.DTOs;

public class CreateFriendshipDto
{
    public string FriendId {get; set;} = string.Empty;
}

public class FriendshipResponseDto
{
    public int Id {get; set;}
    public string UserId {get; set;} = string.Empty;
    public string FriendId {get; set;} = string.Empty;
    public DateTime CreatedAt {get; set;}
}