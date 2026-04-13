namespace InteractHub.API.DTOs;

public class CreateNotificationDto
{
    public string Content {get; set;} = string.Empty;
}

public class UpdateNotificationDto
{
    public bool IsRead {get; set;}
}

public class NotificationResponseDto
{
    public int Id {get; set;}
    public string Content {get; set;} = string.Empty;
    public bool IsRead {get; set;}
    public string Type {get; set;} = "System";
    public string UserId {get; set;} = string.Empty;
    public string? RelatedUserId {get; set;}
    public int? RelatedEntityId {get; set;}
    public DateTime CreatedAt {get; set;}
}
}