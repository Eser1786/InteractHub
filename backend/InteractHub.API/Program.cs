using Microsoft.EntityFrameworkCore;
using InteractHub.Infrastructure;
using InteractHub.Infrastructure.Data;
using InteractHub.Application.Entities;
using InteractHub.Infrastructure.Service;
using InteractHub.Application.Interfaces;
using InteractHub.Application.Constants;
using Microsoft.OpenApi.Models;
using FluentValidation.AspNetCore;
using InteractHub.API.DTOs.Validators;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using InteractHub.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));

// Đăng ký Services
builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<ILikeService, LikeService>();
builder.Services.AddScoped<IStoryService, StoryService>();
builder.Services.AddScoped<IFriendshipService, FriendshipService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IPostReportService, PostReportService>();
builder.Services.AddScoped<IHashtagService, HashtagService>();
builder.Services.AddScoped<IFileService, CloudinaryService>();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "InteractHub API", Version = "v1" });
    
    // Add JWT Bearer support to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below."
    });
    
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            new string[] { }
        }
    });
});

// Add Identity
builder.Services.AddIdentity<User, IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// Add JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JWT");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey is not configured in appsettings.json");
var issuer = jwtSettings["Issuer"] ?? throw new InvalidOperationException("JWT Issuer is not configured in appsettings.json");
var audience = jwtSettings["Audience"] ?? throw new InvalidOperationException("JWT Audience is not configured in appsettings.json");

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateLifetime = true
        };
    });


// Add CORS Policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// ✅ Add Authorization Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole(RoleConstants.Admin));
    
    options.AddPolicy("UserOnly", policy =>
        policy.RequireRole(RoleConstants.User));
    
    options.AddPolicy("AdminOrModerator", policy =>
        policy.RequireRole(RoleConstants.Admin, RoleConstants.Moderator));
});

// Add Controllers
builder.Services.AddControllers()
    .AddFluentValidation(fv => fv.RegisterValidatorsFromAssemblies(new[] { typeof(CreatePostValidator).Assembly }));

var app = builder.Build();

// ✅ Seed Roles and Admin User
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try 
    {
        var context = services.GetRequiredService<AppDbContext>();
        await context.Database.MigrateAsync();
        await DbInitializer.SeedRolesAndAdmin(services);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Lỗi khi Migrate hoặc Seed DB lúc khởi động: {ex.Message}");
    }
}

// Add Exception Handling Middleware (must be first!)
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Cho phép Swagger hiển thị công khai trên Production để nộp bài
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

// ✅ Phục vụ các file tĩnh của React (JS, CSS, HTML)
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors("AllowLocalhost");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ✅ Chuyển hướng các đường dẫn (Router) của React về trang chủ index.html
app.MapFallbackToFile("index.html");

app.Run();