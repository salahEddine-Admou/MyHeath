#!/usr/bin/env python3
"""
MyHeath PFE report (ASP.NET Core) — FR + EN
Fixes: header/footer no longer overlap body text.
Author: Nezha Fekoussa
"""

from __future__ import annotations

import argparse
from pathlib import Path
from fpdf import FPDF

OUT = Path(__file__).resolve().parent.parent / "docs"
FIGS = OUT / "figures"
OUT.mkdir(exist_ok=True)

AUTHOR = "Nezha Fekoussa"
NAVY = (27, 54, 93)
TEAL = (15, 118, 110)
SLATE = (51, 65, 85)
TEXT = (30, 41, 59)
MUTED = (100, 116, 139)
LINE = (203, 213, 225)
LIGHT = (248, 250, 252)

# Header band geometry (mm) — must stay below top margin
HEADER_Y = 10
HEADER_LINE_Y = 16
TOP_MARGIN = 24
BOTTOM_MARGIN = 20
FOOTER_LINE_Y = -16
FOOTER_TEXT_Y = -12


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
    def __init__(self, lang: str = "fr"):
        super().__init__()
        self.lang = lang
        self._toc: list[tuple[int, str, int]] = []
        self._front_matter = True
        self.set_auto_page_break(auto=True, margin=BOTTOM_MARGIN)
        self.set_margins(left=18, top=TOP_MARGIN, right=18)
        if lang == "en":
            self.header_label = "MyHeath — Final Year Project Report  |  ASP.NET Core · React · MongoDB"
            self.page_label = "Page"
            self.toc_title = "Table of contents"
        else:
            self.header_label = "MyHeath — Rapport PFE  |  ASP.NET Core · React · MongoDB"
            self.page_label = "Page"
            self.toc_title = "Table des matieres"

    def header(self):
        if self._front_matter:
            return
        # Fixed coordinates — never use ln() here (avoids line through text)
        self.set_xy(self.l_margin, HEADER_Y)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*MUTED)
        self.cell(self.w - self.l_margin - self.r_margin, 5, T(self.header_label), align="L")
        self.set_draw_color(*LINE)
        self.set_line_width(0.35)
        self.line(self.l_margin, HEADER_LINE_Y, self.w - self.r_margin, HEADER_LINE_Y)
        # Reset Y for body content start (top margin)
        self.set_y(TOP_MARGIN)

    def footer(self):
        self.set_draw_color(*LINE)
        self.set_line_width(0.35)
        y_line = self.h + FOOTER_LINE_Y
        self.line(self.l_margin, y_line, self.w - self.r_margin, y_line)
        self.set_xy(self.l_margin, self.h + FOOTER_TEXT_Y)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*MUTED)
        self.cell(self.w - self.l_margin - self.r_margin, 6, T(f"{self.page_label} {self.page_no()}"), align="C")

    def h1(self, text: str, record: bool = True):
        self.add_page()
        self._front_matter = False
        if record:
            self._toc.append((1, text, self.page_no()))
        self.set_x(self.l_margin)
        y0 = self.get_y()
        self.set_fill_color(*NAVY)
        self.rect(self.l_margin, y0, 3.2, 9, style="F")
        self.set_xy(self.l_margin + 6, y0)
        self.set_font("Helvetica", "B", 15)
        self.set_text_color(*NAVY)
        self.multi_cell(0, 8, T(text))
        self.ln(1)
        self.set_draw_color(*TEAL)
        self.set_line_width(0.7)
        y = self.get_y()
        self.line(self.l_margin, y, self.l_margin + 50, y)
        self.ln(5)

    def h2(self, text: str, record: bool = True):
        if self.get_y() > 245:
            self.add_page()
        self.set_x(self.l_margin)
        self.ln(3)
        if record:
            self._toc.append((2, text, self.page_no()))
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(*TEAL)
        self.multi_cell(0, 7, T(text))
        self.ln(2)

    def p(self, text: str):
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "", 10.5)
        self.set_text_color(*TEXT)
        self.multi_cell(0, 5.8, T(text), align="J")
        self.ln(1.4)

    def bullet(self, text: str):
        self.set_x(self.l_margin + 2)
        self.set_font("Helvetica", "", 10.5)
        self.set_text_color(*TEXT)
        self.multi_cell(0, 5.6, T(f"  -  {text}"))
        self.ln(0.6)

    def code(self, text: str):
        self.set_x(self.l_margin)
        self.set_font("Courier", "", 8.5)
        self.set_fill_color(*LIGHT)
        self.set_text_color(*SLATE)
        self.set_draw_color(*LINE)
        self.multi_cell(0, 5, T(text), fill=True, border=1)
        self.ln(3)

    def center(self, text: str, size: int = 11, bold: bool = False, color=None):
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "B" if bold else "", size)
        self.set_text_color(*(color or TEXT))
        self.multi_cell(0, 7, T(text), align="C")

    def fig(self, name: str, caption: str):
        path = FIGS / name
        if not path.exists():
            self.p(f"[Missing figure: {name}]")
            return
        if self.get_y() > 155:
            self.add_page()
        self.ln(2)
        usable = self.w - self.l_margin - self.r_margin
        self.image(str(path), x=self.l_margin, w=usable)
        self.ln(2)
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(*MUTED)
        self.set_x(self.l_margin)
        self.multi_cell(0, 5, T(caption), align="C")
        self.ln(3)

    def table(self, headers, rows):
        self.set_x(self.l_margin)
        usable = self.w - self.l_margin - self.r_margin
        col_w = usable / len(headers)
        self.set_font("Helvetica", "B", 9)
        self.set_fill_color(*NAVY)
        self.set_text_color(255, 255, 255)
        for h in headers:
            self.cell(col_w, 8, T(h)[:28], border=0, fill=True, align="C")
        self.ln()
        self.set_font("Helvetica", "", 9)
        fill = False
        for row in rows:
            self.set_x(self.l_margin)
            self.set_fill_color(*(LIGHT if fill else (255, 255, 255)))
            self.set_text_color(*TEXT)
            for cell in row:
                self.cell(col_w, 7.2, T(str(cell))[:32], border="B", fill=True)
            self.ln()
            fill = not fill
        self.ln(4)


