using InteractHub.API.Controllers;
using InteractHub.API.DTOs;
using InteractHub.Application.Constants;
using InteractHub.Application.Entities;
using InteractHub.Tests.Common;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Moq;

namespace InteractHub.Tests.Unit.Controllers;

public class AuthControllerTests
{
    // Register tests - kiểm tra định dạng email
    [Fact]
    public async Task Register_ShouldReturnBadRequest_WhenEmailFormatInvalid()
    {
        // Given
        var userManagerMock = IdentityMockFactory.CreateUserManagerMock();
        var signInManagerMock = IdentityMockFactory.CreateSignInManagerMock(userManagerMock.Object);
        var controller = new AuthController(userManagerMock.Object, signInManagerMock.Object, BuildJwtConfiguration());

        // When
        var result = await controller.Register(new RegisterDto
        {
            UserName = "valid_name",
            Email = "invalid-email",
            Password = "Aa123456!",
            FullName = "Test User"
        });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(400, objectResult.StatusCode);
    }

    // Register tests - kiểm tra email rỗng
    [Fact]
    public async Task Register_ShouldReturnBadRequest_WhenEmailIsEmpty()
    {
        // Given
        var userManagerMock = IdentityMockFactory.CreateUserManagerMock();
        var signInManagerMock = IdentityMockFactory.CreateSignInManagerMock(userManagerMock.Object);
        var controller = new AuthController(userManagerMock.Object, signInManagerMock.Object, BuildJwtConfiguration());

        // When
        var result = await controller.Register(new RegisterDto
        {
            UserName = "valid_name",
            Email = "",
            Password = "Aa123456!",
            FullName = "Test User"
        });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(400, objectResult.StatusCode);
    }

    // Register tests - kiểm tra username quá ngắn
    [Fact]
    public async Task Register_ShouldReturnBadRequest_WhenUsernameTooShort()
    {
        // Given
        var userManagerMock = IdentityMockFactory.CreateUserManagerMock();
        var signInManagerMock = IdentityMockFactory.CreateSignInManagerMock(userManagerMock.Object);
        var controller = new AuthController(userManagerMock.Object, signInManagerMock.Object, BuildJwtConfiguration());

        // When
        var result = await controller.Register(new RegisterDto
        {
            UserName = "ab",
            Email = "test@mail.com",
            Password = "Aa123456!",
            FullName = "Test User"
        });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(400, objectResult.StatusCode);
    }

    // Register tests - kiểm tra username quá dài
    [Fact]
    public async Task Register_ShouldReturnBadRequest_WhenUsernameTooLong()
    {
        // Given
        var userManagerMock = IdentityMockFactory.CreateUserManagerMock();
        var signInManagerMock = IdentityMockFactory.CreateSignInManagerMock(userManagerMock.Object);
        var controller = new AuthController(userManagerMock.Object, signInManagerMock.Object, BuildJwtConfiguration());

        // When
        var result = await controller.Register(new RegisterDto
        {
            UserName = "this_is_a_very_long_username_that_exceeds_limit",
            Email = "test@mail.com",
            Password = "Aa123456!",
            FullName = "Test User"
        });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(400, objectResult.StatusCode);
    }

    // Register tests - kiểm tra username chứa ký tự không hợp lệ
    [Fact]
    public async Task Register_ShouldReturnBadRequest_WhenUsernameHasInvalidCharacters()
    {
        // Given
        var userManagerMock = IdentityMockFactory.CreateUserManagerMock();
        var signInManagerMock = IdentityMockFactory.CreateSignInManagerMock(userManagerMock.Object);
        var controller = new AuthController(userManagerMock.Object, signInManagerMock.Object, BuildJwtConfiguration());

        // When
        var result = await controller.Register(new RegisterDto
        {
            UserName = "invalid-name!",
            Email = "test@mail.com",
            Password = "Aa123456!",
            FullName = "Test User"
        });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(400, objectResult.StatusCode);
    }

