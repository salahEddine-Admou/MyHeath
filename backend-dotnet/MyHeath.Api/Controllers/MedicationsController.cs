using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MyHeath.Api.Infrastructure;
using MyHeath.Api.Models;
using MyHeath.Api.Services;

namespace MyHeath.Api.Controllers;

[ApiController]
[Route("api/medications")]
[Authorize(Roles = Roles.Patient)]
public class MedicationsController : ApiControllerBase
{
    public MedicationsController(MongoContext db) : base(db) { }

    public record ReminderDto(string MedicationName, string? Dosage, List<string>? TimesOfDay, bool? Active, string? Notes);

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        var items = await Db.MedicationReminders.Find(m => m.Patient == user.Id)
            .SortByDescending(m => m.CreatedAt).ToListAsync();
        return Ok(new { reminders = items });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ReminderDto dto)
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        if (string.IsNullOrWhiteSpace(dto.MedicationName)) return Fail("MedicationName required");
        var item = new MedicationReminder
        {
            Patient = user.Id,
            MedicationName = dto.MedicationName.Trim(),
            Dosage = dto.Dosage ?? "",
            TimesOfDay = dto.TimesOfDay ?? new List<string> { "08:00" },
            Active = dto.Active != false,
            Notes = dto.Notes ?? ""
        };
        await Db.MedicationReminders.InsertOneAsync(item);
        await Db.Notifications.InsertOneAsync(new AppNotification
        {
            User = user.Id,
            Title = "Reminder created",
            Body = $"{item.MedicationName} at {string.Join(", ", item.TimesOfDay)}",
            Type = "medication",
            Link = "/medications"
        });
        return StatusCode(201, new { reminder = item });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] ReminderDto dto)
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        var item = await Db.MedicationReminders.Find(m => m.Id == id && m.Patient == user.Id).FirstOrDefaultAsync();
        if (item is null) return Fail("Not found", 404);
        if (dto.MedicationName != null) item.MedicationName = dto.MedicationName;
        if (dto.Dosage != null) item.Dosage = dto.Dosage;
        if (dto.TimesOfDay != null) item.TimesOfDay = dto.TimesOfDay;
        if (dto.Active.HasValue) item.Active = dto.Active.Value;
        if (dto.Notes != null) item.Notes = dto.Notes;
        await Db.MedicationReminders.ReplaceOneAsync(m => m.Id == id, item);
        return Ok(new { reminder = item });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        var r = await Db.MedicationReminders.DeleteOneAsync(m => m.Id == id && m.Patient == user.Id);
        if (r.DeletedCount == 0) return Fail("Not found", 404);
        return Ok(new { ok = true });
    }
}
