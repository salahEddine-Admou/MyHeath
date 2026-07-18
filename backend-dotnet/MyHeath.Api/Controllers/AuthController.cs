using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MyHeath.Api.Infrastructure;
using MyHeath.Api.Models;
using MyHeath.Api.Services;

namespace MyHeath.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ApiControllerBase
{
    private readonly JwtTokenService _jwt;

    public AuthController(MongoContext db, JwtTokenService jwt) : base(db) => _jwt = jwt;

    public record RegisterDto(
        string FirstName, string LastName, string Email, string Password,
        string? Role, string? Phone, string? Specialty, string? Gender,
        bool? HasDiabetes, string? DiabetesType);

    public record LoginDto(string Email, string Password);
    public record AssignDoctorDto(string DoctorId);

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 6)
            return Fail("Invalid registration data");

        var email = dto.Email.Trim().ToLowerInvariant();
        if (await Db.Users.Find(u => u.Email == email).AnyAsync())
            return Fail("This email is already registered", 409);

        var role = dto.Role is "doctor" or "patient" ? dto.Role! : Roles.Patient;
        var gender = dto.Gender == "man" ? "man" : "woman";
        var user = new User
        {
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim(),
            Email = email,
            Password = BCrypt.Net.BCrypt.HashPassword(dto.Password, 12),
            Role = role,
            Gender = gender,
            HasDiabetes = dto.HasDiabetes == true,
            DiabetesType = dto.HasDiabetes == true ? (dto.DiabetesType ?? "type2") : "none",
            Phone = dto.Phone ?? "",
            Specialty = role == Roles.Doctor
                ? (dto.Specialty ?? (gender == "man" ? "General medicine" : "Gynecology"))
                : ""
        };
        await Db.Users.InsertOneAsync(user);

        if (user.Role == Roles.Patient)
        {
            await Db.HealthRecords.InsertOneAsync(new HealthRecord { Patient = user.Id });
        }

        return StatusCode(201, new { token = _jwt.CreateToken(user), user = UserMapper.ToSafe(user) });
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            return Fail("Email and password are required");

        var email = dto.Email.Trim().ToLowerInvariant();
        var user = await Db.Users.Find(u => u.Email == email).FirstOrDefaultAsync();
        if (user is null || !user.IsActive || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Password))
            return Fail("Invalid credentials", 401);

        return Ok(new { token = _jwt.CreateToken(user), user = UserMapper.ToSafe(user) });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        return Ok(new { user = UserMapper.ToSafe(user) });
    }

    [HttpGet("doctors")]
    [Authorize]
    public async Task<IActionResult> ListDoctors()
    {
        var doctors = await Db.Users.Find(u => u.Role == Roles.Doctor && u.IsActive)
            .Project(u => new { u.FirstName, u.LastName, u.Specialty, u.Email, id = u.Id })
            .ToListAsync();
        // Match Node shape (firstName etc.) — project loses Id naming; rebuild
        var list = await Db.Users.Find(u => u.Role == Roles.Doctor && u.IsActive).ToListAsync();
        return Ok(new
        {
            doctors = list.Select(d => new
            {
                _id = d.Id,
                id = d.Id,
                firstName = d.FirstName,
                lastName = d.LastName,
                specialty = d.Specialty,
                email = d.Email
            })
        });
    }

    [HttpPost("assign-doctor")]
    [Authorize(Roles = Roles.Patient)]
    public async Task<IActionResult> AssignDoctor([FromBody] AssignDoctorDto dto)
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        var doctor = await Db.Users.Find(u => u.Id == dto.DoctorId && u.Role == Roles.Doctor).FirstOrDefaultAsync();
        if (doctor is null) return Fail("Doctor not found", 404);

        user.AssignedDoctor = doctor.Id;
        user.UpdatedAt = DateTime.UtcNow;
        await Db.Users.ReplaceOneAsync(u => u.Id == user.Id, user);
        return Ok(new { user = UserMapper.ToSafe(user) });
    }
}
