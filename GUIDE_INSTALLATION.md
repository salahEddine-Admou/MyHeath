# MyHeath — Guide d’installation (professeur / jury)

Ce document explique comment **cloner, installer et lancer** le projet MyHeath sur un ordinateur Windows, macOS ou Linux.

**Dépôt GitHub :** (URL après push — voir README)  
**Rapports PFE :**
- Version .NET : [`docs/RAPPORT_PFE_MYHEATH_DOTNET.pdf`](docs/RAPPORT_PFE_MYHEATH_DOTNET.pdf)
- Version Node / MERN : [`docs/RAPPORT_PFE_MYHEATH.pdf`](docs/RAPPORT_PFE_MYHEATH.pdf)

---

## 1. Contenu du projet

| Dossier / fichier | Rôle |
|-------------------|------|
| `frontend/` | Application React (Vite + Tailwind) |
| `backend/` | API Node.js + Express (port **5000**) |
| `backend-dotnet/` | API **ASP.NET Core 8** (port **5080**) — version PFE .NET |
| `docs/` | Rapports PDF + figures UML |
| `docker-compose.yml` | Stack Node + Mongo + React |
| `docker-compose.dotnet.yml` | Stack **.NET** + Mongo + React |

Le frontend React est **le même** pour les deux backends. Seule l’URL API change (`VITE_API_URL`).

---

## 2. Prérequis

Installer au choix :

### Option recommandée (Docker)

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / Mac) — **démarré** avant les commandes
- Git

### Option manuelle (sans Docker)

- Node.js **18+** ([nodejs.org](https://nodejs.org/))
- .NET SDK **8** ([download](https://dotnet.microsoft.com/download/dotnet/8.0)) — seulement pour le backend .NET
- MongoDB local **ou** un URI MongoDB Atlas gratuit
- Git

---

## 3. Cloner le dépôt

```bash
git clone https://github.com/salahEddine-Admou/MyHeath.git
cd MyHeath
```

---

## 4. Lancer avec Docker — backend .NET (recommandé pour le PFE .NET)

```bash
docker compose -f docker-compose.dotnet.yml up --build
```

Puis ouvrir :

| Service | URL |
|---------|-----|
| Application web | http://localhost:5173 |
| API .NET | http://localhost:5080/api/healthcheck |
| Swagger (.NET) | http://localhost:5080/swagger |

Arrêter :

```bash
docker compose -f docker-compose.dotnet.yml down
```

---

## 5. Lancer avec Docker — backend Node.js

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Application web | http://localhost:5173 |
| API Node | http://localhost:5000/api/healthcheck |

---

## 6. Lancer sans Docker (manuel)

### 6.1 MongoDB

- Soit MongoDB installé en local (`mongodb://localhost:27017`)
- Soit créer un cluster gratuit sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) et copier l’URI

### 6.2 Backend .NET

```bash
cd backend-dotnet/MyHeath.Api

# Copier la config (ou éditer appsettings.json / variables d’environnement)
# Variables utiles :
#   MONGODB_URI=mongodb://localhost:27017
#   MONGODB_DATABASE=myheath
#   JWT_SECRET=demo_jwt_secret
#   AES_SECRET_KEY=0123456789abcdef0123456789abcdef
#   CLIENT_URL=http://localhost:5173
#   PORT=5080
#   ANTHROPIC_API_KEY=   (optionnel — pour l’IA Claude)

dotnet restore
dotnet run
```

API : http://localhost:5080 — Swagger : http://localhost:5080/swagger

### 6.3 Backend Node (alternative)

```bash
cd backend
cp .env.example .env
# Éditer .env : MONGODB_URI, JWT_SECRET, AES_SECRET_KEY
npm install
npm run seed
npm run dev
```

API : http://localhost:5000

### 6.4 Frontend React

```bash
cd frontend
cp .env.example .env
```

Dans `frontend/.env`, choisir le backend :

```env
# Pour .NET :
VITE_API_URL=http://localhost:5080/api

# Pour Node :
# VITE_API_URL=http://localhost:5000/api
```

Puis :

```bash
npm install
npm run dev
```

Application : http://localhost:5173

---

## 7. Comptes de démonstration

Créés automatiquement (seed) au premier démarrage :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Admin** | `admin@myheath.app` | `Admin123` |
| **Médecin** | `doctor@myheath.app` | `Doctor123` |
| **Patient (femme)** | `patient@myheath.app` | `Patient123` |
| **Patient (homme)** | `man@myheath.app` | `Patient123` |

Parcours utiles :
- Admin → console `/admin` (users, abonnements, plans)
- Patient → Suivi, Diabète, Period, AI Coach, Rendez-vous, Médicaments
- Médecin → Consultations / chat

---

## 8. IA (Claude) — optionnel

Sans clé Anthropic, le reste de l’application fonctionne. Pour activer le coach IA :

1. Créer une clé sur https://console.anthropic.com/
2. Définir `ANTHROPIC_API_KEY=sk-ant-...` dans Docker / `.env` / `appsettings`

---

## 9. Rapports à consulter

| Fichier | Description |
|---------|-------------|
| `docs/RAPPORT_PFE_MYHEATH_DOTNET.pdf` | Rapport PFE **ASP.NET Core** + Docker + déploiement |
| `docs/RAPPORT_PFE_MYHEATH.pdf` | Rapport PFE version Node / MERN |
| `docs/figures/` | Figures UML / architecture |

---

## 10. Déploiement en ligne (déjà en production possible)

- Frontend (exemple) : https://heracare.vercel.app  
- Pour une démo locale, Docker Compose suffit — **pas besoin** de compte cloud.

---

## 11. Problèmes fréquents

| Problème | Solution |
|----------|----------|
| Docker « cannot connect » | Démarrer **Docker Desktop**, attendre qu’il soit Ready |
| Port déjà utilisé | Fermer l’autre app sur 5173 / 5080 / 5000 / 27017 |
| Page blanche / erreur API | Vérifier `VITE_API_URL` et que l’API répond sur `/api/healthcheck` |
| Login échoue | Relancer le seed / redémarrer les conteneurs (`down` puis `up --build`) |
| `dotnet` inconnu | Installer [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) ou utiliser Docker |

---

## 12. Auteur et encadrant

| | |
|--|--|
| **Réalisatrice** | Nezha Fekoussa |
| **Encadrant** | Salah Eddine Admou |

Projet académique **MyHeath** — PFE télémedecine & santé connectée  
Stack : **ASP.NET Core 8 · React · MongoDB · Docker** (+ backend Node optionnel)

Rapports complets (page de garde PDF incluse) :  
`docs/RAPPORT_PFE_MYHEATH_DOTNET.pdf` (FR) · `docs/RAPPORT_PFE_MYHEATH_DOTNET_EN.pdf` (EN)

Merci de commencer par **`GUIDE_INSTALLATION.md`** puis le PDF dans `docs/`.
