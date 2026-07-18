using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MyHeath.Api.Infrastructure;
using MyHeath.Api.Models;
using MyHeath.Api.Services;

namespace MyHeath.Api.Controllers;

[ApiController]
[Route("api/appointments")]
[Authorize]
public class AppointmentsController : ApiControllerBase
{
    private readonly MongoContext _db;

    public AppointmentsController(MongoContext db) : base(db) => _db = db;

    public record CreateDto(string DoctorId, DateTime ScheduledAt, int? DurationMinutes, string? Reason, string? Mode);
    public record StatusDto(string Status, string? Notes);

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);

        FilterDefinition<Appointment> filter = user.Role switch
        {
            Roles.Patient => Builders<Appointment>.Filter.Eq(a => a.Patient, user.Id),
            Roles.Doctor => Builders<Appointment>.Filter.Eq(a => a.Doctor, user.Id),
            _ => Builders<Appointment>.Filter.Empty
        };

        var items = await _db.Appointments.Find(filter).SortBy(a => a.ScheduledAt).ToListAsync();
        return Ok(new { appointments = items });
    }

    [HttpPost]
    [Authorize(Roles = Roles.Patient)]
    public async Task<IActionResult> Create([FromBody] CreateDto dto)
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        var doctor = await _db.Users.Find(u => u.Id == dto.DoctorId && u.Role == Roles.Doctor).FirstOrDefaultAsync();
        if (doctor is null) return Fail("Doctor not found", 404);

        var appt = new Appointment
        {
            Patient = user.Id,
            Doctor = dto.DoctorId,
            ScheduledAt = dto.ScheduledAt.ToUniversalTime(),
            DurationMinutes = dto.DurationMinutes is > 0 and <= 180 ? dto.DurationMinutes.Value : 30,
            Reason = dto.Reason ?? "",
            Mode = dto.Mode is "video" or "chat" or "in_person" ? dto.Mode! : "video",
            Status = "scheduled"
        };
        await _db.Appointments.InsertOneAsync(appt);

        await _db.Notifications.InsertOneAsync(new AppNotification
        {
            User = dto.DoctorId,
            Title = "New appointment",
            Body = $"{user.FirstName} {user.LastName} booked {appt.ScheduledAt:u}",
            Type = "appointment",
            Link = "/appointments"
        });
        await _db.Notifications.InsertOneAsync(new AppNotification
        {
            User = user.Id,
            Title = "Appointment confirmed",
            Body = $"With Dr. {doctor.LastName} on {appt.ScheduledAt:g}",
            Type = "appointment",
            Link = "/appointments"
        });

        return StatusCode(201, new { appointment = appt });
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = $"{Roles.Patient},{Roles.Doctor},{Roles.Admin}")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] StatusDto dto)
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        var appt = await _db.Appointments.Find(a => a.Id == id).FirstOrDefaultAsync();
        if (appt is null) return Fail("Not found", 404);
        if (user.Role == Roles.Patient && appt.Patient != user.Id) return Fail("Forbidden", 403);
        if (user.Role == Roles.Doctor && appt.Doctor != user.Id) return Fail("Forbidden", 403);
        if (dto.Status is not ("scheduled" or "completed" or "cancelled" or "no_show"))
            return Fail("Invalid status");

        appt.Status = dto.Status;
        if (dto.Notes != null) appt.Notes = dto.Notes;
        await _db.Appointments.ReplaceOneAsync(a => a.Id == id, appt);
        return Ok(new { appointment = appt });
    }
}
