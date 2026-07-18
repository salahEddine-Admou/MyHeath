using MyHeath.Api.Models;

namespace MyHeath.Api.Services;

public class AuditService
{
    private readonly MongoContext _db;

    public AuditService(MongoContext db) => _db = db;

    public async Task LogAsync(string actorId, string actorEmail, string action, string entity, string? entityId, string details)
    {
        await _db.AuditLogs.InsertOneAsync(new AuditLog
        {
            ActorId = actorId,
            ActorEmail = actorEmail,
            Action = action,
            Entity = entity,
            EntityId = entityId,
            Details = details,
            CreatedAt = DateTime.UtcNow
        });
    }
}
