using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Http;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using InteractHub.Application.Entities;
using InteractHub.API.DTOs;
using InteractHub.API.DTOs.Response;
using InteractHub.API.Extensions;

namespace InteractHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly IConfiguration _configuration;

    public AuthController(
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
    }

    // ✅ POST /api/auth/register
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
    {
        // 1️⃣ Kiểm tra username đã tồn tại chưa
        var existingUser = await _userManager.FindByNameAsync(registerDto.UserName);
        if (existingUser != null)
            return this.ErrorResponse("Username already exists", statusCode: 400);

        // 2️⃣ Tạo user mới
        var user = new User
        {
            UserName = registerDto.UserName,
            Email = registerDto.Email,
            FullName = registerDto.FullName
        };

        // 3️⃣ Hash password và lưu vào database
        var result = await _userManager.CreateAsync(user, registerDto.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return this.ErrorResponse($"Registration failed: {errors}", statusCode: 400);
        }

        // 4️⃣ Tạo JWT token
        var token = GenerateJwtToken(user);

        var authData = new
        {
            Token = token,
            User = new UserResponseDto
            {
                Id = user.Id,
                UserName = user.UserName,
                Email = user.Email,
                FullName = user.FullName
            }
        };

        return this.SuccessResponse(authData, "Registration successful", 201);
    }

    // ✅ POST /api/auth/login
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        // 1️⃣ Tìm user theo username
        var user = await _userManager.FindByNameAsync(loginDto.UserName);
        if (user == null)
            return this.UnauthorizedResponse("Invalid username or password");

        // 2️⃣ Kiểm tra password
        var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);
        if (!result.Succeeded)
            return this.UnauthorizedResponse("Invalid username or password");

        // 3️⃣ Tạo JWT token
        var token = GenerateJwtToken(user);

        var authData = new
        {
            Token = token,
            User = new UserResponseDto
            {
                Id = user.Id,
                UserName = user.UserName,
                Email = user.Email,
                FullName = user.FullName
            }
        };

        return this.SuccessResponse(authData, "Login successful", 200);
    }

    // ✅ Hàm helper để tạo JWT token
    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JWT");
        var secretKey = jwtSettings["SecretKey"];
        var issuer = jwtSettings["Issuer"];
        var audience = jwtSettings["Audience"];
        var expirationMinutes = int.Parse(jwtSettings["ExpirationMinutes"] ?? "60");

        // 1️⃣ Tạo security key từ secret
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // 2️⃣ Tạo claims (thông tin user sẽ được encode vào token)
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.UserName),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("FullName", user.FullName)
        };

        // 3️⃣ Tạo JWT token
        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials
        );

        // 4️⃣ Convert token thành string
        var tokenHandler = new JwtSecurityTokenHandler();
        return tokenHandler.WriteToken(token);
    }
}