def write_cover(pdf: Thesis):
    pdf._front_matter = True
    pdf.add_page()
    pdf.ln(10)
    if pdf.lang == "en":
        pdf.center("KINGDOM OF MOROCCO", size=11, bold=True, color=NAVY)
        pdf.center("Ministry of Higher Education", size=10, color=SLATE)
        pdf.center("Engineering Sciences — Computer / Software Engineering", size=10, color=SLATE)
        pdf.ln(8)
        pdf.set_draw_color(*TEAL)
        pdf.set_line_width(1.0)
        pdf.line(55, pdf.get_y(), 155, pdf.get_y())
        pdf.ln(12)
        pdf.center("FINAL YEAR ENGINEERING PROJECT (PFE)", size=12, bold=True, color=MUTED)
        pdf.ln(8)
        pdf.center("MyHeath", size=28, bold=True, color=NAVY)
        pdf.ln(2)
        pdf.center("Telemedicine & connected health platform", size=13, color=SLATE)
        pdf.ln(5)
        pdf.center("ASP.NET Core 8  ·  React  ·  MongoDB  ·  Docker", size=10, color=TEAL)
        pdf.ln(14)
        pdf.center(f"Author / Student: {AUTHOR}", size=12, bold=True, color=NAVY)
        pdf.ln(4)
        pdf.center("Academic year 2025 — 2026", size=11, color=TEXT)
        pdf.ln(8)
        pdf.center("Technical report for the examination board", size=9, color=MUTED)
    else:
        pdf.center("ROYAUME DU MAROC", size=11, bold=True, color=NAVY)
        pdf.center("Ministere de l'Enseignement Superieur", size=10, color=SLATE)
        pdf.center("Sciences de l'Ingenieur — Genie Informatique", size=10, color=SLATE)
        pdf.ln(8)
        pdf.set_draw_color(*TEAL)
        pdf.set_line_width(1.0)
        pdf.line(55, pdf.get_y(), 155, pdf.get_y())
        pdf.ln(12)
        pdf.center("PROJET DE FIN D'ETUDES", size=12, bold=True, color=MUTED)
        pdf.ln(8)
        pdf.center("MyHeath", size=28, bold=True, color=NAVY)
        pdf.ln(2)
        pdf.center("Plateforme de telemedecine et sante connectee", size=13, color=SLATE)
        pdf.ln(5)
        pdf.center("ASP.NET Core 8  ·  React  ·  MongoDB  ·  Docker", size=10, color=TEAL)
        pdf.ln(14)
        pdf.center(f"Realise par : {AUTHOR}", size=12, bold=True, color=NAVY)
        pdf.ln(4)
        pdf.center("Annee universitaire 2025 — 2026", size=11, color=TEXT)
        pdf.ln(8)
        pdf.center("Document a destination du jury / encadrant", size=9, color=MUTED)


