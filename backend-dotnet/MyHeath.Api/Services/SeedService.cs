using MongoDB.Driver;
using MyHeath.Api.Models;

namespace MyHeath.Api.Services;

public class SeedService
{
    private readonly MongoContext _db;

    public SeedService(MongoContext db) => _db = db;

    public async Task EnsureSeedAsync()
    {
        var adminEmail = "admin@myheath.app";
        var admin = await _db.Users.Find(u => u.Email == adminEmail).FirstOrDefaultAsync();
        if (admin is null)
        {
            admin = new User
            {
                FirstName = "Platform",
                LastName = "Admin",
                Email = adminEmail,
                Password = BCrypt.Net.BCrypt.HashPassword("Admin123", 12),
                Role = Roles.Admin,
                Gender = "woman"
            };
            await _db.Users.InsertOneAsync(admin);
        }

        if (!await _db.Users.Find(u => u.Email == "doctor@myheath.app").AnyAsync())
        {
            var doctor = new User
            {
                FirstName = "Amina",
                LastName = "Benali",
                Email = "doctor@myheath.app",
                Password = BCrypt.Net.BCrypt.HashPassword("Doctor123", 12),
                Role = Roles.Doctor,
                Gender = "woman",
                Specialty = "General & Gynecology"
            };
            await _db.Users.InsertOneAsync(doctor);

            var woman = new User
            {
                FirstName = "Sara",
                LastName = "Alaoui",
                Email = "patient@myheath.app",
                Password = BCrypt.Net.BCrypt.HashPassword("Patient123", 12),
                Role = Roles.Patient,
                Gender = "woman",
                HasDiabetes = true,
                DiabetesType = "type2",
                AssignedDoctor = doctor.Id,
                DateOfBirth = new DateTime(1995, 4, 12)
            };
            var man = new User
            {
                FirstName = "Youssef",
                LastName = "Amrani",
                Email = "man@myheath.app",
                Password = BCrypt.Net.BCrypt.HashPassword("Patient123", 12),
                Role = Roles.Patient,
                Gender = "man",
                HasDiabetes = true,
                DiabetesType = "type2",
                AssignedDoctor = doctor.Id,
                DateOfBirth = new DateTime(1990, 8, 3)
            };
            await _db.Users.InsertManyAsync(new[] { woman, man });
            await _db.HealthRecords.InsertManyAsync(new[]
            {
                new HealthRecord { Patient = woman.Id, BloodType = "A+" },
                new HealthRecord { Patient = man.Id, BloodType = "O+" }
            });
        }

        await UpsertPlan("FREE", "Free", 0, "Basic health tracking", false, false, 5, 1);
        await UpsertPlan("CARE", "Care", 99, "AI coach + diabetes support", true, false, 60, 2);
        await UpsertPlan("PREMIUM", "Premium", 199, "Full platform + priority consult", true, true, 999, 3);
    }

    private async Task UpsertPlan(string code, string name, double price, string desc, bool ai, bool priority, int maxAi, int order)
    {
        var existing = await _db.Plans.Find(p => p.Code == code).FirstOrDefaultAsync();
        if (existing != null) return;
        await _db.Plans.InsertOneAsync(new SubscriptionPlan
        {
            Code = code,
            Name = name,
            Description = desc,
            Price = price,
            Currency = "MAD",
            Interval = "monthly",
            Features = new List<string> { desc },
            IncludesAiCoach = ai,
            IncludesPriorityChat = priority,
            MaxAiMessages = maxAi,
            SortOrder = order
        });
    }
}
