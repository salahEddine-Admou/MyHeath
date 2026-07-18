using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MyHeath.Api.Infrastructure;
using MyHeath.Api.Models;
using MyHeath.Api.Services;

namespace MyHeath.Api.Controllers;

[ApiController]
[Route("api/chat")]
[Authorize]
public class ChatController : ApiControllerBase
{
    private readonly AesCryptoService _aes;

    public ChatController(MongoContext db, AesCryptoService aes) : base(db) => _aes = aes;

    public record SendDto(string ReceiverId, string Content);

    [HttpGet("partners")]
    public async Task<IActionResult> Partners()
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);

        if (user.Role == Roles.Patient)
        {
            if (user.AssignedDoctor is null) return Ok(new { partners = Array.Empty<object>() });
            var doctor = await Db.Users.Find(u => u.Id == user.AssignedDoctor).FirstOrDefaultAsync();
            return Ok(new
            {
                partners = doctor is null ? Array.Empty<object>() : new object[]
                {
                    new { _id = doctor.Id, id = doctor.Id, firstName = doctor.FirstName, lastName = doctor.LastName,
                        specialty = doctor.Specialty, role = doctor.Role, email = doctor.Email }
                }
            });
        }

        if (user.Role == Roles.Doctor)
        {
            var patients = await Db.Users.Find(u => u.Role == Roles.Patient && u.AssignedDoctor == user.Id).ToListAsync();
            return Ok(new
            {
                partners = patients.Select(p => new
                {
                    _id = p.Id, id = p.Id, firstName = p.FirstName, lastName = p.LastName,
                    email = p.Email, role = p.Role
                })
            });
        }

        if (user.Role == Roles.Admin)
        {
            var partners = await Db.Users.Find(u => u.Id != user.Id && u.IsActive &&
                (u.Role == Roles.Doctor || u.Role == Roles.Patient)).ToListAsync();
            return Ok(new
            {
                partners = partners.Select(p => new
                {
                    _id = p.Id, id = p.Id, firstName = p.FirstName, lastName = p.LastName,
                    email = p.Email, role = p.Role, specialty = p.Specialty
                })
            });
        }

        return Ok(new { partners = Array.Empty<object>() });
    }

    [HttpPost("send")]
    public async Task<IActionResult> Send([FromBody] SendDto dto)
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        if (string.IsNullOrWhiteSpace(dto.ReceiverId) || string.IsNullOrWhiteSpace(dto.Content))
            return Fail("receiverId and content are required");

        if (!await CanCommunicate(user, dto.ReceiverId))
            return Fail("Not allowed to message this user", 403);

        var msg = new Message
        {
            Sender = user.Id,
            Receiver = dto.ReceiverId,
            EncryptedContent = _aes.Encrypt(dto.Content.Trim()),
            ConversationId = BuildConversationId(user.Id, dto.ReceiverId)
        };
        await Db.Messages.InsertOneAsync(msg);
        return StatusCode(201, new { message = ToClient(msg) });
    }

    [HttpGet("{partnerId}")]
    public async Task<IActionResult> Conversation(string partnerId)
    {
        var user = await CurrentUserAsync();
        if (user is null) return Fail("Unauthorized", 401);
        var cid = BuildConversationId(user.Id, partnerId);
        var messages = await Db.Messages.Find(m => m.ConversationId == cid)
            .SortBy(m => m.CreatedAt).Limit(200).ToListAsync();
        return Ok(new
        {
            conversationId = cid,
            encrypted = true,
            messages = messages.Select(ToClient)
        });
    }

    private async Task<bool> CanCommunicate(User user, string partnerId)
    {
        var partner = await Db.Users.Find(u => u.Id == partnerId).FirstOrDefaultAsync();
        if (partner is null) return false;
        if (user.Role == Roles.Admin) return true;
        if (user.Role == Roles.Patient && partner.Role == Roles.Doctor)
            return user.AssignedDoctor == partner.Id;
        if (user.Role == Roles.Doctor && partner.Role == Roles.Patient)
            return partner.AssignedDoctor == user.Id;
        return false;
    }

    private static string BuildConversationId(string a, string b)
    {
        var pair = new[] { a, b }.OrderBy(x => x, StringComparer.Ordinal).ToArray();
        return $"{pair[0]}_{pair[1]}";
    }

    private object ToClient(Message m) => new
    {
        id = m.Id,
        _id = m.Id,
        sender = m.Sender,
        receiver = m.Receiver,
        content = _aes.DecryptToString(m.EncryptedContent),
        conversationId = m.ConversationId,
        read = m.Read,
        createdAt = m.CreatedAt
    };
}