def write_abstract(pdf: Thesis):
    pdf._front_matter = True
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(*NAVY)
    pdf.cell(0, 10, T("Resume / Abstract"), new_x="LMARGIN", new_y="NEXT")
    pdf.set_draw_color(*TEAL)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.l_margin + 40, pdf.get_y())
    pdf.ln(8)
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(*TEAL)
    pdf.cell(0, 8, T("Resume (FR)"), new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10.5)
    pdf.set_text_color(*TEXT)
    pdf.multi_cell(
        0, 6,
        T(
            f"MyHeath est une plateforme de telemedecine (sante feminine et masculine) avec suivi "
            f"quotidien, diabete, cycle, messagerie chiffree, coach IA et administration. "
            f"Ce rapport presente le backend ASP.NET Core 8 realise par {AUTHOR}, avec React et MongoDB, "
            f"Docker et deploiement cloud."
        ),
        align="J",
    )
    pdf.ln(6)
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(*TEAL)
    pdf.cell(0, 8, T("Abstract (EN)"), new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10.5)
    pdf.set_text_color(*TEXT)
    pdf.multi_cell(
        0, 6,
        T(
            f"MyHeath is a telemedicine platform for women's and men's health tracking, diabetes care, "
            f"encrypted messaging, AI coaching and admin subscriptions. This report documents the "
            f"ASP.NET Core 8 backend authored by {AUTHOR}, keeping React and MongoDB, with Docker "
            f"and cloud deployment guidance."
        ),
        align="J",
    )
    pdf.ln(8)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(*NAVY)
    pdf.cell(0, 8, T("Keywords / Mots-cles"), new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(*SLATE)
    pdf.multi_cell(0, 6, T("ASP.NET Core 8, React, MongoDB, Docker, JWT, AES-256, telemedicine, Claude AI"))


def write_toc(pdf: Thesis, toc_entries, page_offset: int):
    pdf._front_matter = True
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(*NAVY)
    pdf.cell(0, 10, T(pdf.toc_title), new_x="LMARGIN", new_y="NEXT")
    pdf.set_draw_color(*TEAL)
    pdf.set_line_width(0.8)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.l_margin + 50, pdf.get_y())
    pdf.ln(8)

    usable = pdf.w - pdf.l_margin - pdf.r_margin
    for level, title, page in toc_entries:
        display_page = page + page_offset
        indent = 0 if level == 1 else 8
        pdf.set_font("Helvetica", "B" if level == 1 else "", 11 if level == 1 else 10)
        pdf.set_text_color(*NAVY if level == 1 else TEXT)
        label = T(title)
        page_str = str(display_page)
        pdf.set_x(pdf.l_margin + indent)
        tw = pdf.get_string_width(label)
        pw = pdf.get_string_width(page_str)
        max_w = usable - indent - 10
        dots_w = max_w - tw - pw - 2
        dots = "." * max(int(dots_w / max(pdf.get_string_width("."), 0.1)), 3) if dots_w > 4 else "..."
        pdf.cell(tw + 1, 7.5, label)
        pdf.set_text_color(*MUTED)
        pdf.cell(dots_w, 7.5, dots)
        pdf.set_text_color(*NAVY if level == 1 else TEXT)
        pdf.cell(pw + 2, 7.5, page_str, align="R", new_x="LMARGIN", new_y="NEXT")
        if level == 1:
            pdf.ln(0.8)


