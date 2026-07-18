using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MyHeath.Api.Models;

public static class Roles
{
    public const string Patient = "patient";
    public const string Doctor = "doctor";
    public const string Admin = "admin";
}

public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
    public string Role { get; set; } = Roles.Patient;
    public string Gender { get; set; } = "woman";
    public bool HasDiabetes { get; set; }
    public string DiabetesType { get; set; } = "none";
    public string Phone { get; set; } = "";
    [BsonRepresentation(BsonType.ObjectId)]
    public string? AssignedDoctor { get; set; }
    public string Specialty { get; set; } = "";
    public DateTime? DateOfBirth { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class HealthRecord
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string Patient { get; set; } = null!;

    public string BloodType { get; set; } = "";
    public string? AllergiesEncrypted { get; set; }
    public string? MedicationsEncrypted { get; set; }
    public string? NotesEncrypted { get; set; }
    public string? EncryptedData { get; set; }
    [BsonRepresentation(BsonType.ObjectId)]
    public string? LastUpdatedBy { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class SymptomLog
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string Patient { get; set; } = null!;

    public DateTime Date { get; set; } = DateTime.UtcNow;
    public string EntryType { get; set; } = "symptom";
    public List<string> Symptoms { get; set; } = new();
    public int PainLevel { get; set; }
    public string Mood { get; set; } = "ok";
    public string Flow { get; set; } = "";
    public double? Temperature { get; set; }
    public string Notes { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class DailyHealthLog
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string Patient { get; set; } = null!;

    public DateTime Date { get; set; }
    public int Energy { get; set; } = 5;
    public double SleepHours { get; set; }
    public int SleepQuality { get; set; } = 5;
    public int Stress { get; set; } = 5;
    public string Mood { get; set; } = "ok";
    public double WaterLiters { get; set; }
    public int Steps { get; set; }
    public int ExerciseMinutes { get; set; }
    public string WorkoutIntensity { get; set; } = "";
    public int Recovery { get; set; } = 5;
    public double? WeightKg { get; set; }
    public int? RestingHeartRate { get; set; }
    public double? FastingGlucose { get; set; }
    public double? PostMealGlucose { get; set; }
    public bool TookMedication { get; set; }
    public double? CarbsGrams { get; set; }
    public List<string> Symptoms { get; set; } = new();
    public string Notes { get; set; } = "";
    public int HealthScore { get; set; }
    public string HealthLabel { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class Message
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string Sender { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string Receiver { get; set; } = null!;

    public string EncryptedContent { get; set; } = "";
    public string ConversationId { get; set; } = "";
    public bool Read { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class SubscriptionPlan
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public double Price { get; set; }
    public string Currency { get; set; } = "MAD";
    public string Interval { get; set; } = "monthly";
    public List<string> Features { get; set; } = new();
    public int MaxAiMessages { get; set; } = 30;
    public bool IncludesDiabetes { get; set; } = true;
    public bool IncludesPeriod { get; set; } = true;
    public bool IncludesAiCoach { get; set; }
    public bool IncludesPriorityChat { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class UserSubscription
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string User { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string Plan { get; set; } = null!;

    public string Status { get; set; } = "active";
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime? EndDate { get; set; }
    public bool AutoRenew { get; set; } = true;
    public string Notes { get; set; } = "";
    [BsonRepresentation(BsonType.ObjectId)]
    public string? ManagedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>Enhancement: telemedicine appointment booking.</summary>
public class Appointment
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string Patient { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string Doctor { get; set; } = null!;

    public DateTime ScheduledAt { get; set; }
    public int DurationMinutes { get; set; } = 30;
    public string Status { get; set; } = "scheduled"; // scheduled|completed|cancelled|no_show
    public string Reason { get; set; } = "";
    public string Notes { get; set; } = "";
    public string Mode { get; set; } = "video"; // video|chat|in_person
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>Enhancement: in-app notifications.</summary>
public class AppNotification
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string User { get; set; } = null!;

    public string Title { get; set; } = "";
    public string Body { get; set; } = "";
    public string Type { get; set; } = "info"; // info|alert|appointment|medication|system
    public bool Read { get; set; }
    public string? Link { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>Enhancement: medication reminders for chronic care.</summary>
public class MedicationReminder
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string Patient { get; set; } = null!;

    public string MedicationName { get; set; } = "";
    public string Dosage { get; set; } = "";
    public List<string> TimesOfDay { get; set; } = new(); // "08:00", "20:00"
    public bool Active { get; set; } = true;
    public string Notes { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>Enhancement: admin audit trail.</summary>
public class AuditLog
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    [BsonRepresentation(BsonType.ObjectId)]
    public string ActorId { get; set; } = null!;

    public string ActorEmail { get; set; } = "";
    public string Action { get; set; } = "";
    public string Entity { get; set; } = "";
    public string? EntityId { get; set; }
    public string Details { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
