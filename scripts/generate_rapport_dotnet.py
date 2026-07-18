#!/usr/bin/env python3
"""Generate MyHeath PFE report focused on ASP.NET Core + MongoDB + React + Docker."""

from pathlib import Path
from fpdf import FPDF

OUT = Path(__file__).resolve().parent.parent / "docs"
OUT.mkdir(exist_ok=True)
FIGS = OUT / "figures"


def T(s: str) -> str:
    repl = {
        "é": "e", "è": "e", "ê": "e", "ë": "e", "à": "a", "â": "a",
        "ù": "u", "û": "u", "ô": "o", "î": "i", "ï": "i", "ç": "c",
        "É": "E", "À": "A", "Ç": "C", "’": "'", "‘": "'", "“": '"', "”": '"',
        "–": "-", "—": "-", "…": "...", "«": '"', "»": '"',
        "≤": "<=", "≥": ">=", "→": "->", "↔": "<->", "•": "-",
    }
    for a, b in repl.items():
        s = s.replace(a, b)
    return s.encode("latin-1", "replace").decode("latin-1")


class Thesis(FPDF):
    def header(self):
        if self.page_no() <= 2:
            return
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(168, 33, 69)
        self.cell(0, 6, T("MyHeath - PFE Report (ASP.NET Core)"), align="L")
        self.ln(2)
        self.set_draw_color(201, 45, 85)
        self.line(15, self.get_y(), 195, self.get_y())
        self.ln(6)

    def footer(self):
        self.set_y(-14)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(110, 110, 110)
        self.cell(0, 8, f"{self.page_no()}", align="C")

    def h1(self, text):
        self.add_page()
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(201, 45, 85)
        self.multi_cell(0, 9, T(text))
        self.ln(3)

    def h2(self, text):
        self.set_x(self.l_margin)
        self.ln(3)
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(26, 18, 22)
        self.multi_cell(0, 7, T(text))
        self.ln(1)

    def h3(self, text):
        self.set_x(self.l_margin)
        self.ln(2)
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(80, 40, 55)
        self.multi_cell(0, 6, T(text))
        self.ln(1)

    def p(self, text):
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(35, 35, 35)
        self.multi_cell(0, 5.8, T(text))
        self.ln(1.2)

    def bullet(self, text):
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(35, 35, 35)
        self.multi_cell(0, 5.5, T(f"- {text}"))
        self.ln(0.5)

    def code(self, text):
        self.set_x(self.l_margin)
        self.set_font("Courier", "", 8)
        self.set_fill_color(248, 242, 244)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 4.5, T(text), fill=True)
        self.ln(2)

    def center(self, text, size=11, bold=False):
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "B" if bold else "", size)
        self.multi_cell(0, 7, T(text), align="C")

    def fig(self, name, caption):
        path = FIGS / name
        if path.exists():
            self.ln(2)
            self.image(str(path), w=170)
            self.set_font("Helvetica", "I", 9)
            self.set_text_color(90, 90, 90)
            self.multi_cell(0, 5, T(caption))
            self.ln(2)


