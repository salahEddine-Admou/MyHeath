#!/usr/bin/env python3
"""
MyHeath PFE report — professional layout:
- Cover + Abstract
- Table of contents with page numbers (two-pass)
- Consistent navy/teal academic styling
- Large embedded UML figures
"""

from pathlib import Path
from fpdf import FPDF

OUT = Path(__file__).resolve().parent.parent / "docs"
FIGS = OUT / "figures"
OUT.mkdir(exist_ok=True)

# Academic palette
NAVY = (27, 54, 93)
TEAL = (15, 118, 110)
SLATE = (51, 65, 85)
TEXT = (30, 41, 59)
MUTED = (100, 116, 139)
LINE = (203, 213, 225)
LIGHT = (248, 250, 252)


def T(s: str) -> str:
    repl = {
        "é": "e", "è": "e", "ê": "e", "ë": "e", "à": "a", "â": "a",
        "ù": "u", "û": "u", "ô": "o", "î": "i", "ï": "i", "ç": "c",
        "É": "E", "À": "A", "Ç": "C", "’": "'", "‘": "'", "“": '"', "”": '"',
        "–": "-", "—": "-", "…": "...", "«": '"', "»": '"',
        "≤": "<=", "≥": ">=", "→": "->", "↔": "<->", "•": "-",
        "─": "-",
    }
    for a, b in repl.items():
        s = s.replace(a, b)
    return s.encode("latin-1", "replace").decode("latin-1")


class Thesis(FPDF):
    def __init__(self):
        super().__init__()
        self._toc = []  # (level, title, page)
        self._front_matter = True
        self.set_auto_page_break(True, margin=22)
        self.set_margins(18, 20, 18)

    def header(self):
        if self._front_matter:
            return
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*MUTED)
        self.cell(0, 6, T("MyHeath — Rapport PFE  |  ASP.NET Core · React · MongoDB"), align="L")
        self.ln(1)
        self.set_draw_color(*LINE)
        self.set_line_width(0.4)
        self.line(self.l_margin, self.get_y() + 1, self.w - self.r_margin, self.get_y() + 1)
        self.ln(8)

    def footer(self):
        self.set_y(-16)
        self.set_draw_color(*LINE)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(2)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*MUTED)
        if self._front_matter:
            # roman-like simple: use page number still
            self.cell(0, 8, f"- {self.page_no()} -", align="C")
        else:
            self.cell(0, 8, T(f"Page {self.page_no()}"), align="C")

    def h1(self, text, record=True):
        self.add_page()
        self._front_matter = False
        if record:
            self._toc.append((1, text, self.page_no()))
        self.set_x(self.l_margin)
        self.set_fill_color(*NAVY)
        self.rect(self.l_margin, self.get_y(), 3.5, 10, style="F")
        self.set_xy(self.l_margin + 6, self.get_y())
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(*NAVY)
        self.multi_cell(0, 9, T(text))
        self.ln(2)
        self.set_draw_color(*TEAL)
        self.set_line_width(0.8)
        y = self.get_y()
        self.line(self.l_margin, y, self.l_margin + 55, y)
        self.ln(6)

    def h2(self, text, record=True):
        if self.get_y() > 250:
            self.add_page()
        self.set_x(self.l_margin)
        self.ln(4)
        if record:
            self._toc.append((2, text, self.page_no()))
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(*TEAL)
        self.multi_cell(0, 7, T(text))
        self.ln(2)

    def h3(self, text):
        self.set_x(self.l_margin)
        self.ln(2)
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*SLATE)
        self.multi_cell(0, 6, T(text))
        self.ln(1)

    def p(self, text):
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "", 10.5)
        self.set_text_color(*TEXT)
        self.multi_cell(0, 6.0, T(text), align="J")
        self.ln(1.5)

    def bullet(self, text):
        self.set_x(self.l_margin + 2)
        self.set_font("Helvetica", "", 10.5)
        self.set_text_color(*TEXT)
        self.multi_cell(0, 5.8, T(f"  •  {text}"))
        self.ln(0.8)

    def code(self, text):
        self.set_x(self.l_margin)
        self.set_font("Courier", "", 8.5)
        self.set_fill_color(*LIGHT)
        self.set_text_color(*SLATE)
        self.set_draw_color(*LINE)
        self.multi_cell(0, 5, T(text), fill=True, border=1)
        self.ln(3)

    def center(self, text, size=11, bold=False, color=None):
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "B" if bold else "", size)
        self.set_text_color(*(color or TEXT))
        self.multi_cell(0, 7, T(text), align="C")

    def fig(self, name, caption):
        path = FIGS / name
        if not path.exists():
            self.p(f"[Figure manquante: {name}]")
            return
        if self.get_y() > 160:
            self.add_page()
        self.ln(3)
        # Fit width with margins
        usable = self.w - self.l_margin - self.r_margin
        self.image(str(path), x=self.l_margin, w=usable)
        self.ln(2)
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(*MUTED)
        self.set_x(self.l_margin)
        self.multi_cell(0, 5, T(caption), align="C")
        self.ln(4)

    def table(self, headers, rows):
        self.set_x(self.l_margin)
        usable = self.w - self.l_margin - self.r_margin
        col_w = usable / len(headers)
        self.set_font("Helvetica", "B", 9)
        self.set_fill_color(*NAVY)
        self.set_text_color(255, 255, 255)
        for h in headers:
            self.cell(col_w, 8, T(h)[:26], border=0, fill=True, align="C")
        self.ln()
        self.set_font("Helvetica", "", 9)
        fill = False
        for row in rows:
            self.set_x(self.l_margin)
            self.set_fill_color(*(LIGHT if fill else (255, 255, 255)))
            self.set_text_color(*TEXT)
            for cell in row:
                self.cell(col_w, 7, T(str(cell))[:30], border="B", fill=True)
            self.ln()
            fill = not fill
        self.ln(4)


