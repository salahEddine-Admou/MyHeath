# MyHeath

Intelligent **telemedicine & women's/men's health** platform — engineering thesis (PFE).

> **Pour le professeur / jury :** commencer par [`GUIDE_INSTALLATION.md`](GUIDE_INSTALLATION.md) ou [`FOR_PROFESSOR.txt`](FOR_PROFESSOR.txt)  
> **Rapport .NET (PDF) :** [`docs/RAPPORT_PFE_MYHEATH_DOTNET.pdf`](docs/RAPPORT_PFE_MYHEATH_DOTNET.pdf)

**Two backends (same React + MongoDB):**

| Backend | Path | Port | Compose file |
|---------|------|------|----------------|
| Node.js / Express | `backend/` | 5000 | `docker-compose.yml` |
| **ASP.NET Core 8** | `backend-dotnet/` | **5080** | `docker-compose.dotnet.yml` |

## Features

- JWT auth + RBAC (Patient / Doctor / Admin)
- Predictive cycle & daily health score, diabetes suivi
- **MyHeath AI (Claude)** coach
- Medical records & messages **AES-256-CBC** encrypted
- Admin: users, subscription plans, audit (.NET)
- **Enhancements (.NET):** appointments, medication reminders, notifications, Swagger
- Docker Compose + Vercel (frontend) / Docker or Azure (API)

## Structure

```
MyHeath/
├── backend/              # Node.js + Express + MongoDB
├── backend-dotnet/       # ASP.NET Core 8 Web API + MongoDB
├── frontend/             # React + Vite + Tailwind + Recharts
├── docs/                 # PFE rapports (Node + .NET)
├── docker-compose.yml
└── docker-compose.dotnet.yml
```

## Local setup

### Option A — Node API

```bash
cd backend && cp .env.example .env && npm install && npm run seed && npm run dev
cd frontend && cp .env.example .env && npm install && npm run dev
# VITE_API_URL=http://localhost:5000/api
```

### Option B — .NET API (recommended for .NET PFE)

```bash
docker compose -f docker-compose.dotnet.yml up --build
# or: cd backend-dotnet/MyHeath.Api && dotnet run
# Frontend: VITE_API_URL=http://localhost:5080/api
# Swagger:  http://localhost:5080/swagger
```

### Demo accounts

| Role    | Email               | Password   |
|---------|---------------------|------------|
| Admin   | admin@myheath.app   | Admin123   |
| Patient | patient@myheath.app | Patient123 |
| Doctor  | doctor@myheath.app  | Doctor123  |

### Rapports PFE

- Node / MERN: `docs/RAPPORT_PFE_MYHEATH.pdf`
- **.NET:** `docs/RAPPORT_PFE_MYHEATH_DOTNET.pdf` (`python scripts/generate_rapport_dotnet.py`)

## Deploy (Vercel)

- Frontend: Root Directory `frontend`
- Backend API: Root Directory `backend` (serverless Express via `api/index.js`)

Env (backend): `MONGODB_URI`, `JWT_SECRET`, `AES_SECRET_KEY`, `ANTHROPIC_API_KEY`, `CLIENT_URL`  
Env (frontend): `VITE_API_URL`, `VITE_SOCKET_URL`

## License

Academic / educational use.