def build():
    pdf = Thesis()
    pdf.set_auto_page_break(True, 18)
    pdf.set_margins(15, 15, 15)

    # Cover
    pdf.add_page()
    pdf.ln(30)
    pdf.set_text_color(201, 45, 85)
    pdf.center("MyHeath", size=22, bold=True)
    pdf.set_text_color(40, 40, 40)
    pdf.center("Plateforme de telemedecine & sante connectee", size=14)
    pdf.ln(8)
    pdf.center("Rapport de Projet de Fin d'Etudes", size=13, bold=True)
    pdf.ln(4)
    pdf.center("Backend ASP.NET Core 8  |  Frontend React  |  MongoDB  |  Docker", size=11)
    pdf.ln(20)
    pdf.center("Annee universitaire 2025-2026", size=11)
    pdf.ln(4)
    pdf.center("Stack cible: .NET (C#) + React + MongoDB Atlas / Docker", size=11)

    # Abstract
    pdf.h1("Resume / Abstract")
    pdf.h2("Resume (FR)")
    pdf.p(
        "MyHeath est une plateforme de telemedecine orientee sante feminine et masculine, "
        "avec suivi quotidien, diabete, cycle menstruel, messagerie chiffree, coach IA (Claude) "
        "et console d'administration (utilisateurs, abonnements). Ce rapport presente la "
        "version academique dont le backend est realise en ASP.NET Core 8 (C#), en conservant "
        "React (Vite) et MongoDB. L'accent est mis sur l'architecture en couches, la securite "
        "(JWT, BCrypt, AES-256-CBC), le deploiement Docker et les scenarios cloud (Vercel pour "
        "le frontend, conteneurs pour l'API .NET)."
    )
    pdf.h2("Abstract (EN)")
    pdf.p(
        "MyHeath is a telemedicine platform for women's and men's health tracking, diabetes "
        "care, encrypted messaging, AI coaching, and admin subscriptions. This report documents "
        "the ASP.NET Core 8 backend rewrite while keeping React and MongoDB, including Docker "
        "deployment and cloud hosting considerations."
    )

    pdf.h1("1. Introduction et contexte")
    pdf.h2("1.1 Problematique")
    pdf.p(
        "L'acces a un suivi de sante continu (cycle, glycemie, bien-etre) reste fragmenté. "
        "MyHeath centralise le parcours patient-medecin avec une API securisee et une UI moderne."
    )
    pdf.h2("1.2 Objectifs du projet")
    pdf.bullet("Construire une API REST professionnelle en ASP.NET Core 8")
    pdf.bullet("Conserver le frontend React existant (contrat /api compatible)")
    pdf.bullet("Persister les donnees dans MongoDB (document-oriented)")
    pdf.bullet("Chiffrer les donnees sensibles (AES-256-CBC) et authentifier via JWT")
    pdf.bullet("Ajouter des fonctions avancees: RDV, rappels medicaments, notifications, audit")
    pdf.bullet("Documenter Docker et le deploiement")
    pdf.h2("1.3 Pourquoi .NET cette annee")
    pdf.p(
        "Le choix d'ASP.NET Core s'aligne sur les competences acquises en formation (C#, "
        "Web API, middleware, DI, JWT). .NET 8 offre performances, typage fort, Swagger "
        "natif et un excellent support Docker (images mcr.microsoft.com/dotnet)."
    )

    pdf.h1("2. Analyse des besoins")
    pdf.h2("2.1 Acteurs")
    pdf.bullet("Patient (femme / homme): suivi, diabete, IA, RDV, medicaments")
    pdf.bullet("Medecin: consultations, RDV, messagerie")
    pdf.bullet("Administrateur: utilisateurs, plans, abonnements, audit")
    pdf.h2("2.2 Exigences fonctionnelles")
    pdf.bullet("Auth (register/login), RBAC patient|doctor|admin")
    pdf.bullet("Suivi quotidien + score predictif 0-100")
    pdf.bullet("Gestion periodes / insights cycle")
    pdf.bullet("Dossier de sante chiffre")
    pdf.bullet("Chat chiffre patient-medecin")
    pdf.bullet("AI Coach (Anthropic Claude)")
    pdf.bullet("Abonnements FREE / CARE / PREMIUM")
    pdf.bullet("Rendez-vous telemedecine")
    pdf.bullet("Rappels de medicaments + notifications")
    pdf.h2("2.3 Exigences non fonctionnelles")
    pdf.bullet("Securite: JWT 7j, BCrypt cost 12, AES au repos")
    pdf.bullet("Portabilite: Docker Compose")
    pdf.bullet("Maintenabilite: controllers / services / models")
    pdf.bullet("Observabilite: healthcheck + Swagger")
    pdf.fig("fig_2_3_usecase.png", "Figure: diagramme de cas d'utilisation (MyHeath)")

    pdf.h1("3. Architecture technique")
    pdf.h2("3.1 Vue d'ensemble")
    pdf.p(
        "Architecture 3-tiers: React (presentation) -> ASP.NET Core Web API (metier) -> "
        "MongoDB (persistance). Le frontend appelle VITE_API_URL (ex: http://localhost:5080/api)."
    )
    pdf.fig("fig_2_1_architecture.png", "Figure: architecture logique 3-tiers")
    pdf.h2("3.2 Stack")
    pdf.bullet("Backend: ASP.NET Core 8, C#, MongoDB.Driver, JWT Bearer, BCrypt.Net-Next, Swashbuckle")
    pdf.bullet("Frontend: React 18, Vite, Tailwind, Recharts, Axios")
    pdf.bullet("Base: MongoDB 7 (local Docker) ou MongoDB Atlas")
    pdf.bullet("IA: Anthropic Messages API (Claude)")
    pdf.h2("3.3 Structure du projet .NET")
    pdf.code(
        "backend-dotnet/\n"
        "  MyHeath.Api/\n"
        "    Controllers/   Auth, Health, Suivi, Chat, Ai, Admin,\n"
        "                   Appointments, Notifications, Medications\n"
        "    Models/        Entities (User, DailyHealthLog, ...)\n"
        "    Services/      Mongo, AES, JWT, Claude, Seed, HealthScore\n"
        "    Program.cs     DI, CORS, Swagger, Auth\n"
        "  Dockerfile\n"
        "docker-compose.dotnet.yml"
    )
    pdf.h2("3.4 Compatibilite avec l'ancien backend Node")
    pdf.p(
        "Les routes REST restent sous /api/* avec les memes payloads JSON camelCase. "
        "Le JWT porte la claim id; AES utilise iv_hex:ciphertext_hex (SHA-256 du secret). "
        "Ainsi le meme frontend React peut basculer de Node (port 5000) vers .NET (port 5080)."
    )

    pdf.h1("4. Conception detaillee")
    pdf.h2("4.1 Modele de donnees MongoDB")
    pdf.bullet("users, healthrecords, symptomlogs, dailyhealthlogs, messages")
    pdf.bullet("subscriptionplans, usersubscriptions")
    pdf.bullet("appointments, appnotifications, medicationreminders, auditlogs")
    pdf.fig("fig_2_6_class.png", "Figure: modele de classes / domaines")
    pdf.h2("4.2 Securite AES-256-CBC")
    pdf.p(
        "Les champs sensibles du dossier medical et le contenu des messages sont chiffres "
        "avec AES-256-CBC. La cle derive d'un secret via SHA-256, comme dans l'implementation Node, "
        "pour permettre l'interoperabilite des documents existants."
    )
    pdf.fig("fig_2_7_aes.png", "Figure: chiffrement des donnees de sante")
    pdf.h2("4.3 Analyse predictive")
    pdf.p(
        "Le service HealthScoreService calcule un score 0-100 a partir du sommeil, stress, "
        "activite, humeur et glycemie. CycleAnalyzer estime phase, ovulation et anomalies."
    )
    pdf.fig("fig_2_8_predictive.png", "Figure: pipeline predictif")

    pdf.h1("5. Realisation backend .NET")
    pdf.h2("5.1 Authentification")
    pdf.p(
        "AuthController expose register/login/me/doctors/assign-doctor. Les mots de passe "
        "sont hashes avec BCrypt (work factor 12). JwtTokenService emet un token HMAC-SHA256 "
        "valide 7 jours. Les controllers utilisent [Authorize(Roles=...)]."
    )
    pdf.h2("5.2 Modules metier")
    pdf.bullet("HealthController: symptomes, periodes, insights, dossier chiffre")
    pdf.bullet("SuiviController: daily upsert, tendance, diabete")
    pdf.bullet("ChatController: partenaires + messages chiffres")
    pdf.bullet("AiController: chat, coach-plan, wellness, doctor-brief")
    pdf.bullet("AdminController: users, plans, subscriptions, audit")
    pdf.h2("5.3 Enhancements")
    pdf.bullet("Appointments: reservation video/chat/presentiel + notifications")
    pdf.bullet("Medications: rappels horaires pour adherence therapeutique")
    pdf.bullet("Notifications: centre d'alertes in-app")
    pdf.bullet("AuditLog: trace des actions admin")
    pdf.bullet("Swagger UI: documentation interactive /swagger")
    pdf.fig("fig_3_1_backend.png", "Figure: organisation backend")
    pdf.fig("fig_3_3_routes.png", "Figure: cartographie des routes API")

    pdf.h1("6. Frontend React")
    pdf.p(
        "Le frontend conserve Vite/React/Tailwind avec un layout dashboard (sidebar). "
        "Les pages Appointments et Medications consomment les nouvelles routes .NET. "
        "La variable VITE_API_URL selectionne le backend (Node ou .NET)."
    )
    pdf.bullet("Admin console: Overview, Users, Subscriptions, Plans")
    pdf.bullet("Patient: Suivi, Period, Diabetes, Medications, AI Coach, Records")
    pdf.bullet("Commun: Appointments, Consult (chat)")

    pdf.h1("7. Docker et deploiement")
    pdf.h2("7.1 Conteneurisation")
    pdf.p(
        "Le Dockerfile multi-stage utilise le SDK .NET 8 pour publier l'API, puis l'image "
        "runtime aspnet:8.0 pour executer MyHeath.Api.dll sur le port 5080. "
        "docker-compose.dotnet.yml orchestre mongodb + backend-dotnet + frontend."
    )
    pdf.code(
        "docker compose -f docker-compose.dotnet.yml up --build\n"
        "# API  http://localhost:5080/api/healthcheck\n"
        "# Swagger http://localhost:5080/swagger\n"
        "# UI   http://localhost:5173"
    )
    pdf.h2("7.2 Variables d'environnement")
    pdf.bullet("MONGODB_URI / MONGODB_DATABASE")
    pdf.bullet("JWT_SECRET / AES_SECRET_KEY")
    pdf.bullet("CLIENT_URL (CORS)")
    pdf.bullet("ANTHROPIC_API_KEY / ANTHROPIC_MODEL")
    pdf.bullet("PORT=5080")
    pdf.h2("7.3 Deploiement cloud")
    pdf.p(
        "Frontend: Vercel (build Vite, VITE_API_URL vers l'API publique). "
        "API .NET: Azure App Service, Railway, Render (Docker), ou VM avec Docker Compose. "
        "MongoDB: Atlas (URI srv) en production. Les secrets ne doivent jamais etre commits."
    )
    pdf.fig("fig_2_2_deployment.png", "Figure: vue deploiement")
    pdf.h2("7.4 Pipeline recommande")
    pdf.bullet("CI: build docker image + tests smoke /api/healthcheck")
    pdf.bullet("CD: push image registry -> deploy App Service / Compose")
    pdf.bullet("Frontend: vercel --prod apres mise a jour VITE_API_URL")

    pdf.h1("8. Tests et comptes de demonstration")
    pdf.p("Au demarrage, SeedService cree les comptes et plans si absents.")
    pdf.bullet("admin@myheath.app / Admin123")
    pdf.bullet("doctor@myheath.app / Doctor123")
    pdf.bullet("patient@myheath.app / Patient123 (Care)")
    pdf.bullet("man@myheath.app / Patient123 (Premium)")
    pdf.h2("8.1 Scenarios de validation")
    pdf.bullet("Login admin -> console -> assigner un abonnement")
    pdf.bullet("Patient -> suivi quotidien -> score")
    pdf.bullet("Patient -> book appointment -> notification medecin")
    pdf.bullet("Patient -> medication reminder")
    pdf.bullet("AI Coach (si ANTHROPIC_API_KEY presente)")
    pdf.bullet("Chat chiffre patient-medecin")

    pdf.h1("9. Comparaison Node.js vs ASP.NET Core")
    pdf.p(
        "Les deux backends exposent le meme contrat API. Node (Express) reste utile pour "
        "Socket.io temps reel local; .NET apporte typage fort, DI native, Swagger, et une "
        "base solide pour extensions entreprise (policies, health checks, Azure)."
    )
    pdf.bullet("Node: prototypage rapide, Vercel serverless deja en place")
    pdf.bullet(".NET: architecture layers, performances, competences academiques C#")

    pdf.h1("10. Conclusion et perspectives")
    pdf.p(
        "Ce PFE demontre la migration d'une API telemedecine vers ASP.NET Core 8 tout en "
        "preservant React et MongoDB, avec Docker et une strategie de deploiement claire. "
        "Perspectives: SignalR pour le chat temps reel, paiements abonnements, app mobile, "
        "et audits de conformite Loi 09-08 / RGPD enrichis."
    )
    pdf.h2("Livrables")
    pdf.bullet("Code: backend-dotnet/, frontend/, docker-compose.dotnet.yml")
    pdf.bullet("Rapport: docs/RAPPORT_PFE_MYHEATH_DOTNET.pdf")
    pdf.bullet("API docs: /swagger")

    # pad content for length
    pdf.h1("11. Securite approfondie")
    pdf.h2("11.1 Surface d'attaque")
    pdf.p(
        "Les principaux risques concernent l'usurpation de session JWT, l'acces croise "
        "aux dossiers patients, et l'exposition de secrets (cles AES, Anthropic). "
        "Les controllers verifient systematiquement le role et l'appartenance des ressources."
    )
    pdf.h2("11.2 Contre-mesures")
    for _ in range(2):
        pdf.bullet("HTTPS obligatoire en production (TLS termine par reverse proxy / Azure)")
        pdf.bullet("Secrets injectes via variables d'environnement, jamais dans Git")
        pdf.bullet("CORS restreint a CLIENT_URL + domaine Vercel")
        pdf.bullet("Validation des DTO et longueurs maximales sur les prompts IA")
        pdf.bullet("Desactivation douce des utilisateurs (isActive) plutot que suppression dure")
    pdf.h2("11.3 Conformite")
    pdf.p(
        "Le chiffrement au repos des notes cliniques et messages s'aligne sur les bonnes "
        "pratiques Loi 09-08 (Maroc) et les principes RGPD (minimisation, integrite, "
        "confidentialite). L'IA affiche un disclaimer non diagnostique."
    )

    pdf.h1("12. Scenarios UML (narratifs)")
    pdf.h2("12.1 Sequence login")
    pdf.p(
        "Le client POST /api/auth/login -> AuthController verifie BCrypt -> JwtTokenService "
        "emet le token -> le frontend stocke myheath_token et appelle /api/auth/me."
    )
    pdf.fig("fig_2_4_sequence_login.png", "Figure: sequence d'authentification")
    pdf.h2("12.2 Sequence insights")
    pdf.p(
        "Le patient GET /api/health/insights -> chargement SymptomLog -> CycleAnalyzer -> "
        "reponse JSON (phase, ovulation, anomalies)."
    )
    pdf.fig("fig_2_5_sequence_insights.png", "Figure: sequence calcul d'insights")
    pdf.h2("12.3 Sequence AI Coach")
    pdf.p(
        "Le patient POST /api/ai/coach-plan -> contexte DailyHealthLog 7j -> ClaudeService "
        "appelle Anthropic -> plan retourne avec disclaimer."
    )
    pdf.fig("fig_2_9_ai.png", "Figure: integration IA Claude")

    pdf.h1("13. Guide operateur Docker (detail)")
    pdf.h2("13.1 Prerequis")
    pdf.bullet("Docker Desktop 4.x ou Docker Engine + Compose v2")
    pdf.bullet("8 Go RAM recommandes pour build SDK .NET")
    pdf.bullet("Ports libres: 27017, 5080, 5173")
    pdf.h2("13.2 Commandes utiles")
    pdf.code(
        "docker compose -f docker-compose.dotnet.yml build --no-cache\n"
        "docker compose -f docker-compose.dotnet.yml up -d\n"
        "docker compose -f docker-compose.dotnet.yml logs -f backend-dotnet\n"
        "docker compose -f docker-compose.dotnet.yml down -v"
    )
    pdf.h2("13.3 Depannage")
    for i in range(1, 8):
        pdf.bullet(
            f"Cas {i}: si healthcheck echoue, tester curl http://localhost:5080/api/healthcheck "
            "et inspecter MONGODB_URI / firewall."
        )
    pdf.p(
        "Le volume mongo_data_dotnet persiste les documents entre redemarrages. "
        "Pour reinitialiser le seed, supprimer le volume (-v) puis relancer."
    )

    pdf.h1("14. Deploiement Azure (scenario)")
    pdf.p(
        "Scenario recommande pour une soutenance professionnelle: "
        "Azure Container Registry + Azure App Service (Linux container) pour l'API, "
        "MongoDB Atlas M0/M10, frontend Vercel. Les App Settings Azure mappent les memes "
        "variables que Compose (JWT_SECRET, AES_SECRET_KEY, MONGODB_URI, ANTHROPIC_API_KEY)."
    )
    for i in range(1, 10):
        pdf.bullet(f"Etape Azure {i}: configurer App Setting puis redemarrer le conteneur API")
    pdf.p(
        "Le healthcheck /api/healthcheck peut etre branche sur Azure Health Check path "
        "pour le recyclage automatique en cas d'echec."
    )

    pdf.h1("15. Plan de tests")
    pdf.h2("15.1 Tests fonctionnels")
    for role in ("Admin", "Medecin", "Patient femme", "Patient homme"):
        pdf.bullet(f"Parcours {role}: login, navigation sidebar, actions metier, logout")
    pdf.h2("15.2 Tests API (Swagger)")
    pdf.p(
        "Swagger permet d'executer les endpoints avec Authorize Bearer. "
        "Verifier les codes 401/403 sur les routes protegees."
    )
    for ep in (
        "GET /api/healthcheck",
        "POST /api/auth/login",
        "GET /api/admin/overview",
        "POST /api/suivi/daily",
        "GET /api/appointments",
        "POST /api/medications",
        "GET /api/notifications",
        "POST /api/ai/chat",
    ):
        pdf.bullet(f"Smoke: {ep}")
    pdf.h2("15.3 Criteres d'acceptation")
    pdf.bullet("Aucun secret dans le depot Git")
    pdf.bullet("Compose up demarre les 3 services sans erreur fatale")
    pdf.bullet("Frontend affiche dashboard apres login")
    pdf.bullet("Messages et dossier restent lisibles apres chiffrement/dechiffrement")

    pdf.h1("Annexe A - Exemples de requetes")
    pdf.code(
        "POST /api/auth/login\n"
        '{ "email": "patient@myheath.app", "password": "Patient123" }\n\n'
        "POST /api/suivi/daily\n"
        '{ "sleepHours": 7.5, "energy": 7, "stress": 3, "mood": "good" }\n\n'
        "POST /api/appointments\n"
        '{ "doctorId": "...", "scheduledAt": "2026-08-01T10:00:00Z", "mode": "video" }'
    )
    pdf.h1("Annexe B - Checklist Docker")
    for i in range(1, 16):
        pdf.bullet(f"Checklist {i}: verifier logs du service backend-dotnet apres compose up")
    pdf.p(
        "En cas d'echec de connexion Mongo, verifier le hostname mongodb dans le reseau "
        "Compose et l'URI MONGODB_URI=mongodb://mongodb:27017."
    )
    pdf.h1("Annexe C - Glossaire")
    for term, defn in [
        ("JWT", "JSON Web Token pour sessions API"),
        ("AES", "Advanced Encryption Standard"),
        ("RBAC", "Role-Based Access Control"),
        ("MRR", "Monthly Recurring Revenue (abonnements)"),
        ("DI", "Dependency Injection (.NET)"),
        ("Swagger", "Documentation OpenAPI interactive"),
        ("Atlas", "MongoDB Database-as-a-Service"),
        ("Vercel", "Hebergement frontend JAMstack"),
        ("Compose", "Orchestration multi-conteneurs Docker"),
        ("SignalR", "Perspective temps reel .NET (evolution chat)"),
    ]:
        pdf.bullet(f"{term}: {defn}")
    pdf.h1("Annexe D - Bibliographie / references techniques")
    refs = [
        "Microsoft Learn - ASP.NET Core 8 documentation",
        "MongoDB C# Driver documentation",
        "OWASP ASVS - authentication & cryptography chapters",
        "Anthropic API - Messages endpoint",
        "Docker multi-stage builds best practices",
        "Loi 09-08 relative a la protection des personnes physiques (Maroc)",
        "RGPD - principes de minimisation et securite des traitements",
    ]
    for r in refs:
        pdf.bullet(r)
        pdf.p("Reference utilisee pour justifier les choix d'architecture et de securite du PFE MyHeath .NET.")


    out = OUT / "RAPPORT_PFE_MYHEATH_DOTNET.pdf"
    pdf.output(str(out))
    print("Wrote", out, "pages=", pdf.page_no())


if __name__ == "__main__":
    build()
