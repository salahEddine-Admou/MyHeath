using MyHeath.Api.Models;

namespace MyHeath.Api.Services;

public static class HealthScoreService
{
    private static readonly Dictionary<string, int> MoodScore = new(StringComparer.OrdinalIgnoreCase)
    {
        ["great"] = 10, ["good"] = 8, ["ok"] = 6, ["low"] = 4, ["bad"] = 2, [""] = 5
    };

    private static double Clamp(double n, double min, double max) => Math.Max(min, Math.Min(max, n));

    private static double ScoreSleep(double hours, int quality)
    {
        double h = hours switch
        {
            < 5 or > 10 => 3,
            < 6 or > 9.5 => 6,
            >= 7 and <= 9 => 10,
            _ => 8
        };
        return (h + quality) / 2.0;
    }

    private static double? ScoreGlucose(double? fasting, double? postMeal, bool hasDiabetes)
    {
        if (!hasDiabetes && fasting is null && postMeal is null) return null;
        double points = 10;
        if (fasting is double f)
        {
            if (f < 70) points -= 4;
            else if (f <= 99) { }
            else if (f <= 125) points -= 3;
            else points -= 6;
        }
        if (postMeal is double p)
        {
            if (p < 70) points -= 3;
            else if (p <= 140) { }
            else if (p <= 180) points -= 3;
            else points -= 5;
        }
        return Clamp(points, 0, 10);
    }

    public static (int Score, string Label) Compute(DailyHealthLog log, User profile)
    {
        var hasDiabetes = profile.HasDiabetes;
        var sleep = ScoreSleep(log.SleepHours, log.SleepQuality);
        var energy = log.Energy;
        var stressInv = 10 - log.Stress;
        var mood = MoodScore.GetValueOrDefault(log.Mood ?? "ok", 5);
        var water = Clamp(log.WaterLiters / 2.5 * 10, 0, 10);
        var activity = Clamp(log.ExerciseMinutes / 45.0 * 10 + log.Steps / 8000.0 * 5, 0, 10);
        var recovery = profile.Gender == "man" ? log.Recovery : 5;
        var glucose = ScoreGlucose(log.FastingGlucose, log.PostMealGlucose, hasDiabetes);

        double total;
        double weightSum;
        if (hasDiabetes && glucose is double g)
        {
            total = sleep * 1.2 + energy + stressInv + mood + water * 0.8 + activity + g * 1.5 + (log.TookMedication ? 8 : 3);
            weightSum = 1.2 + 1 + 1 + 1 + 0.8 + 1 + 1.5 + 1;
        }
        else if (profile.Gender == "man")
        {
            total = sleep * 1.2 + energy + stressInv + mood + water + activity * 1.3 + recovery;
            weightSum = 1.2 + 1 + 1 + 1 + 1 + 1.3 + 1;
        }
        else
        {
            total = sleep * 1.2 + energy + stressInv + mood + water + activity;
            weightSum = 1.2 + 1 + 1 + 1 + 1 + 1;
        }

        var score = (int)Math.Round(Clamp(total / weightSum * 10, 0, 100));
        var label = score switch
        {
            >= 85 => "excellent",
            >= 70 => "good",
            >= 55 => "fair",
            >= 40 => "low",
            _ => "concerning"
        };
        return (score, label);
    }
}
