using Microsoft.AspNetCore.Identity;
using InteractHub.Application.Entities;
using InteractHub.Application.Constants;
using Microsoft.Extensions.DependencyInjection;

namespace InteractHub.Infrastructure.Data;

public static class DbInitializer
{
    /// <summary>
    /// Seed Roles (Admin, User, Moderator) và tạo Admin user mặc định
    /// </summary>
    public static async Task SeedRolesAndAdmin(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = serviceProvider.GetRequiredService<UserManager<User>>();

        // ✅ Bước 1: Tạo Roles
        string[] roles = { RoleConstants.Admin, RoleConstants.User, RoleConstants.Moderator };
        
        foreach (var role in roles)
        {
            // Kiểm tra role đã tồn tại chưa
            if (!await roleManager.RoleExistsAsync(role))
            {
                var result = await roleManager.CreateAsync(new IdentityRole(role));
                if (result.Succeeded)
                {
                    Console.WriteLine($"✅ Role '{role}' created successfully");
                }
                else
                {
                    Console.WriteLine($"❌ Failed to create role '{role}'");
                }
            }
        }

        // ✅ Bước 2: Tạo Admin User mặc định (nếu chưa tồn tại)
        var adminEmail = "admin@interacthub.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);

        if (adminUser == null)
        {
            adminUser = new User
            {
                UserName = "admin",
                Email = adminEmail,
                FullName = "System Administrator",
                EmailConfirmed = true
            };

            var createResult = await userManager.CreateAsync(adminUser, "Admin@123456");
            
            if (createResult.Succeeded)
            {
                // Gán role Admin cho admin user
                var roleResult = await userManager.AddToRoleAsync(adminUser, RoleConstants.Admin);
                if (roleResult.Succeeded)
                {
                    Console.WriteLine($"✅ Admin user created with role '{RoleConstants.Admin}'");
                }
                else
                {
                    Console.WriteLine($"❌ Failed to assign role to admin user");
                }
            }
            else
            {
                var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
                Console.WriteLine($"❌ Failed to create admin user: {errors}");
            }
        }
    }
}
