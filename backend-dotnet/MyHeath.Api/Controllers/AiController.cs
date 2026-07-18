using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MyHeath.Api.Infrastructure;
using MyHeath.Api.Models;
using MyHeath.Api.Services;

namespace MyHeath.Api.Controllers;

[ApiController]
[Route("api/ai")]
[Authorize(Roles = $"{Roles.Patient},{Roles.Doctor},{Roles.Admin}")]
public class AiController : ApiControllerBase
{
    private readonly ClaudeService _claude;

    public AiController(MongoContext db, ClaudeService claude) : base(db) => _claude = claude;

    public record ChatDto(string Message, List<ChatMsg>? History);
    public record ChatMsg(string Role, string Content);
    public record TextDto(string Text);
    public record ConcernDto(string? Concern);

    private string SystemFor(User user) =>
        $"""
        You are MyHeath AI Coach, a supportive wellness companion for a {user.Gender} {user.Role}.
        Diabetes profile: {(user.HasDiabetes ? user.DiabetesType : "none")}.
        Give practical, non-diagnostic guidance. Always remind users to consult a clinician for medical decisions.
        Respond in clear English. Be concise and actionable.
        """;

    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] ChatDto dto, CancellationToken ct)
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        if (!_claude.IsConfigured) return Fail("ANTHROPIC_API_KEY is missing", 503);
        if (string.IsNullOrWhiteSpace(dto.Message)) return Fail("message required");

        var history = (dto.History ?? new())
            .Where(m => m.Role is "user" or "assistant")
            .Select(m => (object)new { role = m.Role, content = m.Content.Length > 4000 ? m.Content[..4000] : m.Content })
            .ToList();
        history.Add(new { role = "user", content = dto.Message.Trim() });

        try
        {
            var (reply, model, usage) = await _claude.ChatAsync(SystemFor(user), history, ct);
            return Ok(new
            {
                reply,
                model,
                usage,
                disclaimer = "Educational support only — not a medical diagnosis."
            });
        }
        catch (Exception ex)
        {
            return Fail(ex.Message, 502);
        }
    }

    [HttpPost("coach-plan")]
    [Authorize(Roles = Roles.Patient)]
    public Task<IActionResult> CoachPlan(CancellationToken ct) =>
        RunPatientPrompt(ct, "Create a 7-day personalized wellness coach plan as JSON with days[], focus, tips.");

    [HttpPost("explain-insights")]
    [Authorize(Roles = Roles.Patient)]
    public Task<IActionResult> ExplainInsights(CancellationToken ct) =>
        RunPatientPrompt(ct, "Explain recent cycle/wellness insights in plain language for the patient.", "explanation");

    [HttpPost("parse-symptoms")]
    [Authorize(Roles = Roles.Patient)]
    public async Task<IActionResult> ParseSymptoms([FromBody] TextDto dto, CancellationToken ct)
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        if (!_claude.IsConfigured) return Fail("ANTHROPIC_API_KEY is missing", 503);
        try
        {
            var (raw, _, _) = await _claude.ChatAsync(SystemFor(user), new[]
            {
                new { role = "user", content = $"Parse symptoms from text into JSON {{symptoms:[], painLevel:0-10, mood, notes}}: {dto.Text}" }
            }, ct);
            return Ok(new { parsed = raw, raw });
        }
        catch (Exception ex) { return Fail(ex.Message, 502); }
    }

    [HttpPost("doctor-brief")]
    [Authorize(Roles = Roles.Patient)]
    public Task<IActionResult> DoctorBrief(CancellationToken ct) =>
        RunPatientPrompt(ct, "Write a short clinical-style brief the patient can show their doctor.", "brief");

    [HttpPost("wellness-plan")]
    [Authorize(Roles = Roles.Patient)]
    public Task<IActionResult> WellnessPlan(CancellationToken ct) =>
        RunPatientPrompt(ct, "Produce a weekly wellness plan (sleep, activity, nutrition, stress).", "plan");

    [HttpPost("ask-doctor")]
    [Authorize(Roles = Roles.Patient)]
    public async Task<IActionResult> AskDoctor([FromBody] ConcernDto dto, CancellationToken ct)
    {
        var prompt = $"Help the patient prepare questions for their doctor about: {dto.Concern ?? "general health"}";
        return await RunPatientPrompt(ct, prompt, "prep");
    }

    private async Task<IActionResult> RunPatientPrompt(CancellationToken ct, string prompt, string key = "plan")
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        if (!_claude.IsConfigured) return Fail("ANTHROPIC_API_KEY is missing", 503);

        var daily = await Db.DailyHealthLogs.Find(l => l.Patient == user.Id)
            .SortByDescending(l => l.Date).Limit(7).ToListAsync();
        var context = $"Patient: {user.Gender}, diabetes={user.HasDiabetes}. Recent scores: " +
                      string.Join(", ", daily.Select(d => $"{d.Date:yyyy-MM-dd}:{d.HealthScore}"));

        try
        {
            var (text, model, _) = await _claude.ChatAsync(SystemFor(user), new[]
            {
                new { role = "user", content = context + "\n\n" + prompt }
            }, ct);
            return Ok(new Dictionary<string, object?> { [key] = text, ["model"] = model });
        }
        catch (Exception ex) { return Fail(ex.Message, 502); }
    }
}