def write_cover(pdf: Thesis):
    pdf._front_matter = True
    pdf.add_page()
    pdf.ln(12)
    pdf.center("ROYAUME DU MAROC", size=11, bold=True, color=NAVY)
    pdf.center("Ministere de l'Enseignement Superieur", size=10, color=SLATE)
    pdf.center("Sciences de l'Ingenieur — Genie Informatique", size=10, color=SLATE)
    pdf.ln(8)
    pdf.set_draw_color(*TEAL)
    pdf.set_line_width(1.0)
    y = pdf.get_y()
    pdf.line(55, y, 155, y)
    pdf.ln(12)
    pdf.center("PROJET DE FIN D'ETUDES", size=12, bold=True, color=MUTED)
    pdf.ln(8)
    pdf.center("MyHeath", size=28, bold=True, color=NAVY)
    pdf.ln(2)
    pdf.center("Plateforme de telemedecine et sante connectee", size=13, color=SLATE)
    pdf.ln(6)
    pdf.center("Backend ASP.NET Core 8  ·  Frontend React  ·  MongoDB  ·  Docker", size=10, color=TEAL)
    pdf.ln(16)
    pdf.set_fill_color(*LIGHT)
    pdf.set_x(35)
    pdf.cell(140, 28, "", border=0, fill=True, ln=1)
    pdf.set_y(pdf.get_y() - 24)
    pdf.center("Rapport technique et academique", size=11, bold=True, color=NAVY)
    pdf.center("Architecture, securite, realisation, Docker et deploiement", size=10, color=SLATE)
    pdf.ln(20)
    pdf.center("Annee universitaire 2025 — 2026", size=11, color=TEXT)
    pdf.ln(6)
    pdf.center("Document a destination du jury / encadrant", size=9, color=MUTED)


