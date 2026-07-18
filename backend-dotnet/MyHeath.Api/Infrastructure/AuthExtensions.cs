using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MyHeath.Api.Models;
using MyHeath.Api.Services;

namespace MyHeath.Api.Infrastructure;

public static class AuthExtensions
{
    public static string? GetUserId(this ClaimsPrincipal user) =>
        user.FindFirstValue("id") ?? user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");

    public static async Task<User?> LoadUserAsync(this ClaimsPrincipal principal, MongoContext db)
    {
        var id = principal.GetUserId();
        if (string.IsNullOrEmpty(id)) return null;
        return await db.Users.Find(u => u.Id == id && u.IsActive).FirstOrDefaultAsync();
    }
}

public abstract class ApiControllerBase : ControllerBase
{
    protected readonly MongoContext Db;

    protected ApiControllerBase(MongoContext db) => Db = db;

    protected async Task<User?> CurrentUserAsync() => await User.LoadUserAsync(Db);

    protected IActionResult Fail(string message, int status = 400) =>
        StatusCode(status, new { message });
}
