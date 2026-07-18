using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MyHeath.Api.Infrastructure;
using MyHeath.Api.Models;
using MyHeath.Api.Services;

namespace MyHeath.Api.Controllers;

[ApiController]
[Route("api/health")]
[Authorize]
public class HealthController : ApiControllerBase
{
    private readonly AesCryptoService _aes;

    public HealthController(MongoContext db, AesCryptoService aes) : base(db) => _aes = aes;

    public record SymptomDto(
        DateTime? Date, string? EntryType, List<string>? Symptoms, int? PainLevel,
        string? Mood, string? Flow, double? Temperature, string? Notes);

    public record RecordDto(string? BloodType, object? Allergies, object? Medications, string? ClinicalNotes);

    [HttpPost("symptoms")]
    [Authorize(Roles = Roles.Patient)]
    public async Task<IActionResult> LogSymptom([FromBody] SymptomDto dto)
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        var log = new SymptomLog
        {
            Patient = user.Id,
            Date = dto.Date ?? DateTime.UtcNow,
            EntryType = dto.EntryType ?? "symptom",
            Symptoms = dto.Symptoms ?? new(),
            PainLevel = dto.PainLevel ?? 0,
            Mood = dto.Mood ?? "ok",
            Flow = dto.Flow ?? "",
            Temperature = dto.Temperature,
            Notes = dto.Notes ?? ""
        };
        await Db.SymptomLogs.InsertOneAsync(log);
        return StatusCode(201, new { log });
    }

    [HttpGet("symptoms")]
    [Authorize(Roles = $"{Roles.Patient},{Roles.Doctor},{Roles.Admin}")]
    public async Task<IActionResult> GetHistory()
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        var logs = await Db.SymptomLogs.Find(l => l.Patient == user.Id)
            .SortByDescending(l => l.Date).Limit(200).ToListAsync();
        return Ok(new { logs });
    }

    [HttpPut("symptoms/{id}")]
    [Authorize(Roles = Roles.Patient)]
    public async Task<IActionResult> UpdateSymptom(string id, [FromBody] SymptomDto dto)
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        var log = await Db.SymptomLogs.Find(l => l.Id == id && l.Patient == user.Id).FirstOrDefaultAsync();
        if (log is null) return Fail("Not found", 404);
        if (dto.Date.HasValue) log.Date = dto.Date.Value;
        if (dto.EntryType != null) log.EntryType = dto.EntryType;
        if (dto.Symptoms != null) log.Symptoms = dto.Symptoms;
        if (dto.PainLevel.HasValue) log.PainLevel = dto.PainLevel.Value;
        if (dto.Mood != null) log.Mood = dto.Mood;
        if (dto.Flow != null) log.Flow = dto.Flow;
        if (dto.Temperature.HasValue) log.Temperature = dto.Temperature;
        if (dto.Notes != null) log.Notes = dto.Notes;
        await Db.SymptomLogs.ReplaceOneAsync(l => l.Id == id, log);
        return Ok(new { log });
    }

    [HttpDelete("symptoms/{id}")]
    [Authorize(Roles = Roles.Patient)]
    public async Task<IActionResult> DeleteSymptom(string id)
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        var r = await Db.SymptomLogs.DeleteOneAsync(l => l.Id == id && l.Patient == user.Id);
        if (r.DeletedCount == 0) return Fail("Not found", 404);
        return Ok(new { ok = true, id });
    }

    [HttpGet("insights")]
    [Authorize(Roles = $"{Roles.Patient},{Roles.Doctor},{Roles.Admin}")]
    public async Task<IActionResult> Insights([FromQuery] string? patientId)
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        var targetId = user.Id;
        if (user.Role == Roles.Doctor && !string.IsNullOrEmpty(patientId))
        {
            var p = await Db.Users.Find(u => u.Id == patientId && u.AssignedDoctor == user.Id).FirstOrDefaultAsync();
            if (p is null) return Fail("Patient not found", 404);
            targetId = patientId;
        }
        var logs = await Db.SymptomLogs.Find(l => l.Patient == targetId).SortBy(l => l.Date).ToListAsync();
        var starts = logs.Where(l => l.EntryType == "period_start").ToList();
        var insights = CycleAnalyzer.Analyze(starts, logs);
        return Ok(new { insights, logsCount = logs.Count });
    }

    [HttpGet("periods")]
    [Authorize(Roles = Roles.Patient)]
    public async Task<IActionResult> Periods()
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        var logs = await Db.SymptomLogs.Find(l => l.Patient == user.Id).SortBy(l => l.Date).ToListAsync();
        var starts = logs.Where(l => l.EntryType == "period_start").ToList();
        var insights = CycleAnalyzer.Analyze(starts, logs);
        var calendarMarks = logs.Select(l => new
        {
            date = l.Date.ToString("yyyy-MM-dd"),
            type = l.EntryType,
            flow = l.Flow,
            pain = l.PainLevel
        }).ToList();
        return Ok(new
        {
            insights,
            avgPeriodLength = 5,
            openPeriod = (object?)null,
            episodes = starts.Select(s => new { start = s.Date.ToString("yyyy-MM-dd") }),
            calendarMarks,
            recentLogs = logs.TakeLast(20),
            stats = new { totalLogs = logs.Count, periodStarts = starts.Count }
        });
    }

    [HttpGet("record")]
    [Authorize(Roles = Roles.Patient)]
    public async Task<IActionResult> GetRecord()
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        var record = await Db.HealthRecords.Find(r => r.Patient == user.Id).FirstOrDefaultAsync()
                     ?? new HealthRecord { Patient = user.Id };
        return Ok(new { record = DecryptRecord(record) });
    }

    [HttpPut("record")]
    [Authorize(Roles = Roles.Patient)]
    public async Task<IActionResult> UpdateRecord([FromBody] RecordDto dto)
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        var record = await Db.HealthRecords.Find(r => r.Patient == user.Id).FirstOrDefaultAsync()
                     ?? new HealthRecord { Patient = user.Id };
        if (dto.BloodType != null) record.BloodType = dto.BloodType;
        if (dto.Allergies != null) record.AllergiesEncrypted = _aes.Encrypt(dto.Allergies);
        if (dto.Medications != null) record.MedicationsEncrypted = _aes.Encrypt(dto.Medications);
        if (dto.ClinicalNotes != null) record.NotesEncrypted = _aes.Encrypt(dto.ClinicalNotes);
        record.LastUpdatedBy = user.Id;
        record.UpdatedAt = DateTime.UtcNow;
        await Db.HealthRecords.ReplaceOneAsync(r => r.Patient == user.Id, record, new ReplaceOptions { IsUpsert = true });
        return Ok(new { record = DecryptRecord(record) });
    }

    private object DecryptRecord(HealthRecord r) => new
    {
        id = r.Id,
        _id = r.Id,
        patient = r.Patient,
        bloodType = r.BloodType,
        allergies = _aes.Decrypt(r.AllergiesEncrypted),
        medications = _aes.Decrypt(r.MedicationsEncrypted),
        clinicalNotes = _aes.DecryptToString(r.NotesEncrypted),
        lastUpdatedBy = r.LastUpdatedBy,
        updatedAt = r.UpdatedAt
    };
}
