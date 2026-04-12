namespace InteractHub.API.DTOs;

public class CreatePostReportDto
{
    public string Reason {get; set;} = string.Empty;
    public int PostId {get; set;}
}

public class PostReportResponseDto
{
    public int Id {get; set;}
    public string Reason {get; set;} = string.Empty;
    public int PostId {get; set;}
    public string UserId {get; set;} = string.Empty;
    public DateTime CreatedAt {get; set;} 
}