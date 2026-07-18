using Microsoft.AspNetCore.Mvc;
using MyHeath.Api.Services;

namespace MyHeath.Api.Controllers;

[ApiController]
[Route("api")]
public class HealthcheckController : ControllerBase
{
    private readonly IConfiguration _config;

    public HealthcheckController(IConfiguration config) => _config = config;

    [HttpGet("healthcheck")]
    public IActionResult Get() => Ok(new
    {
        status = "ok",
        service = "MyHeath API (.NET)",
        encryption = "AES-256-CBC",
        runtime = ".NET 8",
        ai = !string.IsNullOrWhiteSpace(_config["ANTHROPIC_API_KEY"]),
        timestamp = DateTime.UtcNow
    });
}