    // Register tests - kiểm tra fullname quá ngắn
    [Fact]
    public async Task Register_ShouldReturnBadRequest_WhenFullNameTooShort()
    {
        // Given
        var userManagerMock = IdentityMockFactory.CreateUserManagerMock();
        var signInManagerMock = IdentityMockFactory.CreateSignInManagerMock(userManagerMock.Object);
        var controller = new AuthController(userManagerMock.Object, signInManagerMock.Object, BuildJwtConfiguration());

        // When
        var result = await controller.Register(new RegisterDto
        {
            UserName = "valid_name",
            Email = "test@mail.com",
            Password = "Aa123456!",
            FullName = "A"
        });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(400, objectResult.StatusCode);
    }

    // Register tests - kiểm tra fullname quá dài
    [Fact]
    public async Task Register_ShouldReturnBadRequest_WhenFullNameTooLong()
    {
        // Given
        var userManagerMock = IdentityMockFactory.CreateUserManagerMock();
        var signInManagerMock = IdentityMockFactory.CreateSignInManagerMock(userManagerMock.Object);
        var controller = new AuthController(userManagerMock.Object, signInManagerMock.Object, BuildJwtConfiguration());
        var longName = new string('A', 101);

        // When
        var result = await controller.Register(new RegisterDto
        {
            UserName = "valid_name",
            Email = "test@mail.com",
            Password = "Aa123456!",
            FullName = longName
        });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(400, objectResult.StatusCode);
    }

    // Register tests - kiểm tra password quá ngắn
    [Fact]
    public async Task Register_ShouldReturnBadRequest_WhenPasswordTooShort()
    {
        // Given
        var userManagerMock = IdentityMockFactory.CreateUserManagerMock();
        var signInManagerMock = IdentityMockFactory.CreateSignInManagerMock(userManagerMock.Object);
        var controller = new AuthController(userManagerMock.Object, signInManagerMock.Object, BuildJwtConfiguration());

        // When
        var result = await controller.Register(new RegisterDto
        {
            UserName = "valid_name",
            Email = "test@mail.com",
            Password = "Short1!",
            FullName = "Test User"
        });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(400, objectResult.StatusCode);
    }

    // Register tests - kiểm tra password thiếu chữ hoa
    [Fact]
    public async Task Register_ShouldReturnBadRequest_WhenPasswordMissingUppercase()
    {
        // Given
        var userManagerMock = IdentityMockFactory.CreateUserManagerMock();
        var signInManagerMock = IdentityMockFactory.CreateSignInManagerMock(userManagerMock.Object);
        var controller = new AuthController(userManagerMock.Object, signInManagerMock.Object, BuildJwtConfiguration());

        // When
        var result = await controller.Register(new RegisterDto
        {
            UserName = "valid_name",
            Email = "test@mail.com",
            Password = "lowercase1!",
            FullName = "Test User"
        });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(400, objectResult.StatusCode);
    }

    // Register tests - kiểm tra password thiếu chữ thường
    [Fact]
    public async Task Register_ShouldReturnBadRequest_WhenPasswordMissingLowercase()
    {
        // Given
        var userManagerMock = IdentityMockFactory.CreateUserManagerMock();
        var signInManagerMock = IdentityMockFactory.CreateSignInManagerMock(userManagerMock.Object);
        var controller = new AuthController(userManagerMock.Object, signInManagerMock.Object, BuildJwtConfiguration());

        // When
        var result = await controller.Register(new RegisterDto
        {
            UserName = "valid_name",
            Email = "test@mail.com",
            Password = "UPPERCASE1!",
            FullName = "Test User"
        });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(400, objectResult.StatusCode);
    }

