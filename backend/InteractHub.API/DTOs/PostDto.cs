namespace InteractHub.API.DTOs;

public class CreatePostDto
{
    public string Content { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    // public string UserId { get; set; } = string.Empty;
}

public class UpdatePostDto{
    public string Content {get; set;} = string.Empty;
    public string? ImageUrl {get; set;}
}

public class PostResponseDto
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public string? UserFullName { get; set; }
    public string? UserProfilePictureUrl { get; set; }
    public int LikesCount { get; set; }
    public int CommentsCount { get; set; }
}
