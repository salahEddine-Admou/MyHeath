using MyHeath.Api.Models;

namespace MyHeath.Api.Services;

public static class CycleAnalyzer
{
    private const int DefaultCycle = 28;
    private const int DefaultPeriod = 5;

    public static object Analyze(List<SymptomLog> periodStarts, List<SymptomLog> symptomLogs)
    {
        var sorted = periodStarts.OrderBy(p => p.Date).ToList();
        var lengths = new List<int>();
        for (var i = 1; i < sorted.Count; i++)
        {
            var len = (int)Math.Round((sorted[i].Date - sorted[i - 1].Date).TotalDays);
            if (len > 0 && len < 90) lengths.Add(len);
        }

        var avg = lengths.Count > 0 ? (int)Math.Round(lengths.Average()) : DefaultCycle;
        var lastStart = sorted.Count > 0 ? sorted[^1].Date : DateTime.UtcNow;
        var next = lastStart.AddDays(avg);
        var ovulation = next.AddDays(-14);

        var anomalies = new List<object>();
        if (lengths.Count >= 2)
        {
            var variance = lengths.Average(l => Math.Pow(l - avg, 2));
            if (Math.Sqrt(variance) > 7)
                anomalies.Add(new { type = "irregular_cycles", severity = "high", message = "Cycle length varies significantly." });
        }
        if (symptomLogs.Count(s => s.PainLevel >= 7) >= 3)
            anomalies.Add(new { type = "severe_pain", severity = "high", message = "Repeated severe pain logged." });

        var dayInCycle = (int)Math.Floor((DateTime.UtcNow.Date - lastStart.Date).TotalDays) + 1;
        var day = ((dayInCycle - 1) % avg) + 1;
        string phase = day <= DefaultPeriod ? "menstrual"
            : day <= avg - 16 ? "follicular"
            : day <= avg - 12 ? "ovulatory" : "luteal";

        return new
        {
            averageCycleLength = avg,
            cyclesAnalyzed = lengths.Count,
            nextPeriodPrediction = next.ToString("yyyy-MM-dd"),
            ovulationWindow = new
            {
                start = ovulation.AddDays(-2).ToString("yyyy-MM-dd"),
                end = ovulation.AddDays(2).ToString("yyyy-MM-dd"),
                peak = ovulation.ToString("yyyy-MM-dd")
            },
            currentPhase = new { name = phase, day },
            anomalies,
            recommendConsultation = anomalies.Any(),
            chartData = lengths.Select((l, i) => new { cycle = i + 1, length = l }).ToList()
        };
    }
}