    // Register tests - kiểm tra password thiếu số
    [Fact]
    public async Task Register_ShouldReturnBadRequest_WhenPasswordMissingNumber()
    {
        // Given
        var userManagerMock = IdentityMockFactory.CreateUserManagerMock();
        var signInManagerMock = IdentityMockFactory.CreateSignInManagerMock(userManagerMock.Object);
        var controller = new AuthController(userManagerMock.Object, signInManagerMock.Object, BuildJwtConfiguration());

        // When
        var result = await controller.Register(new RegisterDto
        {
            UserName = "valid_name",
            Email = "test@mail.com",
            Password = "NoNumber!",
            FullName = "Test User"
        });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(400, objectResult.StatusCode);
    }

    // Register tests - kiểm tra password thiếu ký tự đặc biệt
    [Fact]
    public async Task Register_ShouldReturnBadRequest_WhenPasswordMissingSpecialChar()
    {
        // Given
        var userManagerMock = IdentityMockFactory.CreateUserManagerMock();
        var signInManagerMock = IdentityMockFactory.CreateSignInManagerMock(userManagerMock.Object);
        var controller = new AuthController(userManagerMock.Object, signInManagerMock.Object, BuildJwtConfiguration());

        // When
        var result = await controller.Register(new RegisterDto
        {
            UserName = "valid_name",
            Email = "test@mail.com",
            Password = "NoSpecial123",
            FullName = "Test User"
        });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(400, objectResult.StatusCode);
    }

    // Register tests - kiểm tra username đã tồn tại
    [Fact]
    public async Task Register_ShouldReturnBadRequest_WhenUsernameAlreadyExists()
    {
        // Given
        var userManagerMock = IdentityMockFactory.CreateUserManagerMock();
        userManagerMock.Setup(m => m.FindByNameAsync("taken_name"))
            .ReturnsAsync(new User { Id = "u1", UserName = "taken_name", Email = "taken@mail.com", FullName = "Taken" });
        var signInManagerMock = IdentityMockFactory.CreateSignInManagerMock(userManagerMock.Object);
        var controller = new AuthController(userManagerMock.Object, signInManagerMock.Object, BuildJwtConfiguration());

        // When
        var result = await controller.Register(new RegisterDto
        {
            UserName = "taken_name",
            Email = "new@mail.com",
            Password = "Aa123456!",
            FullName = "New User"
        });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(400, objectResult.StatusCode);
    }

    // Register tests - kiểm tra email đã tồn tại
    [Fact]
    public async Task Register_ShouldReturnBadRequest_WhenEmailAlreadyExists()
    {
        // Given
        var userManagerMock = IdentityMockFactory.CreateUserManagerMock();
        userManagerMock.Setup(m => m.FindByNameAsync("new_name")).ReturnsAsync((User?)null);
        userManagerMock.Setup(m => m.FindByEmailAsync("taken@mail.com"))
            .ReturnsAsync(new User { Id = "u1", UserName = "old_user", Email = "taken@mail.com", FullName = "Old User" });
        var signInManagerMock = IdentityMockFactory.CreateSignInManagerMock(userManagerMock.Object);
        var controller = new AuthController(userManagerMock.Object, signInManagerMock.Object, BuildJwtConfiguration());

        // When
        var result = await controller.Register(new RegisterDto
        {
            UserName = "new_name",
            Email = "taken@mail.com",
            Password = "Aa123456!",
            FullName = "New User"
        });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(400, objectResult.StatusCode);
    }

