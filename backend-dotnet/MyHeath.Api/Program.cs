using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Conventions;
using MyHeath.Api.Services;

var pack = new ConventionPack
{
    new CamelCaseElementNameConvention(),
    new IgnoreExtraElementsConvention(true)
};
ConventionRegistry.Register("camelCase", pack, _ => true);

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddEnvironmentVariables();

var mongoUri = builder.Configuration["MONGODB_URI"]
               ?? builder.Configuration["MongoSettings:ConnectionString"]
               ?? "mongodb://localhost:27017";
var mongoDb = builder.Configuration["MONGODB_DATABASE"]
              ?? builder.Configuration["MongoSettings:DatabaseName"]
              ?? "myheath";

builder.Services.Configure<MongoSettings>(o =>
{
    o.ConnectionString = mongoUri;
    o.DatabaseName = mongoDb;
});

builder.Services.AddSingleton<MongoContext>();
builder.Services.AddSingleton<AesCryptoService>();
builder.Services.AddSingleton<JwtTokenService>();
builder.Services.AddSingleton<AuditService>();
builder.Services.AddSingleton<SeedService>();
builder.Services.AddHttpClient<ClaudeService>();

builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        o.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "MyHeath API (.NET 8)",
        Version = "v1",
        Description = "Telemedicine & women's/men's health — ASP.NET Core + MongoDB"
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var jwtSecret = builder.Configuration["JWT_SECRET"] ?? "myheath_jwt_secret";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            RoleClaimType = System.Security.Claims.ClaimTypes.Role,
            NameClaimType = "id"
        };
        o.MapInboundClaims = false;
    });
builder.Services.AddAuthorization();

var clientUrl = builder.Configuration["CLIENT_URL"] ?? "http://localhost:5173";
builder.Services.AddCors(o =>
{
    o.AddPolicy("app", p => p
        .WithOrigins(clientUrl.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Concat(new[] { "http://localhost:5173", "https://heracare.vercel.app" }).Distinct().ToArray())
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "MyHeath .NET API"));

app.UseCors("app");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

try
{
    using var scope = app.Services.CreateScope();
    var seeder = scope.ServiceProvider.GetRequiredService<SeedService>();
    await seeder.EnsureSeedAsync();
    app.Logger.LogInformation("MyHeath .NET API ready — MongoDB {Db} @ ObjectId sample {Oid}", mongoDb, ObjectId.GenerateNewId());
}
catch (Exception ex)
{
    app.Logger.LogWarning(ex, "Seed skipped (Mongo may be unavailable at startup)");
}

var port = builder.Configuration["PORT"] ?? "5080";
app.Urls.Add($"http://0.0.0.0:{port}");
app.Run();
