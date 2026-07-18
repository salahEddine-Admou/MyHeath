using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MyHeath.Api.Infrastructure;
using MyHeath.Api.Models;
using MyHeath.Api.Services;

namespace MyHeath.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = Roles.Admin)]
public class AdminController : ApiControllerBase
{
    private readonly AuditService _audit;

    public AdminController(MongoContext db, AuditService audit) : base(db) => _audit = audit;

    [HttpGet("overview")]
    public async Task<IActionResult> Overview()
    {
        var users = await Db.Users.Find(_ => true).ToListAsync();
        var plans = await Db.Plans.Find(p => p.IsActive).ToListAsync();
        var subs = await Db.Subscriptions.Find(_ => true).ToListAsync();
        var planMap = (await Db.Plans.Find(_ => true).ToListAsync()).ToDictionary(p => p.Id);

        var activeSubs = subs.Where(s => s.Status is "active" or "trial").ToList();
        double mrr = 0;
        foreach (var s in activeSubs)
        {
            if (!planMap.TryGetValue(s.Plan, out var plan)) continue;
            mrr += plan.Interval == "yearly" ? plan.Price / 12 : plan.Interval == "lifetime" ? 0 : plan.Price;
        }

        return Ok(new
        {
            counts = new
            {
                users = users.Count,
                activeUsers = users.Count(u => u.IsActive),
                admin = users.Count(u => u.Role == Roles.Admin),
                doctor = users.Count(u => u.Role == Roles.Doctor),
                patient = users.Count(u => u.Role == Roles.Patient),
                diabetes = users.Count(u => u.HasDiabetes),
                women = users.Count(u => u.Gender == "woman"),
                men = users.Count(u => u.Gender == "man"),
                plans = plans.Count,
                activeSubscriptions = activeSubs.Count,
                appointments = await Db.Appointments.CountDocumentsAsync(_ => true),
                notifications = await Db.Notifications.CountDocumentsAsync(_ => true)
            },
            mrr = Math.Round(mrr, 2),
            currency = "MAD"
        });
    }

    [HttpGet("users")]
    public async Task<IActionResult> ListUsers([FromQuery] string? all)
    {
        var filter = all == "1" ? Builders<User>.Filter.Empty : Builders<User>.Filter.Eq(u => u.IsActive, true);
        var users = await Db.Users.Find(filter).SortByDescending(u => u.CreatedAt).ToListAsync();
        var subs = await Db.Subscriptions.Find(s => s.Status == "active" || s.Status == "trial").ToListAsync();
        var plans = (await Db.Plans.Find(_ => true).ToListAsync()).ToDictionary(p => p.Id);
        var subByUser = subs.GroupBy(s => s.User).ToDictionary(g => g.Key, g => g.First());

        return Ok(new
        {
            users = users.Select(u =>
            {
                object? subscription = null;
                if (subByUser.TryGetValue(u.Id, out var sub) && plans.TryGetValue(sub.Plan, out var plan))
                {
                    subscription = new
                    {
                        _id = sub.Id,
                        status = sub.Status,
                        plan = new { _id = plan.Id, name = plan.Name, code = plan.Code, price = plan.Price, currency = plan.Currency, interval = plan.Interval }
                    };
                }
                return new
                {
                    _id = u.Id,
                    firstName = u.FirstName,
                    lastName = u.LastName,
                    email = u.Email,
                    role = u.Role,
                    gender = u.Gender,
                    hasDiabetes = u.HasDiabetes,
                    diabetesType = u.DiabetesType,
                    specialty = u.Specialty,
                    phone = u.Phone,
                    assignedDoctor = u.AssignedDoctor,
                    isActive = u.IsActive,
                    createdAt = u.CreatedAt,
                    subscription
                };
            })
        });
    }