    // Register tests - đăng ký thành công
    [Fact]
    public async Task Register_ShouldReturnCreated_WhenInputIsValid()
    {
        // Given
        var userManagerMock = IdentityMockFactory.CreateUserManagerMock();
        userManagerMock.Setup(m => m.FindByNameAsync("new_user")).ReturnsAsync((User?)null);
        userManagerMock.Setup(m => m.FindByEmailAsync("new@mail.com")).ReturnsAsync((User?)null);
        userManagerMock
            .Setup(m => m.CreateAsync(It.IsAny<User>(), "Aa123456!"))
            .ReturnsAsync(IdentityResult.Success);
        userManagerMock
            .Setup(m => m.AddToRoleAsync(It.IsAny<User>(), RoleConstants.User))
            .ReturnsAsync(IdentityResult.Success);
        userManagerMock
            .Setup(m => m.GetRolesAsync(It.IsAny<User>()))
            .ReturnsAsync(new List<string> { RoleConstants.User });

        var signInManagerMock = IdentityMockFactory.CreateSignInManagerMock(userManagerMock.Object);
        var controller = new AuthController(userManagerMock.Object, signInManagerMock.Object, BuildJwtConfiguration());

        // When
        var result = await controller.Register(new RegisterDto
        {
            UserName = "new_user",
            Email = "new@mail.com",
            Password = "Aa123456!",
            FullName = "New User"
        });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(201, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
    }

    // Register tests - tạo user thất bại
    [Fact]
    public async Task Register_ShouldReturnBadRequest_WhenCreateUserFails()
    {
        // Given
        var userManagerMock = IdentityMockFactory.CreateUserManagerMock();
        userManagerMock.Setup(m => m.FindByNameAsync("new_user")).ReturnsAsync((User?)null);
        userManagerMock.Setup(m => m.FindByEmailAsync("new@mail.com")).ReturnsAsync((User?)null);
        var error = new IdentityError { Description = "Creation failed" };
        userManagerMock
            .Setup(m => m.CreateAsync(It.IsAny<User>(), "Aa123456!"))
            .ReturnsAsync(IdentityResult.Failed(error));

        var signInManagerMock = IdentityMockFactory.CreateSignInManagerMock(userManagerMock.Object);
        var controller = new AuthController(userManagerMock.Object, signInManagerMock.Object, BuildJwtConfiguration());

        // When
        var result = await controller.Register(new RegisterDto
        {
            UserName = "new_user",
            Email = "new@mail.com",
            Password = "Aa123456!",
            FullName = "New User"
        });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(400, objectResult.StatusCode);
    }

    // Register tests - gán role thất bại
    [Fact]
    public async Task Register_ShouldReturnBadRequest_WhenAddRoleFails()
    {
        // Given
        var userManagerMock = IdentityMockFactory.CreateUserManagerMock();
        userManagerMock.Setup(m => m.FindByNameAsync("new_user")).ReturnsAsync((User?)null);
        userManagerMock.Setup(m => m.FindByEmailAsync("new@mail.com")).ReturnsAsync((User?)null);
        userManagerMock
            .Setup(m => m.CreateAsync(It.IsAny<User>(), "Aa123456!"))
            .ReturnsAsync(IdentityResult.Success);
        var roleError = new IdentityError { Description = "Role assignment failed" };
        userManagerMock
            .Setup(m => m.AddToRoleAsync(It.IsAny<User>(), RoleConstants.User))
            .ReturnsAsync(IdentityResult.Failed(roleError));
        userManagerMock
            .Setup(m => m.DeleteAsync(It.IsAny<User>()))
            .ReturnsAsync(IdentityResult.Success);

        var signInManagerMock = IdentityMockFactory.CreateSignInManagerMock(userManagerMock.Object);
        var controller = new AuthController(userManagerMock.Object, signInManagerMock.Object, BuildJwtConfiguration());

        // When
        var result = await controller.Register(new RegisterDto
        {
            UserName = "new_user",
            Email = "new@mail.com",
            Password = "Aa123456!",
            FullName = "New User"
        });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(400, objectResult.StatusCode);
    }

    // Login tests - user không tồn tại
    [Fact]
    public async Task Login_ShouldReturnUnauthorized_WhenUserNotFound()
    {
        // Given
        var userManagerMock = IdentityMockFactory.CreateUserManagerMock();
        userManagerMock.Setup(m => m.FindByNameAsync("missing")).ReturnsAsync((User?)null);
        var signInManagerMock = IdentityMockFactory.CreateSignInManagerMock(userManagerMock.Object);
        var controller = new AuthController(userManagerMock.Object, signInManagerMock.Object, BuildJwtConfiguration());

        // When
        var result = await controller.Login(new LoginDto { UserName = "missing", Password = "password" });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(401, objectResult.StatusCode);
    }

    // Login tests - password không đúng
    [Fact]
    public async Task Login_ShouldReturnUnauthorized_WhenPasswordIsInvalid()
    {
        // Given
        var user = new User { Id = "u1", UserName = "john", Email = "john@mail.com", FullName = "John" };
        var userManagerMock = IdentityMockFactory.CreateUserManagerMock();
        userManagerMock.Setup(m => m.FindByNameAsync("john")).ReturnsAsync(user);
        var signInManagerMock = IdentityMockFactory.CreateSignInManagerMock(userManagerMock.Object);
        signInManagerMock
            .Setup(m => m.CheckPasswordSignInAsync(user, "bad-pass", false))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Failed);
        var controller = new AuthController(userManagerMock.Object, signInManagerMock.Object, BuildJwtConfiguration());

        // When
        var result = await controller.Login(new LoginDto { UserName = "john", Password = "bad-pass" });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(401, objectResult.StatusCode);
    }

