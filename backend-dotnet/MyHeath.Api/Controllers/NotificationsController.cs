using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MyHeath.Api.Infrastructure;
using MyHeath.Api.Models;
using MyHeath.Api.Services;

namespace MyHeath.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ApiControllerBase
{
    public NotificationsController(MongoContext db) : base(db) { }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int limit = 30)
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        var items = await Db.Notifications.Find(n => n.User == user.Id)
            .SortByDescending(n => n.CreatedAt).Limit(Math.Clamp(limit, 1, 100)).ToListAsync();
        var unread = await Db.Notifications.CountDocumentsAsync(n => n.User == user.Id && !n.Read);
        return Ok(new { notifications = items, unread });
    }

    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkRead(string id)
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        var n = await Db.Notifications.Find(x => x.Id == id && x.User == user.Id).FirstOrDefaultAsync();
        if (n is null) return Fail("Not found", 404);
        n.Read = true;
        await Db.Notifications.ReplaceOneAsync(x => x.Id == id, n);
        return Ok(new { notification = n });
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> ReadAll()
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        await Db.Notifications.UpdateManyAsync(
            n => n.User == user.Id && !n.Read,
            Builders<AppNotification>.Update.Set(n => n.Read, true));
        return Ok(new { ok = true });
    }
}