def write_abstract(pdf: Thesis):
    pdf._front_matter = True
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(*NAVY)
    pdf.cell(0, 10, T("Resume / Abstract"), ln=1)
    pdf.set_draw_color(*TEAL)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.l_margin + 40, pdf.get_y())
    pdf.ln(8)

    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(*TEAL)
    pdf.cell(0, 8, T("Resume (FR)"), ln=1)
    pdf.set_font("Helvetica", "", 10.5)
    pdf.set_text_color(*TEXT)
    pdf.multi_cell(
        0,
        6,
        T(
            "MyHeath est une plateforme de telemedecine orientee sante feminine et masculine, "
            "avec suivi quotidien, diabete, cycle menstruel, messagerie chiffree, coach IA (Claude) "
            "et console d'administration (utilisateurs, abonnements). Ce rapport presente la version "
            "dont le backend est realise en ASP.NET Core 8 (C#), en conservant React (Vite) et MongoDB. "
            "L'accent est mis sur l'architecture en couches, la securite (JWT, BCrypt, AES-256-CBC), "
            "le deploiement Docker et les scenarios cloud (Vercel, Atlas, Azure)."
        ),
        align="J",
    )
    pdf.ln(8)
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(*TEAL)
    pdf.cell(0, 8, T("Abstract (EN)"), ln=1)
    pdf.set_font("Helvetica", "", 10.5)
    pdf.set_text_color(*TEXT)
    pdf.multi_cell(
        0,
        6,
        T(
            "MyHeath is a telemedicine platform for women's and men's health tracking, diabetes "
            "care, encrypted messaging, AI coaching, and admin subscriptions. This report documents "
            "the ASP.NET Core 8 backend rewrite while keeping React and MongoDB, including Docker "
            "deployment and cloud hosting considerations."
        ),
        align="J",
    )
    pdf.ln(10)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(*NAVY)
    pdf.cell(0, 8, T("Mots-cles"), ln=1)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(*SLATE)
    pdf.multi_cell(
        0,
        6,
        T(
            "ASP.NET Core 8, React, MongoDB, Docker, JWT, AES-256, telemedecine, "
            "FemTech, Claude AI, Vercel, Azure"
        ),
    )


def write_toc(pdf: Thesis, toc_entries, page_offset: int):
    """Render TOC using page numbers from pass 1, shifted by page_offset."""
    pdf._front_matter = True
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(*NAVY)
    pdf.cell(0, 10, T("Table des matieres"), ln=1)
    pdf.set_draw_color(*TEAL)
    pdf.set_line_width(0.8)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.l_margin + 50, pdf.get_y())
    pdf.ln(10)

    usable = pdf.w - pdf.l_margin - pdf.r_margin
    for level, title, page in toc_entries:
        display_page = page + page_offset
        pdf.set_x(pdf.l_margin)
        indent = 0 if level == 1 else 8
        pdf.set_font("Helvetica", "B" if level == 1 else "", 11 if level == 1 else 10)
        pdf.set_text_color(*NAVY if level == 1 else TEXT)

        label = T(title)
        page_str = str(display_page)
        # dotted leader
        max_w = usable - indent - 12
        pdf.set_x(pdf.l_margin + indent)
        # measure
        tw = pdf.get_string_width(label)
        pw = pdf.get_string_width(page_str)
        dots_w = max_w - tw - pw - 2
        dots = ""
        if dots_w > 4:
            n = int(dots_w / pdf.get_string_width("."))
            dots = "." * max(n, 3)

        pdf.cell(tw + 1, 8, label, border=0)
        pdf.set_text_color(*MUTED)
        pdf.cell(dots_w, 8, dots, border=0)
        pdf.set_text_color(*NAVY if level == 1 else TEXT)
        pdf.cell(pw + 2, 8, page_str, border=0, align="R", ln=1)
        if level == 1:
            pdf.ln(1)