    // Login tests - đăng nhập thành công với token
    [Fact]
    public async Task Login_ShouldReturnOk_WhenCredentialsAreValid()
    {
        // Given
        var user = new User { Id = "u1", UserName = "john", Email = "john@mail.com", FullName = "John Doe" };
        var userManagerMock = IdentityMockFactory.CreateUserManagerMock();
        userManagerMock.Setup(m => m.FindByNameAsync("john")).ReturnsAsync(user);
        userManagerMock.Setup(m => m.GetRolesAsync(user)).ReturnsAsync(new List<string> { RoleConstants.User });
        var signInManagerMock = IdentityMockFactory.CreateSignInManagerMock(userManagerMock.Object);
        signInManagerMock
            .Setup(m => m.CheckPasswordSignInAsync(user, "ValidPass123!", false))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);
        var controller = new AuthController(userManagerMock.Object, signInManagerMock.Object, BuildJwtConfiguration());

        // When
        var result = await controller.Login(new LoginDto { UserName = "john", Password = "ValidPass123!" });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
    }

    // Login tests - đăng nhập thành công với role Admin
    [Fact]
    public async Task Login_ShouldReturnOkWithAdminRole_WhenUserIsAdmin()
    {
        // Given
        var user = new User { Id = "u1", UserName = "admin", Email = "admin@mail.com", FullName = "Admin User" };
        var userManagerMock = IdentityMockFactory.CreateUserManagerMock();
        userManagerMock.Setup(m => m.FindByNameAsync("admin")).ReturnsAsync(user);
        userManagerMock.Setup(m => m.GetRolesAsync(user)).ReturnsAsync(new List<string> { RoleConstants.Admin, RoleConstants.User });
        var signInManagerMock = IdentityMockFactory.CreateSignInManagerMock(userManagerMock.Object);
        signInManagerMock
            .Setup(m => m.CheckPasswordSignInAsync(user, "AdminPass123!", false))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);
        var controller = new AuthController(userManagerMock.Object, signInManagerMock.Object, BuildJwtConfiguration());

        // When
        var result = await controller.Login(new LoginDto { UserName = "admin", Password = "AdminPass123!" });

        // Then
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.NotNull(objectResult.Value);
    }

    private static IConfiguration BuildJwtConfiguration()
    {
        var settings = new Dictionary<string, string?>
        {
            ["JWT:SecretKey"] = "this-is-a-test-secret-key-with-minimum-length",
            ["JWT:Issuer"] = "test-issuer",
            ["JWT:Audience"] = "test-audience",
            ["JWT:ExpirationMinutes"] = "60"
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(settings)
            .Build();
    }
}
