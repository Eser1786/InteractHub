using InteractHub.Application.Entities;
namespace InteractHub.Application.Interfaces;

public interface INotificationService
{
    Task<List<Notification>> GetByUserIdAsync(string userId);
    Task<Notification?> GetByIdAsync(int id);
    Task<Notification> CreateAsync(Notification notification);
    Task<bool> MarkAsReadAsync(int id);
    Task<bool> DeleteAsync(int id);
}