namespace InteractHub.API.DTOs;

public class CreateMessageDto
{
    public string Content { get; set; } = string.Empty;
    public string ReceiverId { get; set; } = string.Empty;
}

public class MessageResponseDto
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string SenderId { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string ReceiverId { get; set; } = string.Empty;
    public string ReceiverName { get; set; } = string.Empty;
    public bool IsRead { get; set; }
}