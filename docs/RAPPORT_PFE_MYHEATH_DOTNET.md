# MyHeath — Rapport PFE (ASP.NET Core)

**Réalisatrice / Author:** Nezha Fekoussa  
**Encadrant / Supervisor:** Salah Eddine Admou  
**Stack:** ASP.NET Core 8 (C#) · React (Vite) · MongoDB · Docker  
**PDF FR:** `docs/RAPPORT_PFE_MYHEATH_DOTNET.pdf` (page de garde intégrée)  
**PDF EN:** `docs/RAPPORT_PFE_MYHEATH_DOTNET_EN.pdf`  
**Génération:** `python scripts/generate_rapport_dotnet.py --lang both`

## Contenu du rapport

1. Introduction et choix .NET  
2. Analyse des besoins (patient / médecin / admin)  
3. Architecture 3-tiers + compatibilité API Node  
4. Conception (MongoDB, AES, score prédictif)  
5. Réalisation backend .NET + enhancements  
6. Frontend React (sidebar dashboard)  
7. **Docker et déploiement** (Compose, env, Vercel, Atlas, Azure)  
8. Tests et comptes démo  
9. Comparaison Node vs .NET  
10. Conclusion et perspectives  

## Lancer la stack .NET

```bash
docker compose -f docker-compose.dotnet.yml up --build
```

- API: http://localhost:5080/api/healthcheck  
- Swagger: http://localhost:5080/swagger  
- Frontend: http://localhost:5173 (`VITE_API_URL=http://localhost:5080/api`)

## Enhancements (.NET)

| Feature | Route |
|---------|--------|
| Appointments | `/api/appointments` |
| Notifications | `/api/notifications` |
| Medication reminders | `/api/medications` |
| Admin audit | `/api/admin/audit` |
| Swagger | `/swagger` |

Le backend Node (`backend/`) reste disponible via `docker-compose.yml` (port 5000).
