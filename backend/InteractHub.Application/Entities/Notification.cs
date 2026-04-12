namespace InteractHub.Application.Entities;
public class Notification
{
    public int Id {get; set;}
    public string Content {get; set;}
    public bool IsRead {get; set;} = false;

    public string UserId {get; set;}
    public User User {get; set;}
    
    public DateTime CreatedAt {get; set;} = DateTime.Now;
}