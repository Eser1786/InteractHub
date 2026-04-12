namespace InteractHub.Application.Entities;
public class PostReport
{
    public int Id {get; set;}
    public string Reason {get; set;}

    public int PostId {get; set;}
    public Post Post {get; set;}

    public string UserId {get; set;}
    public User User {get; set;}

    public DateTime CreatedAt {get; set;} = DateTime.Now;
}