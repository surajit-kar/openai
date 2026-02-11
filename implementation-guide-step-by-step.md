# Step-by-Step Implementation Guide
## Google Keep Clone - From Zero to Production

---

## 📋 Table of Contents
1. [Development Environment Setup](#phase-0)
2. [Phase 1: Foundation & User Service](#phase-1)
3. [Phase 2: Notes Service & API Gateway](#phase-2)
4. [Phase 3: Attachment Service](#phase-3)
5. [Phase 4: Search & Advanced Features](#phase-4)
6. [Phase 5: Real-Time Sync](#phase-5)
7. [Phase 6: Deployment & Production](#phase-6)

---

## PHASE 0: Development Environment Setup (Day 1-2)

### Step 1: Install Required Software on Windows Server

#### 1.1 Install Visual Studio 2022
```powershell
# Download from: https://visualstudio.microsoft.com/downloads/
# Select workloads:
# - ASP.NET and web development
# - .NET desktop development
# - Azure development (optional)
```

#### 1.2 Install .NET 8 SDK
```powershell
# Download from: https://dotnet.microsoft.com/download/dotnet/8.0
winget install Microsoft.DotNet.SDK.8
```

#### 1.3 Install SQL Server 2022 Developer Edition
```powershell
# Download from: https://www.microsoft.com/sql-server/sql-server-downloads
# Install SQL Server Management Studio (SSMS):
winget install Microsoft.SQLServerManagementStudio
```

#### 1.4 Install Redis on Windows
```powershell
# Option 1: Using Memurai (Redis alternative for Windows)
# Download from: https://www.memurai.com/get-memurai

# Option 2: Using Docker Desktop for Windows
winget install Docker.DockerDesktop
# Then run:
docker run -d --name redis -p 6379:6379 redis:latest
```

#### 1.5 Install RabbitMQ
```powershell
# Install Erlang first (RabbitMQ dependency)
# Download from: https://www.erlang.org/downloads

# Install RabbitMQ
# Download from: https://www.rabbitmq.com/install-windows.html
choco install rabbitmq
# Enable management plugin:
rabbitmq-plugins enable rabbitmq_management
```

#### 1.6 Install Elasticsearch
```powershell
# Download from: https://www.elastic.co/downloads/elasticsearch
# Install as Windows Service:
elasticsearch-service.bat install
elasticsearch-service.bat start
```

#### 1.7 Install Git
```powershell
winget install Git.Git
```

#### 1.8 Install Postman (for API testing)
```powershell
winget install Postman.Postman
```

### Step 2: Create Project Structure
```powershell
# Create solution directory
mkdir C:\Projects\NoteTakingApp
cd C:\Projects\NoteTakingApp

# Create solution
dotnet new sln -n NoteTakingApp

# Create directory structure
mkdir src
mkdir src\Services
mkdir src\Gateway
mkdir src\Shared
mkdir tests
```

---

## PHASE 1: Foundation & User Service (Week 1-2)

### Step 3: Create Shared Library Project

```powershell
cd src\Shared
dotnet new classlib -n NoteTakingApp.Shared
cd ..\..
dotnet sln add src\Shared\NoteTakingApp.Shared\NoteTakingApp.Shared.csproj
```

#### 3.1 Create Shared Models
**File: `src/Shared/NoteTakingApp.Shared/Models/ApiResponse.cs`**
```csharp
namespace NoteTakingApp.Shared.Models;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public List<string>? Errors { get; set; }
    
    public static ApiResponse<T> SuccessResponse(T data, string message = "Success")
    {
        return new ApiResponse<T>
        {
            Success = true,
            Data = data,
            Message = message
        };
    }
    
    public static ApiResponse<T> ErrorResponse(string message, List<string>? errors = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message,
            Errors = errors ?? new List<string>()
        };
    }
}
```

**File: `src/Shared/NoteTakingApp.Shared/Models/JwtSettings.cs`**
```csharp
namespace NoteTakingApp.Shared.Models;

public class JwtSettings
{
    public string SecretKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpirationMinutes { get; set; } = 15;
    public int RefreshTokenExpirationDays { get; set; } = 7;
}
```

### Step 4: Create User Service

```powershell
cd src\Services
dotnet new webapi -n NoteTakingApp.UserService
cd ..\..
dotnet sln add src\Services\NoteTakingApp.UserService\NoteTakingApp.UserService.csproj
```

#### 4.1 Install NuGet Packages
```powershell
cd src\Services\NoteTakingApp.UserService

# Install required packages
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Tools
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package BCrypt.Net-Next
dotnet add package Swashbuckle.AspNetCore

cd ..\..\..
```

#### 4.2 Create Database Models
**File: `src/Services/NoteTakingApp.UserService/Models/User.cs`**
```csharp
using System.ComponentModel.DataAnnotations;

namespace NoteTakingApp.UserService.Models;

public class User
{
    [Key]
    public Guid UserId { get; set; } = Guid.NewGuid();
    
    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string PasswordHash { get; set; } = string.Empty;
    
    [MaxLength(100)]
    public string DisplayName { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public bool IsEmailVerified { get; set; } = false;
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    public virtual UserPreferences? Preferences { get; set; }
    public virtual ICollection<UserSession> Sessions { get; set; } = new List<UserSession>();
}

public class UserSession
{
    [Key]
    public Guid SessionId { get; set; } = Guid.NewGuid();
    
    public Guid UserId { get; set; }
    public virtual User User { get; set; } = null!;
    
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}

public class UserPreferences
{
    [Key]
    public Guid UserId { get; set; }
    public virtual User User { get; set; } = null!;
    
    public string Theme { get; set; } = "light";
    public string DefaultView { get; set; } = "list";
    public string SortOrder { get; set; } = "updated";
}
```

#### 4.3 Create DTOs
**File: `src/Services/NoteTakingApp.UserService/DTOs/UserDtos.cs`**
```csharp
using System.ComponentModel.DataAnnotations;

namespace NoteTakingApp.UserService.DTOs;

public class RegisterDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;
    
    [Required]
    public string DisplayName { get; set; } = string.Empty;
}

public class LoginDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string Password { get; set; } = string.Empty;
}

public class LoginResponseDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
}

public class UserDto
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class RefreshTokenDto
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}
```

#### 4.4 Create DbContext
**File: `src/Services/NoteTakingApp.UserService/Data/UserDbContext.cs`**
```csharp
using Microsoft.EntityFrameworkCore;
using NoteTakingApp.UserService.Models;

namespace NoteTakingApp.UserService.Data;

public class UserDbContext : DbContext
{
    public UserDbContext(DbContextOptions<UserDbContext> options) : base(options)
    {
    }
    
    public DbSet<User> Users { get; set; }
    public DbSet<UserSession> UserSessions { get; set; }
    public DbSet<UserPreferences> UserPreferences { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasOne(e => e.Preferences)
                  .WithOne(e => e.User)
                  .HasForeignKey<UserPreferences>(e => e.UserId);
        });
        
        // Session configuration
        modelBuilder.Entity<UserSession>(entity =>
        {
            entity.HasOne(e => e.User)
                  .WithMany(e => e.Sessions)
                  .HasForeignKey(e => e.UserId);
        });
    }
}
```

#### 4.5 Create Authentication Service
**File: `src/Services/NoteTakingApp.UserService/Services/IAuthService.cs`**
```csharp
using NoteTakingApp.UserService.DTOs;

namespace NoteTakingApp.UserService.Services;

public interface IAuthService
{
    Task<LoginResponseDto> RegisterAsync(RegisterDto dto);
    Task<LoginResponseDto> LoginAsync(LoginDto dto, string ipAddress, string userAgent);
    Task<LoginResponseDto> RefreshTokenAsync(string refreshToken);
    Task<bool> RevokeTokenAsync(string refreshToken);
}
```

**File: `src/Services/NoteTakingApp.UserService/Services/AuthService.cs`**
```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NoteTakingApp.UserService.Data;
using NoteTakingApp.UserService.DTOs;
using NoteTakingApp.UserService.Models;
using BCrypt.Net;

namespace NoteTakingApp.UserService.Services;

public class AuthService : IAuthService
{
    private readonly UserDbContext _context;
    private readonly IConfiguration _configuration;
    
    public AuthService(UserDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }
    
    public async Task<LoginResponseDto> RegisterAsync(RegisterDto dto)
    {
        // Check if user exists
        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
        {
            throw new Exception("Email already registered");
        }
        
        // Create user
        var user = new User
        {
            Email = dto.Email,
            DisplayName = dto.DisplayName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };
        
        _context.Users.Add(user);
        
        // Create default preferences
        var preferences = new UserPreferences
        {
            UserId = user.UserId
        };
        
        _context.UserPreferences.Add(preferences);
        await _context.SaveChangesAsync();
        
        // Generate tokens
        var accessToken = GenerateAccessToken(user);
        var refreshToken = GenerateRefreshToken();
        
        // Save refresh token
        var session = new UserSession
        {
            UserId = user.UserId,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        
        _context.UserSessions.Add(session);
        await _context.SaveChangesAsync();
        
        return new LoginResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            User = MapToUserDto(user)
        };
    }
    
    public async Task<LoginResponseDto> LoginAsync(LoginDto dto, string ipAddress, string userAgent)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == dto.Email);
        
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            throw new Exception("Invalid credentials");
        }
        
        if (!user.IsActive)
        {
            throw new Exception("Account is deactivated");
        }
        
        var accessToken = GenerateAccessToken(user);
        var refreshToken = GenerateRefreshToken();
        
        var session = new UserSession
        {
            UserId = user.UserId,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IpAddress = ipAddress,
            UserAgent = userAgent
        };
        
        _context.UserSessions.Add(session);
        await _context.SaveChangesAsync();
        
        return new LoginResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            User = MapToUserDto(user)
        };
    }
    
    public async Task<LoginResponseDto> RefreshTokenAsync(string refreshToken)
    {
        var session = await _context.UserSessions
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.RefreshToken == refreshToken);
        
        if (session == null || session.ExpiresAt < DateTime.UtcNow)
        {
            throw new Exception("Invalid or expired refresh token");
        }
        
        var accessToken = GenerateAccessToken(session.User);
        var newRefreshToken = GenerateRefreshToken();
        
        session.RefreshToken = newRefreshToken;
        session.ExpiresAt = DateTime.UtcNow.AddDays(7);
        
        await _context.SaveChangesAsync();
        
        return new LoginResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = newRefreshToken,
            User = MapToUserDto(session.User)
        };
    }
    
    public async Task<bool> RevokeTokenAsync(string refreshToken)
    {
        var session = await _context.UserSessions
            .FirstOrDefaultAsync(s => s.RefreshToken == refreshToken);
        
        if (session == null)
            return false;
        
        _context.UserSessions.Remove(session);
        await _context.SaveChangesAsync();
        
        return true;
    }
    
    private string GenerateAccessToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"]!;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim("displayName", user.DisplayName)
        };
        
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        
        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(jwtSettings["ExpirationMinutes"]!)),
            signingCredentials: credentials
        );
        
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    
    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }
    
    private UserDto MapToUserDto(User user)
    {
        return new UserDto
        {
            UserId = user.UserId,
            Email = user.Email,
            DisplayName = user.DisplayName,
            CreatedAt = user.CreatedAt
        };
    }
}
```

#### 4.6 Create Controllers
**File: `src/Services/NoteTakingApp.UserService/Controllers/AuthController.cs`**
```csharp
using Microsoft.AspNetCore.Mvc;
using NoteTakingApp.Shared.Models;
using NoteTakingApp.UserService.DTOs;
using NoteTakingApp.UserService.Services;

namespace NoteTakingApp.UserService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    
    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }
    
    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<LoginResponseDto>>> Register([FromBody] RegisterDto dto)
    {
        try
        {
            var result = await _authService.RegisterAsync(dto);
            return Ok(ApiResponse<LoginResponseDto>.SuccessResponse(result, "Registration successful"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<LoginResponseDto>.ErrorResponse(ex.Message));
        }
    }
    
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<LoginResponseDto>>> Login([FromBody] LoginDto dto)
    {
        try
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();
            
            var result = await _authService.LoginAsync(dto, ipAddress, userAgent);
            return Ok(ApiResponse<LoginResponseDto>.SuccessResponse(result, "Login successful"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<LoginResponseDto>.ErrorResponse(ex.Message));
        }
    }
    
    [HttpPost("refresh")]
    public async Task<ActionResult<ApiResponse<LoginResponseDto>>> RefreshToken([FromBody] RefreshTokenDto dto)
    {
        try
        {
            var result = await _authService.RefreshTokenAsync(dto.RefreshToken);
            return Ok(ApiResponse<LoginResponseDto>.SuccessResponse(result));
        }
        catch (Exception ex)
        {
            return Unauthorized(ApiResponse<LoginResponseDto>.ErrorResponse(ex.Message));
        }
    }
    
    [HttpPost("logout")]
    public async Task<ActionResult<ApiResponse<bool>>> Logout([FromBody] RefreshTokenDto dto)
    {
        try
        {
            await _authService.RevokeTokenAsync(dto.RefreshToken);
            return Ok(ApiResponse<bool>.SuccessResponse(true, "Logged out successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<bool>.ErrorResponse(ex.Message));
        }
    }
}
```

#### 4.7 Configure Program.cs
**File: `src/Services/NoteTakingApp.UserService/Program.cs`**
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using NoteTakingApp.UserService.Data;
using NoteTakingApp.UserService.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
builder.Services.AddDbContext<UserDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!))
        };
    });

// Services
builder.Services.AddScoped<IAuthService, AuthService>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

#### 4.8 Configure appsettings.json
**File: `src/Services/NoteTakingApp.UserService/appsettings.json`**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=NoteTakingApp_Users;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "JwtSettings": {
    "SecretKey": "YourSuperSecretKeyThatIsAtLeast32CharactersLong!",
    "Issuer": "NoteTakingApp",
    "Audience": "NoteTakingApp.Client",
    "ExpirationMinutes": 15,
    "RefreshTokenExpirationDays": 7
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

### Step 5: Create and Run Database Migration

```powershell
cd src\Services\NoteTakingApp.UserService

# Add migration
dotnet ef migrations add InitialCreate

# Update database
dotnet ef database update

cd ..\..\..
```

### Step 6: Test User Service

```powershell
cd src\Services\NoteTakingApp.UserService
dotnet run
```

Open browser to `https://localhost:5001/swagger` and test:
1. POST /api/auth/register
2. POST /api/auth/login
3. POST /api/auth/refresh

---

## PHASE 2: Notes Service (Week 3-4)

### Step 7: Create Notes Service

```powershell
cd src\Services
dotnet new webapi -n NoteTakingApp.NotesService
cd ..\..
dotnet sln add src\Services\NoteTakingApp.NotesService\NoteTakingApp.NotesService.csproj
```

#### 7.1 Install Packages
```powershell
cd src\Services\NoteTakingApp.NotesService
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Tools
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package StackExchange.Redis
dotnet add package Swashbuckle.AspNetCore
cd ..\..\..
```

#### 7.2 Create Models
**File: `src/Services/NoteTakingApp.NotesService/Models/Note.cs`**
```csharp
using System.ComponentModel.DataAnnotations;

namespace NoteTakingApp.NotesService.Models;

public class Note
{
    [Key]
    public Guid NoteId { get; set; } = Guid.NewGuid();
    
    public Guid UserId { get; set; }
    
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;
    
    public string Content { get; set; } = string.Empty;
    
    [MaxLength(7)]
    public string Color { get; set; } = "#FFFFFF";
    
    public bool IsPinned { get; set; } = false;
    public bool IsArchived { get; set; } = false;
    public bool IsTrashed { get; set; } = false;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }
    
    // Navigation properties
    public virtual ICollection<NoteLabel> NoteLabels { get; set; } = new List<NoteLabel>();
    public virtual ICollection<NoteCollaborator> Collaborators { get; set; } = new List<NoteCollaborator>();
}

public class Label
{
    [Key]
    public Guid LabelId { get; set; } = Guid.NewGuid();
    
    public Guid UserId { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(7)]
    public string Color { get; set; } = "#E0E0E0";
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public virtual ICollection<NoteLabel> NoteLabels { get; set; } = new List<NoteLabel>();
}

public class NoteLabel
{
    public Guid NoteId { get; set; }
    public virtual Note Note { get; set; } = null!;
    
    public Guid LabelId { get; set; }
    public virtual Label Label { get; set; } = null!;
    
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}

public class NoteCollaborator
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid NoteId { get; set; }
    public virtual Note Note { get; set; } = null!;
    
    public Guid CollaboratorUserId { get; set; }
    
    [MaxLength(20)]
    public string Permission { get; set; } = "view"; // view, edit
    
    public DateTime InvitedAt { get; set; } = DateTime.UtcNow;
}
```

#### 7.3 Create DTOs
**File: `src/Services/NoteTakingApp.NotesService/DTOs/NoteDtos.cs`**
```csharp
namespace NoteTakingApp.NotesService.DTOs;

public class CreateNoteDto
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Color { get; set; } = "#FFFFFF";
    public List<Guid> LabelIds { get; set; } = new();
}

public class UpdateNoteDto
{
    public string? Title { get; set; }
    public string? Content { get; set; }
    public string? Color { get; set; }
    public bool? IsPinned { get; set; }
    public bool? IsArchived { get; set; }
}

public class NoteDto
{
    public Guid NoteId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public bool IsPinned { get; set; }
    public bool IsArchived { get; set; }
    public bool IsTrashed { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<LabelDto> Labels { get; set; } = new();
}

public class LabelDto
{
    public Guid LabelId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}

public class CreateLabelDto
{
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#E0E0E0";
}
```

*(Continue in next message due to length...)*

---

## Quick Reference: What to Build Next

After User Service, the order is:

1. **Notes Service** (Week 3-4) - Core functionality
2. **API Gateway** (Week 5) - YARP reverse proxy
3. **Attachment Service** (Week 6-7) - File uploads
4. **Search Service** (Week 8) - Elasticsearch integration
5. **Notification Service** (Week 9) - SignalR real-time
6. **Sync Service** (Week 10) - Real-time sync
7. **Client Applications** (Week 11-14)
8. **Deployment** (Week 15-16)

Would you like me to continue with the complete implementation of Notes Service and beyond?
