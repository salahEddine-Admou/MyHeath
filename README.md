# HeraCare

Plateforme intelligente de **télémédecine & suivi de santé féminine** (FemTech) — projet PFE ingénieur, stack **MERN**.

## Fonctionnalités

- Authentification JWT + RBAC (Patiente / Médecin / Admin)
- Suivi de cycle & symptômes avec **algorithme prédictif** (prochaines règles, ovulation, alertes SOPK / endométriose)
- **Hera AI (Claude)** : chat santé, journal en langage naturel, explication d’insights, brief médecin, plan bien-être, questions de consult
- Dossier médical & messages **chiffrés AES-256-CBC** au repos
- Chat temps réel **Socket.io** Patient ↔ Médecin
- Conteneurisation **Docker Compose**

## Structure

```
HeraCare/
├── backend/          # Node.js + Express + MongoDB + Socket.io
├── frontend/         # React + Vite + Tailwind + Recharts
├── docs/             # Rapport PFE (extraits techniques)
├── docker-compose.yml
└── vercel.json       # Déploiement frontend Vercel
```

## Démarrage local

### Prérequis
- Node.js 20+
- MongoDB local **ou** Docker

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed    # comptes démo
npm run dev     # http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev     # http://localhost:5173
```

### Comptes démo

| Rôle     | Email                  | Mot de passe |
|----------|------------------------|--------------|
| Patiente | patiente@heracare.ma   | Patient123   |
| Médecin  | docteur@heracare.ma    | Doctor123    |

### Docker

```bash
docker compose up --build
```

## Déploiement Vercel (frontend)

Le frontend se déploie sur **Vercel**. L’API (Socket.io) doit être hébergée séparément (Render, Railway, Fly.io, etc.).

1. Poussez le repo sur GitHub
2. Importez le projet sur [vercel.com](https://vercel.com) — **Root Directory** : `frontend`
3. Variables d’environnement Vercel :
   - `VITE_API_URL` = `https://VOTRE-API.onrender.com/api`
   - `VITE_SOCKET_URL` = `https://VOTRE-API.onrender.com`
4. Sur le backend (Render/Railway), définissez :
   - `MONGODB_URI` (MongoDB Atlas)
   - `JWT_SECRET`, `AES_SECRET_KEY`
   - `CLIENT_URL` = URL Vercel (ex. `https://heracare.vercel.app`)

```bash
cd frontend
npx vercel --prod
```

## API principale

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/health/insights` | Analyse prédictive du cycle |
| POST | `/api/health/symptoms` | Journaliser un symptôme |
| GET/PUT | `/api/health/record` | Dossier médical chiffré |
| GET | `/api/chat/:partnerId` | Historique conversation |

## Sécurité

- Mots de passe : bcrypt (cost 12)
- Sessions : JWT Bearer
- Données sensibles : AES-256-CBC (`backend/src/utils/crypto.js`)
- Accès : middleware `protect` + `authorize`

## Licence

Projet académique PFE — usage éducatif.