def write_body(pdf: Thesis):
    """Main chapters — records TOC entries with page numbers."""

    pdf.h1("1. Introduction et contexte")
    pdf.h2("1.1 Problematique")
    pdf.p(
        "L'acces a un suivi de sante continu (cycle, glycemie, bien-etre) reste fragmenté entre "
        "applications isolees. MyHeath centralise le parcours patient-medecin-administrateur "
        "autour d'une API securisee et d'une interface moderne type dashboard."
    )
    pdf.h2("1.2 Objectifs du projet")
    pdf.bullet("Construire une API REST professionnelle en ASP.NET Core 8")
    pdf.bullet("Conserver le frontend React existant (contrat /api compatible)")
    pdf.bullet("Persister les donnees dans MongoDB")
    pdf.bullet("Chiffrer les donnees sensibles (AES-256-CBC) et authentifier via JWT")
    pdf.bullet("Ajouter RDV, rappels medicaments, notifications et audit admin")
    pdf.bullet("Documenter Docker et le deploiement cloud")
    pdf.h2("1.3 Pourquoi ASP.NET Core")
    pdf.p(
        "Le choix d'ASP.NET Core s'aligne sur les competences acquises en formation (C#, Web API, "
        "middleware, injection de dependances, JWT). .NET 8 offre performances, typage fort, "
        "Swagger natif et un excellent support Docker (images officielles Microsoft)."
    )

    pdf.h1("2. Analyse des besoins")
    pdf.h2("2.1 Acteurs")
    pdf.table(
        ["Acteur", "Responsabilites principales"],
        [
            ["Patient", "Suivi, diabete, IA, RDV, medicaments"],
            ["Medecin", "Consultations, RDV, messagerie"],
            ["Administrateur", "Users, plans, abonnements, audit"],
        ],
    )
    pdf.h2("2.2 Exigences fonctionnelles")
    pdf.bullet("Authentification (register/login) et RBAC patient | doctor | admin")
    pdf.bullet("Suivi quotidien + score predictif 0-100")
    pdf.bullet("Gestion des periodes / insights de cycle")
    pdf.bullet("Dossier de sante chiffre et chat chiffre")
    pdf.bullet("AI Coach (Anthropic Claude)")
    pdf.bullet("Abonnements FREE / CARE / PREMIUM")
    pdf.bullet("Rendez-vous telemedecine et rappels medicaments")
    pdf.h2("2.3 Exigences non fonctionnelles")
    pdf.bullet("Securite: JWT 7 jours, BCrypt cost 12, AES au repos")
    pdf.bullet("Portabilite: Docker Compose")
    pdf.bullet("Maintenabilite: Controllers / Services / Models")
    pdf.bullet("Observabilite: healthcheck + Swagger")
    pdf.fig("fig_2_3_usecase.png", "Figure 2.3 — Diagramme de cas d'utilisation")

    pdf.h1("3. Architecture technique")
    pdf.h2("3.1 Vue d'ensemble")
    pdf.p(
        "Architecture 3-tiers: React (presentation) -> ASP.NET Core Web API (metier) -> "
        "MongoDB (persistance). Le frontend appelle VITE_API_URL "
        "(exemple: http://localhost:5080/api)."
    )
    pdf.fig("fig_2_1_architecture.png", "Figure 2.1 — Architecture 3-tiers MyHeath")
    pdf.h2("3.2 Stack technologique")
    pdf.table(
        ["Couche", "Technologies"],
        [
            ["Backend", "ASP.NET Core 8, C#, MongoDB.Driver, JWT, BCrypt"],
            ["Frontend", "React 18, Vite, Tailwind, Recharts, Axios"],
            ["Donnees", "MongoDB 7 (Docker) ou MongoDB Atlas"],
            ["IA", "Anthropic Messages API (Claude)"],
            ["Ops", "Docker Compose, Vercel, Azure (option)"],
        ],
    )
    pdf.h2("3.3 Structure du projet .NET")
    pdf.code(
        "backend-dotnet/\n"
        "  MyHeath.Api/\n"
        "    Controllers/   Auth, Health, Suivi, Chat, Ai, Admin, RDV...\n"
        "    Models/        Entities (User, DailyHealthLog, ...)\n"
        "    Services/      Mongo, AES, JWT, Claude, Seed, HealthScore\n"
        "    Program.cs     DI, CORS, Swagger, Authentication\n"
        "  Dockerfile\n"
        "docker-compose.dotnet.yml"
    )
    pdf.h2("3.4 Compatibilite avec le backend Node")
    pdf.p(
        "Les routes REST restent sous /api/* avec des payloads JSON camelCase. "
        "Le JWT porte la claim id; AES utilise le format iv_hex:ciphertext_hex. "
        "Le meme frontend React peut basculer de Node (port 5000) vers .NET (port 5080)."
    )

    pdf.h1("4. Conception detaillee")
    pdf.h2("4.1 Modele de donnees MongoDB")
    pdf.bullet("users, healthrecords, symptomlogs, dailyhealthlogs, messages")
    pdf.bullet("subscriptionplans, usersubscriptions")
    pdf.bullet("appointments, appnotifications, medicationreminders, auditlogs")
    pdf.fig("fig_2_6_class.png", "Figure 2.6 — Modele de domaines (extrait)")
    pdf.h2("4.2 Securite AES-256-CBC")
    pdf.p(
        "Les champs sensibles du dossier medical et le contenu des messages sont chiffres "
        "avec AES-256-CBC. La cle derive d'un secret via SHA-256, comme dans l'implementation "
        "Node, pour permettre l'interoperabilite des documents existants."
    )
    pdf.fig("fig_2_7_aes.png", "Figure 2.7 — Chiffrement AES-256-CBC")
    pdf.h2("4.3 Analyse predictive")
    pdf.p(
        "HealthScoreService calcule un score 0-100 a partir du sommeil, stress, activite, "
        "humeur et glycemie. CycleAnalyzer estime la phase, l'ovulation et les anomalies."
    )
    pdf.fig("fig_2_8_predictive.png", "Figure 2.8 — Pipeline predictif")

    pdf.h1("5. Realisation backend .NET")
    pdf.h2("5.1 Authentification")
    pdf.p(
        "AuthController expose register, login, me, doctors et assign-doctor. "
        "Les mots de passe sont hashes avec BCrypt (work factor 12). "
        "JwtTokenService emet un token HMAC-SHA256 valide 7 jours."
    )
    pdf.fig("fig_2_4_sequence_login.png", "Figure 2.4 — Sequence d'authentification")
    pdf.h2("5.2 Modules metier")
    pdf.bullet("HealthController: symptomes, periodes, insights, dossier chiffre")
    pdf.bullet("SuiviController: daily upsert, tendance, diabete")
    pdf.bullet("ChatController: partenaires et messages chiffres")
    pdf.bullet("AiController: chat, coach-plan, wellness, doctor-brief")
    pdf.bullet("AdminController: users, plans, subscriptions, audit")
    pdf.fig("fig_2_5_sequence_insights.png", "Figure 2.5 — Sequence insights cycle")
    pdf.h2("5.3 Fonctionnalites ajoutees")
    pdf.table(
        ["Fonctionnalite", "Endpoint"],
        [
            ["Rendez-vous", "/api/appointments"],
            ["Notifications", "/api/notifications"],
            ["Rappels medicaments", "/api/medications"],
            ["Audit admin", "/api/admin/audit"],
            ["Swagger / OpenAPI", "/swagger"],
        ],
    )
    pdf.fig("fig_3_1_backend.png", "Figure 3.1 — Organisation backend ASP.NET Core")
    pdf.fig("fig_3_3_routes.png", "Figure 3.3 — Cartographie des routes API")
    pdf.fig("fig_2_9_ai.png", "Figure 2.9 — Integration AI Coach (Claude)")

    pdf.h1("6. Frontend React")
    pdf.p(
        "Le frontend conserve Vite, React et Tailwind avec un layout dashboard a sidebar. "
        "Les pages Appointments et Medications consomment les nouvelles routes .NET. "
        "La variable VITE_API_URL selectionne le backend (Node ou .NET)."
    )
    pdf.bullet("Admin: Overview, Users, Subscriptions, Plans")
    pdf.bullet("Patient: Suivi, Period, Diabetes, Medications, AI Coach, Records")
    pdf.bullet("Commun: Appointments, Consult (chat)")

    pdf.h1("7. Docker et deploiement")
    pdf.h2("7.1 Conteneurisation")
    pdf.p(
        "Le Dockerfile multi-stage utilise le SDK .NET 8 pour publier l'API, puis l'image "
        "runtime aspnet:8.0 pour executer MyHeath.Api.dll sur le port 5080. "
        "Le fichier docker-compose.dotnet.yml orchestre mongodb, backend-dotnet et frontend."
    )
    pdf.code(
        "docker compose -f docker-compose.dotnet.yml up --build\n"
        "# API     http://localhost:5080/api/healthcheck\n"
        "# Swagger http://localhost:5080/swagger\n"
        "# UI      http://localhost:5173"
    )
    pdf.fig("fig_2_2_deployment.png", "Figure 2.2 — Topologie de deploiement")
    pdf.h2("7.2 Variables d'environnement")
    pdf.bullet("MONGODB_URI / MONGODB_DATABASE")
    pdf.bullet("JWT_SECRET / AES_SECRET_KEY")
    pdf.bullet("CLIENT_URL (CORS)")
    pdf.bullet("ANTHROPIC_API_KEY / ANTHROPIC_MODEL (optionnel)")
    pdf.bullet("PORT=5080")
    pdf.h2("7.3 Deploiement cloud")
    pdf.p(
        "Frontend: Vercel (build Vite, VITE_API_URL vers l'API publique). "
        "API .NET: Azure App Service, Railway, Render (Docker), ou VM avec Docker Compose. "
        "MongoDB: Atlas en production. Les secrets ne doivent jamais etre commits dans Git."
    )
    pdf.h2("7.4 Pipeline recommande")
    pdf.bullet("CI: build image Docker + smoke test /api/healthcheck")
    pdf.bullet("CD: push registry puis deploy App Service / Compose")
    pdf.bullet("Frontend: vercel --prod apres mise a jour de VITE_API_URL")

    pdf.h1("8. Tests et comptes de demonstration")
    pdf.p("Au demarrage, SeedService cree les comptes et plans s'ils sont absents.")
    pdf.table(
        ["Role", "Email", "Mot de passe"],
        [
            ["Admin", "admin@myheath.app", "Admin123"],
            ["Medecin", "doctor@myheath.app", "Doctor123"],
            ["Patient F", "patient@myheath.app", "Patient123"],
            ["Patient H", "man@myheath.app", "Patient123"],
        ],
    )
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
        "un prototypage rapide et un deploiement serverless Vercel; .NET apporte typage fort, "
        "DI native, Swagger et une base solide pour des extensions entreprise."
    )
    pdf.table(
        ["Critere", "Node.js", "ASP.NET Core"],
        [
            ["Langage", "JavaScript", "C#"],
            ["Typage", "Dynamique", "Fort / compile"],
            ["Docs API", "Manuelle", "Swagger integre"],
            ["Docker", "node:alpine", "mcr.microsoft.com/dotnet"],
            ["PFE", "MERN classique", "Stack enseignee (.NET)"],
        ],
    )

    pdf.h1("10. Securite")
    pdf.h2("10.1 Contre-mesures")
    pdf.bullet("HTTPS obligatoire en production")
    pdf.bullet("Secrets via variables d'environnement (jamais dans Git)")
    pdf.bullet("CORS restreint a CLIENT_URL + domaine frontend")
    pdf.bullet("Validation des DTO et limitation de taille des prompts IA")
    pdf.bullet("Desactivation douce des utilisateurs (isActive)")
    pdf.h2("10.2 Conformite")
    pdf.p(
        "Le chiffrement au repos des notes cliniques et messages s'aligne sur les bonnes "
        "pratiques Loi 09-08 (Maroc) et les principes RGPD. L'IA affiche un disclaimer "
        "non diagnostique."
    )

    pdf.h1("11. Conclusion et perspectives")
    pdf.p(
        "Ce PFE demontre la realisation d'une API telemedecine en ASP.NET Core 8 tout en "
        "preservant React et MongoDB, avec Docker et une strategie de deploiement claire. "
        "Perspectives: SignalR pour le chat temps reel, paiements d'abonnements, "
        "application mobile, et audits de conformite enrichis."
    )
    pdf.h2("11.1 Livrables")
    pdf.bullet("Code: backend-dotnet/, frontend/, docker-compose.dotnet.yml")
    pdf.bullet("Rapport: docs/RAPPORT_PFE_MYHEATH_DOTNET.pdf")
    pdf.bullet("Guide jury: GUIDE_INSTALLATION.md")
    pdf.bullet("Depot public: https://github.com/salahEddine-Admou/MyHeath")

    pdf.h1("Annexe A — Exemples de requetes")
    pdf.code(
        "POST /api/auth/login\n"
        '{ "email": "patient@myheath.app", "password": "Patient123" }\n\n'
        "POST /api/suivi/daily\n"
        '{ "sleepHours": 7.5, "energy": 7, "stress": 3, "mood": "good" }\n\n'
        "POST /api/appointments\n"
        '{ "doctorId": "...", "scheduledAt": "2026-08-01T10:00:00Z", "mode": "video" }'
    )

    pdf.h1("Annexe B — Checklist Docker")
    pdf.bullet("Installer et demarrer Docker Desktop")
    pdf.bullet("Cloner le depot GitHub MyHeath")
    pdf.bullet("Executer: docker compose -f docker-compose.dotnet.yml up --build")
    pdf.bullet("Verifier http://localhost:5080/api/healthcheck")
    pdf.bullet("Ouvrir http://localhost:5173 et se connecter")
    pdf.bullet("En cas d'echec Mongo: verifier MONGODB_URI=mongodb://mongodb:27017")

    pdf.h1("Annexe C — Glossaire")
    for term, defn in [
        ("JWT", "JSON Web Token pour sessions API"),
        ("AES", "Advanced Encryption Standard"),
        ("RBAC", "Role-Based Access Control"),
        ("MRR", "Monthly Recurring Revenue"),
        ("DI", "Dependency Injection (.NET)"),
        ("Swagger", "Documentation OpenAPI interactive"),
        ("Atlas", "MongoDB Database-as-a-Service"),
        ("Compose", "Orchestration multi-conteneurs Docker"),
    ]:
        pdf.bullet(f"{term}: {defn}")


def build():
    # ---- Pass 1: collect TOC page numbers (no TOC pages yet) ----
    p1 = Thesis()
    write_cover(p1)
    write_abstract(p1)
    # marker: body starts after front pages without TOC
    front_without_toc = p1.page_no()
    write_body(p1)
    toc_entries = list(p1._toc)

    # Reserve 2 pages for TOC so numbering stays stable
    toc_pages = 2
    page_offset = toc_pages

    # ---- Pass 2: final document ----
    pdf = Thesis()
    write_cover(pdf)
    write_abstract(pdf)
    write_toc(pdf, toc_entries, page_offset=page_offset)
    # Pad to exactly cover + abstract + toc_pages before body starts
    target_front = front_without_toc + toc_pages
    while pdf.page_no() < target_front:
        pdf.add_page()
        pdf._front_matter = True

    write_body(pdf)

    out = OUT / "RAPPORT_PFE_MYHEATH_DOTNET.pdf"
    pdf.output(str(out))
    print("Wrote", out, "pages=", pdf.page_no())
    print("TOC entries:", len(toc_entries))


if __name__ == "__main__":
    build()
