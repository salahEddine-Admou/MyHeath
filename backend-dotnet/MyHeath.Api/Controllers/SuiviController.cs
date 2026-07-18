using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MyHeath.Api.Infrastructure;
using MyHeath.Api.Models;
using MyHeath.Api.Services;

namespace MyHeath.Api.Controllers;

[ApiController]
[Route("api/suivi")]
[Authorize(Roles = Roles.Patient)]
public class SuiviController : ApiControllerBase
{
    public SuiviController(MongoContext db) : base(db) { }

    public record DailyDto(
        DateTime? Date, int? Energy, double? SleepHours, int? SleepQuality, int? Stress,
        string? Mood, double? WaterLiters, int? Steps, int? ExerciseMinutes,
        string? WorkoutIntensity, int? Recovery, double? WeightKg, int? RestingHeartRate,
        double? FastingGlucose, double? PostMealGlucose, bool? TookMedication,
        double? CarbsGrams, List<string>? Symptoms, string? Notes);

    public record DiabetesProfileDto(bool? HasDiabetes, string? DiabetesType);

    [HttpPost("daily")]
    public async Task<IActionResult> UpsertDaily([FromBody] DailyDto dto)
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        var date = (dto.Date ?? DateTime.UtcNow).Date;
        var existing = await Db.DailyHealthLogs.Find(l => l.Patient == user.Id && l.Date == date).FirstOrDefaultAsync();
        var log = existing ?? new DailyHealthLog { Patient = user.Id, Date = date };
        Apply(log, dto);
        var (score, label) = HealthScoreService.Compute(log, user);
        log.HealthScore = score;
        log.HealthLabel = label;
        log.UpdatedAt = DateTime.UtcNow;
        if (existing is null) await Db.DailyHealthLogs.InsertOneAsync(log);
        else await Db.DailyHealthLogs.ReplaceOneAsync(l => l.Id == log.Id, log);

        return StatusCode(201, new
        {
            log,
            prediction = new { score, label, message = $"Predicted wellness: {label} ({score}/100)" },
            message = "Daily health saved"
        });
    }

    [HttpGet("daily")]
    public async Task<IActionResult> History([FromQuery] int limit = 30)
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        limit = Math.Clamp(limit, 1, 90);
        var logs = await Db.DailyHealthLogs.Find(l => l.Patient == user.Id)
            .SortByDescending(l => l.Date).Limit(limit).ToListAsync();
        var today = DateTime.UtcNow.Date;
        var todayLog = logs.FirstOrDefault(l => l.Date.Date == today);
        var chart = logs.OrderBy(l => l.Date).Select(l => new
        {
            date = l.Date.ToString("yyyy-MM-dd"),
            score = l.HealthScore,
            fasting = l.FastingGlucose
        });
        var avg = logs.Count > 0 ? (int)Math.Round(logs.Average(l => l.HealthScore)) : 0;
        return Ok(new
        {
            logs,
            trend = new { averageScore = avg, count = logs.Count },
            today = todayLog,
            chart
        });
    }

    [HttpGet("daily/today")]
    public async Task<IActionResult> Today()
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        var today = DateTime.UtcNow.Date;
        var log = await Db.DailyHealthLogs.Find(l => l.Patient == user.Id && l.Date == today).FirstOrDefaultAsync();
        object? prediction = log is null ? null : new { score = log.HealthScore, label = log.HealthLabel };
        return Ok(new { log, prediction });
    }

    [HttpGet("diabetes")]
    public async Task<IActionResult> Diabetes()
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        var recent = await Db.DailyHealthLogs.Find(l => l.Patient == user.Id)
            .SortByDescending(l => l.Date).Limit(30).ToListAsync();
        var withFasting = recent.Where(l => l.FastingGlucose != null).ToList();
        var avgFasting = withFasting.Count > 0 ? withFasting.Average(l => l.FastingGlucose!.Value) : (double?)null;
        var medDays = recent.Count(l => l.TookMedication);
        var adherence = recent.Count > 0 ? (int)Math.Round(100.0 * medDays / recent.Count) : 0;
        return Ok(new
        {
            profile = new { user.HasDiabetes, user.DiabetesType },
            avgFasting,
            adherencePercent = adherence,
            recent,
            chart = recent.OrderBy(l => l.Date).Select(l => new
            {
                date = l.Date.ToString("yyyy-MM-dd"),
                fasting = l.FastingGlucose,
                postMeal = l.PostMealGlucose
            })
        });
    }

    [HttpPut("diabetes/profile")]
    public async Task<IActionResult> UpdateDiabetes([FromBody] DiabetesProfileDto dto)
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        if (dto.HasDiabetes.HasValue) user.HasDiabetes = dto.HasDiabetes.Value;
        if (dto.DiabetesType != null) user.DiabetesType = dto.DiabetesType;
        user.UpdatedAt = DateTime.UtcNow;
        await Db.Users.ReplaceOneAsync(u => u.Id == user.Id, user);
        return Ok(new { user = UserMapper.ToSafe(user) });
    }

    private static void Apply(DailyHealthLog log, DailyDto dto)
    {
        if (dto.Energy.HasValue) log.Energy = dto.Energy.Value;
        if (dto.SleepHours.HasValue) log.SleepHours = dto.SleepHours.Value;
        if (dto.SleepQuality.HasValue) log.SleepQuality = dto.SleepQuality.Value;
        if (dto.Stress.HasValue) log.Stress = dto.Stress.Value;
        if (dto.Mood != null) log.Mood = dto.Mood;
        if (dto.WaterLiters.HasValue) log.WaterLiters = dto.WaterLiters.Value;
        if (dto.Steps.HasValue) log.Steps = dto.Steps.Value;
        if (dto.ExerciseMinutes.HasValue) log.ExerciseMinutes = dto.ExerciseMinutes.Value;
        if (dto.WorkoutIntensity != null) log.WorkoutIntensity = dto.WorkoutIntensity;
        if (dto.Recovery.HasValue) log.Recovery = dto.Recovery.Value;
        if (dto.WeightKg.HasValue) log.WeightKg = dto.WeightKg;
        if (dto.RestingHeartRate.HasValue) log.RestingHeartRate = dto.RestingHeartRate;
        if (dto.FastingGlucose.HasValue) log.FastingGlucose = dto.FastingGlucose;
        if (dto.PostMealGlucose.HasValue) log.PostMealGlucose = dto.PostMealGlucose;
        if (dto.TookMedication.HasValue) log.TookMedication = dto.TookMedication.Value;
        if (dto.CarbsGrams.HasValue) log.CarbsGrams = dto.CarbsGrams;
        if (dto.Symptoms != null) log.Symptoms = dto.Symptoms;
        if (dto.Notes != null) log.Notes = dto.Notes;
    }
}
