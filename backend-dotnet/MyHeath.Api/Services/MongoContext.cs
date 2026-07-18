using Microsoft.Extensions.Options;
using MongoDB.Driver;
using MyHeath.Api.Models;

namespace MyHeath.Api.Services;

public class MongoSettings
{
    public string ConnectionString { get; set; } = "mongodb://localhost:27017";
    public string DatabaseName { get; set; } = "myheath";
}

public class MongoContext
{
    private readonly IMongoDatabase _db;

    public MongoContext(IOptions<MongoSettings> options)
    {
        var client = new MongoClient(options.Value.ConnectionString);
        _db = client.GetDatabase(options.Value.DatabaseName);
    }

    public IMongoCollection<User> Users => _db.GetCollection<User>("users");
    public IMongoCollection<HealthRecord> HealthRecords => _db.GetCollection<HealthRecord>("healthrecords");
    public IMongoCollection<SymptomLog> SymptomLogs => _db.GetCollection<SymptomLog>("symptomlogs");
    public IMongoCollection<DailyHealthLog> DailyHealthLogs => _db.GetCollection<DailyHealthLog>("dailyhealthlogs");
    public IMongoCollection<Message> Messages => _db.GetCollection<Message>("messages");
    public IMongoCollection<SubscriptionPlan> Plans => _db.GetCollection<SubscriptionPlan>("subscriptionplans");
    public IMongoCollection<UserSubscription> Subscriptions => _db.GetCollection<UserSubscription>("usersubscriptions");
    public IMongoCollection<Appointment> Appointments => _db.GetCollection<Appointment>("appointments");
    public IMongoCollection<AppNotification> Notifications => _db.GetCollection<AppNotification>("appnotifications");
    public IMongoCollection<MedicationReminder> MedicationReminders => _db.GetCollection<MedicationReminder>("medicationreminders");
    public IMongoCollection<AuditLog> AuditLogs => _db.GetCollection<AuditLog>("auditlogs");
}
