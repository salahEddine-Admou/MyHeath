using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace MyHeath.Api.Services;

public class ClaudeService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;

    public ClaudeService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _config = config;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_config["ANTHROPIC_API_KEY"]);

    public async Task<(string Reply, string Model, object? Usage)> ChatAsync(
        string system,
        IEnumerable<object> messages,
        CancellationToken ct = default)
    {
        var key = _config["ANTHROPIC_API_KEY"];
        if (string.IsNullOrWhiteSpace(key))
            throw new InvalidOperationException("ANTHROPIC_API_KEY is missing");

        var model = _config["ANTHROPIC_MODEL"] ?? "claude-sonnet-4-20250514";
        var body = new
        {
            model,
            max_tokens = 1024,
            system,
            messages
        };

        using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages");
        req.Headers.Add("x-api-key", key);
        req.Headers.Add("anthropic-version", "2023-06-01");
        req.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

        var res = await _http.SendAsync(req, ct);
        var json = await res.Content.ReadAsStringAsync(ct);
        if (!res.IsSuccessStatusCode)
            throw new InvalidOperationException($"Claude API error: {res.StatusCode}");

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        var text = root.GetProperty("content")[0].GetProperty("text").GetString() ?? "";
        object? usage = root.TryGetProperty("usage", out var u) ? JsonSerializer.Deserialize<object>(u.GetRawText()) : null;
        return (text, model, usage);
    }
}
