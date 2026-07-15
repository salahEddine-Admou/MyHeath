# MyHeath

Intelligent **telemedicine & women's health tracking** platform (FemTech) — engineering thesis (PFE), **MERN** stack.

## Features

- JWT auth + RBAC (Patient / Doctor / Admin)
- Predictive cycle & symptom tracking (period forecast, ovulation, PCOS / endometriosis alerts)
- **MyHeath AI (Claude)**: health chat, NL journal, insight narration, doctor brief, wellness plan
- Medical records & messages **AES-256-CBC encrypted** at rest
- Secure consult messaging (REST; Socket.io locally)
- Docker Compose + Vercel deploy (frontend + API)

## Structure

```
MyHeath/
├── backend/     # Node.js + Express + MongoDB (+ optional Socket.io locally)
├── frontend/    # React + Vite + Tailwind + Recharts
├── docs/        # Thesis PDF / PPT
└── docker-compose.yml
```

## Local setup

```bash
cd backend && cp .env.example .env && npm install && npm run seed && npm run dev
cd frontend && cp .env.example .env && npm install && npm run dev
```

### Demo accounts

| Role    | Email               | Password   |
|---------|---------------------|------------|
| Patient | patient@myheath.app | Patient123 |
| Doctor  | doctor@myheath.app  | Doctor123  |

## Deploy (Vercel)

- Frontend: Root Directory `frontend`
- Backend API: Root Directory `backend` (serverless Express via `api/index.js`)

Env (backend): `MONGODB_URI`, `JWT_SECRET`, `AES_SECRET_KEY`, `ANTHROPIC_API_KEY`, `CLIENT_URL`  
Env (frontend): `VITE_API_URL`, `VITE_SOCKET_URL`

## License

Academic / educational use.