def write_body_fr(pdf: Thesis):
    pdf.h1("1. Introduction et contexte")
    pdf.h2("1.1 Problematique")
    pdf.p(
        "L'acces a un suivi de sante continu reste fragmenté. MyHeath centralise le parcours "
        "patient-medecin-administrateur autour d'une API securisee et d'une interface dashboard."
    )
    pdf.h2("1.2 Objectifs du projet")
    pdf.bullet("API REST professionnelle en ASP.NET Core 8")
    pdf.bullet("Frontend React conserve (contrat /api compatible)")
    pdf.bullet("Persistance MongoDB + chiffrement AES-256-CBC + JWT")
    pdf.bullet("RDV, rappels medicaments, notifications, audit admin")
    pdf.bullet("Docker et deploiement cloud documentes")
    pdf.h2("1.3 Pourquoi ASP.NET Core")
    pdf.p(
        "ASP.NET Core 8 s'aligne sur les competences C# / Web API / DI / JWT. "
        f"Le projet est realise par {AUTHOR}."
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
    pdf.bullet("Auth + RBAC patient | doctor | admin")
    pdf.bullet("Suivi quotidien + score 0-100, periodes, diabete")
    pdf.bullet("Dossier et chat chiffres, AI Coach Claude")
    pdf.bullet("Abonnements FREE / CARE / PREMIUM")
    pdf.h2("2.3 Exigences non fonctionnelles")
    pdf.bullet("Securite JWT / BCrypt / AES, Docker, Swagger")
    pdf.fig("fig_2_3_usecase.png", "Figure 2.3 — Diagramme de cas d'utilisation")

    pdf.h1("3. Architecture technique")
    pdf.h2("3.1 Vue d'ensemble")
    pdf.p("Architecture 3-tiers: React -> ASP.NET Core -> MongoDB (VITE_API_URL).")
    pdf.fig("fig_2_1_architecture.png", "Figure 2.1 — Architecture 3-tiers MyHeath")
    pdf.h2("3.2 Stack")
    pdf.table(
        ["Couche", "Technologies"],
        [
            ["Backend", "ASP.NET Core 8, C#, MongoDB.Driver, JWT"],
            ["Frontend", "React 18, Vite, Tailwind, Axios"],
            ["Donnees", "MongoDB 7 / Atlas"],
            ["Ops", "Docker Compose, Vercel, Azure"],
        ],
    )
    pdf.h2("3.3 Structure projet")
    pdf.code("backend-dotnet/MyHeath.Api/\n  Controllers/ Services/ Models/ Program.cs\ndocker-compose.dotnet.yml")
    pdf.h2("3.4 Compatibilite Node")
    pdf.p("Meme contrat /api/* ; bascule Node:5000 ou .NET:5080 via VITE_API_URL.")

    pdf.h1("4. Conception detaillee")
    pdf.h2("4.1 Modele MongoDB")
    pdf.bullet("users, healthrecords, symptomlogs, dailyhealthlogs, messages")
    pdf.bullet("subscriptionplans, appointments, notifications, auditlogs")
    pdf.fig("fig_2_6_class.png", "Figure 2.6 — Modele de domaines")
    pdf.h2("4.2 AES-256-CBC")
    pdf.p("Champs sensibles et messages chiffres (iv_hex:ciphertext_hex, cle SHA-256).")
    pdf.fig("fig_2_7_aes.png", "Figure 2.7 — Chiffrement AES-256-CBC")
    pdf.h2("4.3 Analyse predictive")
    pdf.p("HealthScoreService (0-100) et CycleAnalyzer (phase, ovulation, anomalies).")
    pdf.fig("fig_2_8_predictive.png", "Figure 2.8 — Pipeline predictif")

    pdf.h1("5. Realisation backend .NET")
    pdf.h2("5.1 Authentification")
    pdf.p("BCrypt cost 12, JWT HMAC-SHA256 7 jours, [Authorize(Roles=...)].")
    pdf.fig("fig_2_4_sequence_login.png", "Figure 2.4 — Sequence authentification")
    pdf.h2("5.2 Modules")
    pdf.bullet("Health, Suivi, Chat, AI, Admin, Appointments, Medications, Notifications")
    pdf.fig("fig_2_5_sequence_insights.png", "Figure 2.5 — Sequence insights")
    pdf.h2("5.3 Enhancements")
    pdf.table(
        ["Fonctionnalite", "Endpoint"],
        [
            ["Rendez-vous", "/api/appointments"],
            ["Notifications", "/api/notifications"],
            ["Medicaments", "/api/medications"],
            ["Audit", "/api/admin/audit"],
            ["Swagger", "/swagger"],
        ],
    )
    pdf.fig("fig_3_1_backend.png", "Figure 3.1 — Organisation backend")
    pdf.fig("fig_3_3_routes.png", "Figure 3.3 — Routes API")
    pdf.fig("fig_2_9_ai.png", "Figure 2.9 — AI Coach Claude")

    pdf.h1("6. Frontend React")
    pdf.p("Dashboard sidebar: Admin, Suivi, Period, Diabetes, Medications, AI, RDV, Chat.")
    pdf.bullet(f"Auteur du livrable: {AUTHOR}")

    pdf.h1("7. Docker et deploiement")
    pdf.h2("7.1 Conteneurisation")
    pdf.code(
        "docker compose -f docker-compose.dotnet.yml up --build\n"
        "# API http://localhost:5080/api/healthcheck\n"
        "# UI  http://localhost:5173"
    )
    pdf.fig("fig_2_2_deployment.png", "Figure 2.2 — Deploiement")
    pdf.h2("7.2 Variables d'environnement")
    pdf.bullet("MONGODB_URI, JWT_SECRET, AES_SECRET_KEY, CLIENT_URL, ANTHROPIC_API_KEY")
    pdf.h2("7.3 Cloud")
    pdf.p("Frontend Vercel, API Docker/Azure, MongoDB Atlas. Secrets hors Git.")

    pdf.h1("8. Tests et comptes demo")
    pdf.table(
        ["Role", "Email", "Mot de passe"],
        [
            ["Admin", "admin@myheath.app", "Admin123"],
            ["Medecin", "doctor@myheath.app", "Doctor123"],
            ["Patient", "patient@myheath.app", "Patient123"],
        ],
    )
    pdf.h2("8.1 Scenarios")
    pdf.bullet("Admin abonnements · Patient suivi/RDV · Chat chiffre · AI Coach")

    pdf.h1("9. Comparaison Node.js vs ASP.NET Core")
    pdf.table(
        ["Critere", "Node.js", "ASP.NET Core"],
        [
            ["Langage", "JavaScript", "C#"],
            ["Docs", "Manuelle", "Swagger"],
            ["PFE", "MERN", "Stack .NET enseignee"],
        ],
    )

    pdf.h1("10. Securite")
    pdf.bullet("HTTPS, secrets env, CORS, RBAC, AES, disclaimer IA")
    pdf.p("Alignement bonnes pratiques Loi 09-08 / RGPD.")

    pdf.h1("11. Conclusion")
    pdf.p(
        f"Ce PFE demontre une API telemedecine ASP.NET Core 8 realisee par {AUTHOR}, "
        "avec React, MongoDB, Docker et deploiement cloud. Perspectives: SignalR, paiements, mobile."
    )
    pdf.h2("11.1 Livrables")
    pdf.bullet("Code GitHub: https://github.com/salahEddine-Admou/MyHeath")
    pdf.bullet("GUIDE_INSTALLATION.md · docs/RAPPORT_PFE_MYHEATH_DOTNET.pdf")
    pdf.bullet(f"Realisatrice: {AUTHOR}")

    pdf.h1("Annexe A — Requetes")
    pdf.code('POST /api/auth/login\n{ "email": "patient@myheath.app", "password": "Patient123" }')
    pdf.h1("Annexe B — Checklist Docker")
    pdf.bullet("Docker Desktop · clone · compose up --build · healthcheck · login")
    pdf.h1("Annexe C — Glossaire")
    for term, defn in [
        ("JWT", "JSON Web Token"),
        ("AES", "Chiffrement symetrique"),
        ("RBAC", "Controle d'acces par roles"),
        ("Swagger", "Documentation OpenAPI"),
    ]:
        pdf.bullet(f"{term}: {defn}")


def write_body_en(pdf: Thesis):
    pdf.h1("1. Introduction and context")
    pdf.h2("1.1 Problem statement")
    pdf.p(
        "Continuous health tracking is often fragmented. MyHeath unifies the patient–doctor–admin "
        "journey behind a secure API and a modern dashboard UI."
    )
    pdf.h2("1.2 Project objectives")
    pdf.bullet("Professional REST API with ASP.NET Core 8")
    pdf.bullet("Keep the existing React frontend (/api contract)")
    pdf.bullet("MongoDB persistence + AES-256-CBC + JWT")
    pdf.bullet("Appointments, medication reminders, notifications, admin audit")
    pdf.bullet("Document Docker and cloud deployment")
    pdf.h2("1.3 Why ASP.NET Core")
    pdf.p(
        "ASP.NET Core 8 matches taught C# / Web API / DI / JWT skills. "
        f"This deliverable is authored by {AUTHOR}."
    )

    pdf.h1("2. Requirements analysis")
    pdf.h2("2.1 Actors")
    pdf.table(
        ["Actor", "Main responsibilities"],
        [
            ["Patient", "Tracking, diabetes, AI, appointments, meds"],
            ["Doctor", "Consultations, appointments, messaging"],
            ["Administrator", "Users, plans, subscriptions, audit"],
        ],
    )
    pdf.h2("2.2 Functional requirements")
    pdf.bullet("Auth + RBAC patient | doctor | admin")
    pdf.bullet("Daily tracking + 0–100 score, periods, diabetes")
    pdf.bullet("Encrypted records/chat, Claude AI Coach")
    pdf.bullet("Subscriptions FREE / CARE / PREMIUM")
    pdf.h2("2.3 Non-functional requirements")
    pdf.bullet("JWT / BCrypt / AES security, Docker, Swagger")
    pdf.fig("fig_2_3_usecase.png", "Figure 2.3 — Use case diagram")

    pdf.h1("3. Technical architecture")
    pdf.h2("3.1 Overview")
    pdf.p("3-tier architecture: React → ASP.NET Core → MongoDB (VITE_API_URL).")
    pdf.fig("fig_2_1_architecture.png", "Figure 2.1 — MyHeath 3-tier architecture")
    pdf.h2("3.2 Stack")
    pdf.table(
        ["Layer", "Technologies"],
        [
            ["Backend", "ASP.NET Core 8, C#, MongoDB.Driver, JWT"],
            ["Frontend", "React 18, Vite, Tailwind, Axios"],
            ["Data", "MongoDB 7 / Atlas"],
            ["Ops", "Docker Compose, Vercel, Azure"],
        ],
    )
    pdf.h2("3.3 Project structure")
    pdf.code("backend-dotnet/MyHeath.Api/\n  Controllers/ Services/ Models/ Program.cs\ndocker-compose.dotnet.yml")
    pdf.h2("3.4 Node compatibility")
    pdf.p("Same /api/* contract; switch Node:5000 or .NET:5080 via VITE_API_URL.")

    pdf.h1("4. Detailed design")
    pdf.h2("4.1 MongoDB model")
    pdf.bullet("users, healthrecords, symptomlogs, dailyhealthlogs, messages")
    pdf.bullet("subscriptionplans, appointments, notifications, auditlogs")
    pdf.fig("fig_2_6_class.png", "Figure 2.6 — Domain model")
    pdf.h2("4.2 AES-256-CBC")
    pdf.p("Sensitive fields and messages encrypted (iv_hex:ciphertext_hex, SHA-256 key).")
    pdf.fig("fig_2_7_aes.png", "Figure 2.7 — AES-256-CBC encryption")
    pdf.h2("4.3 Predictive analysis")
    pdf.p("HealthScoreService (0–100) and CycleAnalyzer (phase, ovulation, anomalies).")
    pdf.fig("fig_2_8_predictive.png", "Figure 2.8 — Predictive pipeline")

    pdf.h1("5. .NET backend implementation")
    pdf.h2("5.1 Authentication")
    pdf.p("BCrypt cost 12, JWT HMAC-SHA256 for 7 days, [Authorize(Roles=...)].")
    pdf.fig("fig_2_4_sequence_login.png", "Figure 2.4 — Authentication sequence")
    pdf.h2("5.2 Modules")
    pdf.bullet("Health, Suivi, Chat, AI, Admin, Appointments, Medications, Notifications")
    pdf.fig("fig_2_5_sequence_insights.png", "Figure 2.5 — Insights sequence")
    pdf.h2("5.3 Enhancements")
    pdf.table(
        ["Feature", "Endpoint"],
        [
            ["Appointments", "/api/appointments"],
            ["Notifications", "/api/notifications"],
            ["Medications", "/api/medications"],
            ["Audit", "/api/admin/audit"],
            ["Swagger", "/swagger"],
        ],
    )
    pdf.fig("fig_3_1_backend.png", "Figure 3.1 — Backend organization")
    pdf.fig("fig_3_3_routes.png", "Figure 3.3 — API routes")
    pdf.fig("fig_2_9_ai.png", "Figure 2.9 — Claude AI Coach")

    pdf.h1("6. React frontend")
    pdf.p("Sidebar dashboard: Admin, Suivi, Period, Diabetes, Medications, AI, Appointments, Chat.")
    pdf.bullet(f"Deliverable author: {AUTHOR}")

    pdf.h1("7. Docker and deployment")
    pdf.h2("7.1 Containerization")
    pdf.code(
        "docker compose -f docker-compose.dotnet.yml up --build\n"
        "# API http://localhost:5080/api/healthcheck\n"
        "# UI  http://localhost:5173"
    )
    pdf.fig("fig_2_2_deployment.png", "Figure 2.2 — Deployment topology")
    pdf.h2("7.2 Environment variables")
    pdf.bullet("MONGODB_URI, JWT_SECRET, AES_SECRET_KEY, CLIENT_URL, ANTHROPIC_API_KEY")
    pdf.h2("7.3 Cloud")
    pdf.p("Frontend on Vercel, API via Docker/Azure, MongoDB Atlas. Never commit secrets.")

    pdf.h1("8. Testing and demo accounts")
    pdf.table(
        ["Role", "Email", "Password"],
        [
            ["Admin", "admin@myheath.app", "Admin123"],
            ["Doctor", "doctor@myheath.app", "Doctor123"],
            ["Patient", "patient@myheath.app", "Patient123"],
        ],
    )
    pdf.h2("8.1 Validation scenarios")
    pdf.bullet("Admin subscriptions · Patient tracking/appointments · Encrypted chat · AI Coach")

    pdf.h1("9. Node.js vs ASP.NET Core")
    pdf.table(
        ["Criterion", "Node.js", "ASP.NET Core"],
        [
            ["Language", "JavaScript", "C#"],
            ["API docs", "Manual", "Swagger"],
            ["PFE fit", "MERN", "Taught .NET stack"],
        ],
    )

    pdf.h1("10. Security")
    pdf.bullet("HTTPS, env secrets, CORS, RBAC, AES, AI non-diagnostic disclaimer")
    pdf.p("Aligned with Moroccan Law 09-08 / GDPR good practices.")

    pdf.h1("11. Conclusion")
    pdf.p(
        f"This PFE demonstrates a telemedicine ASP.NET Core 8 API authored by {AUTHOR}, "
        "with React, MongoDB, Docker and cloud deployment. Next steps: SignalR, payments, mobile."
    )
    pdf.h2("11.1 Deliverables")
    pdf.bullet("GitHub: https://github.com/salahEddine-Admou/MyHeath")
    pdf.bullet("GUIDE_INSTALLATION.md · docs/RAPPORT_PFE_MYHEATH_DOTNET_EN.pdf")
    pdf.bullet(f"Author: {AUTHOR}")

    pdf.h1("Appendix A — Sample requests")
    pdf.code('POST /api/auth/login\n{ "email": "patient@myheath.app", "password": "Patient123" }')
    pdf.h1("Appendix B — Docker checklist")
    pdf.bullet("Docker Desktop · clone · compose up --build · healthcheck · login")
    pdf.h1("Appendix C — Glossary")
    for term, defn in [
        ("JWT", "JSON Web Token"),
        ("AES", "Symmetric encryption"),
        ("RBAC", "Role-based access control"),
        ("Swagger", "OpenAPI documentation"),
    ]:
        pdf.bullet(f"{term}: {defn}")


def build(lang: str):
    write_body = write_body_en if lang == "en" else write_body_fr

    # Pass 1
    p1 = Thesis(lang)
    write_cover(p1)
    write_abstract(p1)
    front = p1.page_no()
    write_body(p1)
    toc_entries = list(p1._toc)

    toc_pages = 2
    page_offset = toc_pages

    # Pass 2
    pdf = Thesis(lang)
    write_cover(pdf)
    write_abstract(pdf)
    write_toc(pdf, toc_entries, page_offset=page_offset)
    while pdf.page_no() < front + toc_pages:
        pdf.add_page()
        pdf._front_matter = True
    write_body(pdf)

    name = "RAPPORT_PFE_MYHEATH_DOTNET_EN.pdf" if lang == "en" else "RAPPORT_PFE_MYHEATH_DOTNET.pdf"
    out = OUT / name
    pdf.output(str(out))
    print("Wrote", out, "pages=", pdf.page_no(), "author=", AUTHOR)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lang", choices=["fr", "en", "both"], default="both")
    args = ap.parse_args()
    if args.lang in ("fr", "both"):
        build("fr")
    if args.lang in ("en", "both"):
        build("en")


if __name__ == "__main__":
    main()