    public record UserUpsertDto(
        string? FirstName, string? LastName, string? Email, string? Password, string? Role,
        string? Gender, string? Phone, string? Specialty, bool? HasDiabetes, string? DiabetesType,
        string? AssignedDoctor, bool? IsActive);

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] UserUpsertDto dto)
    {
        var admin = await CurrentUserAsync();
        if (string.IsNullOrWhiteSpace(dto.FirstName) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            return Fail("firstName, email, password required");
        var email = dto.Email.Trim().ToLowerInvariant();
        if (await Db.Users.Find(u => u.Email == email).AnyAsync()) return Fail("Email already registered", 409);

        var role = dto.Role is "patient" or "doctor" or "admin" ? dto.Role! : Roles.Patient;
        var user = new User
        {
            FirstName = dto.FirstName!,
            LastName = dto.LastName ?? "",
            Email = email,
            Password = BCrypt.Net.BCrypt.HashPassword(dto.Password!, 12),
            Role = role,
            Gender = dto.Gender == "man" ? "man" : "woman",
            Phone = dto.Phone ?? "",
            Specialty = role == Roles.Doctor ? (dto.Specialty ?? "General medicine") : "",
            HasDiabetes = dto.HasDiabetes == true,
            DiabetesType = dto.HasDiabetes == true ? (dto.DiabetesType ?? "type2") : "none",
            AssignedDoctor = string.IsNullOrEmpty(dto.AssignedDoctor) ? null : dto.AssignedDoctor,
            IsActive = dto.IsActive != false
        };
        await Db.Users.InsertOneAsync(user);
        if (user.Role == Roles.Patient)
            await Db.HealthRecords.InsertOneAsync(new HealthRecord { Patient = user.Id });

        await _audit.LogAsync(admin!.Id, admin.Email, "create", "user", user.Id, email);
        return StatusCode(201, new { user = UserMapper.ToSafe(user) });
    }

    [HttpPut("users/{id}")]
    public async Task<IActionResult> UpdateUser(string id, [FromBody] UserUpsertDto dto)
    {
        var admin = await CurrentUserAsync();
        var user = await Db.Users.Find(u => u.Id == id).FirstOrDefaultAsync();
        if (user is null) return Fail("User not found", 404);
        if (dto.FirstName != null) user.FirstName = dto.FirstName;
        if (dto.LastName != null) user.LastName = dto.LastName;
        if (dto.Email != null) user.Email = dto.Email.ToLowerInvariant();
        if (dto.Role is "patient" or "doctor" or "admin") user.Role = dto.Role;
        if (dto.Gender != null) user.Gender = dto.Gender == "man" ? "man" : "woman";
        if (dto.Phone != null) user.Phone = dto.Phone;
        if (dto.Specialty != null) user.Specialty = dto.Specialty;
        if (dto.HasDiabetes.HasValue) user.HasDiabetes = dto.HasDiabetes.Value;
        if (dto.DiabetesType != null) user.DiabetesType = dto.DiabetesType;
        if (dto.AssignedDoctor != null) user.AssignedDoctor = string.IsNullOrEmpty(dto.AssignedDoctor) ? null : dto.AssignedDoctor;
        if (dto.IsActive.HasValue) user.IsActive = dto.IsActive.Value;
        if (!string.IsNullOrEmpty(dto.Password) && dto.Password.Length >= 6)
            user.Password = BCrypt.Net.BCrypt.HashPassword(dto.Password, 12);
        if (user.Id == admin!.Id && (!user.IsActive || user.Role != Roles.Admin))
            return Fail("You cannot remove your own admin access");

        user.UpdatedAt = DateTime.UtcNow;
        await Db.Users.ReplaceOneAsync(u => u.Id == id, user);
        await _audit.LogAsync(admin.Id, admin.Email, "update", "user", id, user.Email);
        return Ok(new { user = UserMapper.ToSafe(user) });
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var admin = await CurrentUserAsync();
        if (id == admin!.Id) return Fail("You cannot delete your own account");
        var user = await Db.Users.Find(u => u.Id == id).FirstOrDefaultAsync();
        if (user is null) return Fail("User not found", 404);
        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        await Db.Users.ReplaceOneAsync(u => u.Id == id, user);
        await Db.Subscriptions.UpdateManyAsync(
            s => s.User == id && (s.Status == "active" || s.Status == "trial"),
            Builders<UserSubscription>.Update.Set(s => s.Status, "cancelled").Set(s => s.AutoRenew, false));
        await _audit.LogAsync(admin.Id, admin.Email, "deactivate", "user", id, user.Email);
        return Ok(new { message = "User deactivated", user = UserMapper.ToSafe(user) });
    }

    [HttpGet("plans")]
    public async Task<IActionResult> ListPlans() =>
        Ok(new { plans = await Db.Plans.Find(_ => true).SortBy(p => p.SortOrder).ToListAsync() });

    [HttpPost("plans")]
    public async Task<IActionResult> CreatePlan([FromBody] SubscriptionPlan plan)
    {
        plan.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
        plan.Code = (plan.Code ?? "").ToUpperInvariant();
        plan.CreatedAt = DateTime.UtcNow;
        await Db.Plans.InsertOneAsync(plan);
        return StatusCode(201, new { plan });
    }

    [HttpPut("plans/{id}")]
    public async Task<IActionResult> UpdatePlan(string id, [FromBody] SubscriptionPlan body)
    {
        var plan = await Db.Plans.Find(p => p.Id == id).FirstOrDefaultAsync();
        if (plan is null) return Fail("Plan not found", 404);
        body.Id = id;
        body.Code = plan.Code;
        await Db.Plans.ReplaceOneAsync(p => p.Id == id, body);
        return Ok(new { plan = body });
    }

    [HttpDelete("plans/{id}")]
    public async Task<IActionResult> DeletePlan(string id)
    {
        var plan = await Db.Plans.Find(p => p.Id == id).FirstOrDefaultAsync();
        if (plan is null) return Fail("Plan not found", 404);
        var active = await Db.Subscriptions.CountDocumentsAsync(s => s.Plan == id && (s.Status == "active" || s.Status == "trial"));
        if (active > 0)
        {
            plan.IsActive = false;
            await Db.Plans.ReplaceOneAsync(p => p.Id == id, plan);
            return Ok(new { plan, message = "Plan has active subscribers — marked inactive instead of deleted" });
        }
        await Db.Plans.DeleteOneAsync(p => p.Id == id);
        return Ok(new { message = "Plan deleted" });
    }

    [HttpGet("subscriptions")]
    public async Task<IActionResult> ListSubscriptions()
    {
        var subs = await Db.Subscriptions.Find(_ => true).SortByDescending(s => s.UpdatedAt).ToListAsync();
        var users = (await Db.Users.Find(_ => true).ToListAsync()).ToDictionary(u => u.Id);
        var plans = (await Db.Plans.Find(_ => true).ToListAsync()).ToDictionary(p => p.Id);
        return Ok(new
        {
            subscriptions = subs.Select(s => new
            {
                _id = s.Id,
                status = s.Status,
                startDate = s.StartDate,
                endDate = s.EndDate,
                autoRenew = s.AutoRenew,
                notes = s.Notes,
                user = users.TryGetValue(s.User, out var u)
                    ? new { _id = u.Id, firstName = u.FirstName, lastName = u.LastName, email = u.Email, role = u.Role, isActive = u.IsActive }
                    : null,
                plan = plans.TryGetValue(s.Plan, out var p)
                    ? new { _id = p.Id, name = p.Name, code = p.Code, price = p.Price, currency = p.Currency, interval = p.Interval }
                    : null
            })
        });
    }

    public record AssignSubDto(string UserId, string PlanId, string? Status, DateTime? EndDate, bool? AutoRenew, string? Notes, DateTime? StartDate);

    [HttpPost("subscriptions")]
    public async Task<IActionResult> AssignSubscription([FromBody] AssignSubDto dto)
    {
        var admin = await CurrentUserAsync();
        var user = await Db.Users.Find(u => u.Id == dto.UserId).FirstOrDefaultAsync();
        var plan = await Db.Plans.Find(p => p.Id == dto.PlanId).FirstOrDefaultAsync();
        if (user is null || plan is null) return Fail("User or plan not found", 404);

        await Db.Subscriptions.UpdateManyAsync(
            s => s.User == dto.UserId && (s.Status == "active" || s.Status == "trial"),
            Builders<UserSubscription>.Update.Set(s => s.Status, "cancelled").Set(s => s.AutoRenew, false));

        var start = dto.StartDate ?? DateTime.UtcNow;
        DateTime? end = dto.EndDate;
        if (end is null && plan.Interval != "lifetime")
            end = plan.Interval == "yearly" ? start.AddYears(1) : start.AddMonths(1);

        var sub = new UserSubscription
        {
            User = dto.UserId,
            Plan = dto.PlanId,
            Status = dto.Status is "active" or "trial" or "cancelled" or "expired" or "past_due" ? dto.Status! : "active",
            StartDate = start,
            EndDate = end,
            AutoRenew = dto.AutoRenew != false,
            Notes = dto.Notes ?? "",
            ManagedBy = admin!.Id
        };
        await Db.Subscriptions.InsertOneAsync(sub);
        await _audit.LogAsync(admin.Id, admin.Email, "assign_subscription", "subscription", sub.Id, $"{user.Email} -> {plan.Code}");
        return StatusCode(201, new { subscription = sub });
    }

    [HttpPut("subscriptions/{id}")]
    public async Task<IActionResult> UpdateSubscription(string id, [FromBody] AssignSubDto dto)
    {
        var sub = await Db.Subscriptions.Find(s => s.Id == id).FirstOrDefaultAsync();
        if (sub is null) return Fail("Subscription not found", 404);
        if (!string.IsNullOrEmpty(dto.PlanId)) sub.Plan = dto.PlanId;
        if (!string.IsNullOrEmpty(dto.Status)) sub.Status = dto.Status!;
        if (dto.EndDate.HasValue) sub.EndDate = dto.EndDate;
        if (dto.StartDate.HasValue) sub.StartDate = dto.StartDate.Value;
        if (dto.AutoRenew.HasValue) sub.AutoRenew = dto.AutoRenew.Value;
        if (dto.Notes != null) sub.Notes = dto.Notes;
        sub.UpdatedAt = DateTime.UtcNow;
        await Db.Subscriptions.ReplaceOneAsync(s => s.Id == id, sub);
        return Ok(new { subscription = sub });
    }

    [HttpPost("subscriptions/{id}/cancel")]
    public async Task<IActionResult> CancelSubscription(string id, [FromBody] AssignSubDto? dto)
    {
        var admin = await CurrentUserAsync();
        var sub = await Db.Subscriptions.Find(s => s.Id == id).FirstOrDefaultAsync();
        if (sub is null) return Fail("Subscription not found", 404);
        sub.Status = "cancelled";
        sub.AutoRenew = false;
        if (dto?.Notes != null) sub.Notes = dto.Notes;
        sub.ManagedBy = admin!.Id;
        sub.UpdatedAt = DateTime.UtcNow;
        await Db.Subscriptions.ReplaceOneAsync(s => s.Id == id, sub);
        return Ok(new { subscription = sub });
    }

    [HttpGet("audit")]
    public async Task<IActionResult> Audit([FromQuery] int limit = 50)
    {
        var logs = await Db.AuditLogs.Find(_ => true).SortByDescending(a => a.CreatedAt)
            .Limit(Math.Clamp(limit, 1, 200)).ToListAsync();
        return Ok(new { logs });
    }
}
