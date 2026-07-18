# MyHeath API — ASP.NET Core 8 + MongoDB

Drop-in .NET backend compatible with the existing React frontend (`/api/*` contract).

## Stack

- **.NET 8** / ASP.NET Core Web API
- **MongoDB** (same collections as Node when sharing a DB)
- **JWT** + **BCrypt** (cost 12)
- **AES-256-CBC** (compatible with Node `crypto.js`)
- **Claude** (Anthropic) AI Coach
- **Swagger** at `/swagger`

## Enhancements vs Node API

| Feature | Endpoint |
|---------|----------|
| Appointments | `/api/appointments` |
| Notifications | `/api/notifications` |
| Medication reminders | `/api/medications` |
| Admin audit log | `/api/admin/audit` |
| OpenAPI/Swagger | `/swagger` |

## Run locally

```bash
# Requires .NET 8 SDK + MongoDB
cd backend-dotnet/MyHeath.Api
dotnet restore
dotnet run
# → http://localhost:5080/api/healthcheck
# → http://localhost:5080/swagger
```

Set env vars (or `appsettings.json`):

```
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=myheath
JWT_SECRET=...
AES_SECRET_KEY=...
CLIENT_URL=http://localhost:5173
ANTHROPIC_API_KEY=...
PORT=5080
```

Point the frontend:

```
VITE_API_URL=http://localhost:5080/api
```

## Docker Compose (root)

```bash
docker compose -f docker-compose.dotnet.yml up --build
```

- API: http://localhost:5080  
- Frontend: http://localhost:5173 (uses .NET API)  
- MongoDB: localhost:27017  

## Demo accounts (auto-seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@myheath.app | Admin123 |
| Doctor | doctor@myheath.app | Doctor123 |
| Patient (F) | patient@myheath.app | Patient123 |
| Patient (M) | man@myheath.app | Patient123 |
