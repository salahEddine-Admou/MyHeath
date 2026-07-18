#!/usr/bin/env python3
"""
MyHeath PFE report (ASP.NET Core) — complete FR + EN versions.
Author: Nezha Fekoussa | Supervisor: Salah Eddine Admou
Built-in PDF cover (no Word page de garde).
"""

from __future__ import annotations

import argparse
from pathlib import Path

from fpdf import FPDF

from rapport_dotnet_body_en import write_body_en
from rapport_ui_gallery import write_ui_gallery
from rapport_catalog import write_tech_catalog, write_features_catalog

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs"
FIGS = OUT / "figures"
OUT.mkdir(exist_ok=True)
LOGO_SRC = ROOT / "logo.webp"
LOGO_PNG = FIGS / "enset_logo.png"

AUTHOR = "Nezha Fekoussa"
SUPERVISOR = "Salah Eddine Admou"
YEAR = "2025 — 2026"
SCHOOL_FR = "ENSET Mohammedia — Universite Hassan II de Casablanca"
SCHOOL_EN = "ENSET Mohammedia — Hassan II University of Casablanca"


def ensure_school_logo() -> Path | None:
    """Convert root logo.webp to PNG for the PDF cover (school logo)."""
    if not LOGO_SRC.exists():
        return LOGO_PNG if LOGO_PNG.exists() else None
    try:
        from PIL import Image

        FIGS.mkdir(parents=True, exist_ok=True)
        with Image.open(LOGO_SRC) as im:
            im.convert("RGBA").save(LOGO_PNG, "PNG")
        return LOGO_PNG
    except Exception:
        return LOGO_PNG if LOGO_PNG.exists() else None


NAVY = (27, 54, 93)
TEAL = (15, 118, 110)
SLATE = (51, 65, 85)
TEXT = (30, 41, 59)
MUTED = (100, 116, 139)
LINE = (203, 213, 225)
LIGHT = (248, 250, 252)

HEADER_Y = 10
HEADER_LINE_Y = 16
TOP_MARGIN = 24
BOTTOM_MARGIN = 20


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
            self.header_label = "MyHeath — Final Year Project  |  ASP.NET Core · React · MongoDB"
            self.page_label = "Page"
            self.toc_title = "Table of contents"
        else:
            self.header_label = "MyHeath — Rapport PFE  |  ASP.NET Core · React · MongoDB"
            self.page_label = "Page"
            self.toc_title = "Table des matieres"

    def header(self):
        if self._front_matter:
            return
        self.set_xy(self.l_margin, HEADER_Y)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*MUTED)
        self.cell(self.w - self.l_margin - self.r_margin, 5, T(self.header_label), align="L")
        self.set_draw_color(*LINE)
        self.set_line_width(0.35)
        self.line(self.l_margin, HEADER_LINE_Y, self.w - self.r_margin, HEADER_LINE_Y)
        self.set_y(TOP_MARGIN)

    def footer(self):
        self.set_draw_color(*LINE)
        self.set_line_width(0.35)
        self.line(self.l_margin, self.h - 16, self.w - self.r_margin, self.h - 16)
        self.set_xy(self.l_margin, self.h - 12)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*MUTED)
        self.cell(
            self.w - self.l_margin - self.r_margin,
            6,
            T(f"{self.page_label} {self.page_no()}"),
            align="C",
        )

    def h1(self, text: str, record: bool = True):
        self.add_page()
        self._front_matter = False
        if record:
            self._toc.append((1, text, self.page_no()))
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

    def h3(self, text: str):
        self.set_x(self.l_margin)
        self.ln(2)
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*SLATE)
        self.multi_cell(0, 6, T(text))
        self.ln(1)

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

    def info_box(self, lines: list[str]):
        self.set_x(self.l_margin)
        self.set_fill_color(*LIGHT)
        self.set_draw_color(*TEAL)
        self.set_line_width(0.5)
        y = self.get_y()
        h = 10 + 6.5 * len(lines)
        self.rect(self.l_margin, y, self.w - self.l_margin - self.r_margin, h, style="DF")
        self.set_xy(self.l_margin + 4, y + 3)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*TEXT)
        for line in lines:
            self.cell(0, 6.5, T(line), new_x="LMARGIN", new_y="NEXT")
            self.set_x(self.l_margin + 4)
        self.set_y(y + h + 4)

    def fig(self, name: str, caption: str, *, folder: str | None = None, max_h: float = 150):
        path = (FIGS / folder / name) if folder else (FIGS / name)
        if not path.exists():
            self.p(f"[Missing figure: {name}]")
            return
        if self.get_y() > 110:
            self.add_page()
        self.ln(2)
        usable = self.w - self.l_margin - self.r_margin
        w, h = usable, None
        try:
            from PIL import Image

            with Image.open(path) as im:
                iw, ih = im.size
            aspect = ih / max(iw, 1)
            h = usable * aspect
            if h > max_h:
                h = max_h
                w = h / aspect
        except Exception:
            h = None
        x = self.l_margin + (usable - w) / 2
        if h is None:
            self.image(str(path), x=self.l_margin, w=usable)
        else:
            self.image(str(path), x=x, w=w, h=h)
        self.ln(2)
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(*MUTED)
        self.set_x(self.l_margin)
        self.multi_cell(0, 5, T(caption), align="C")
        self.ln(3)

    def ui(self, name: str, caption: str):
        """Screenshot from live Vercel UI (docs/figures/ui/)."""
        self.fig(name, caption, folder="ui", max_h=145)

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
    # Top band
    pdf.set_fill_color(*NAVY)
    pdf.rect(0, 0, pdf.w, 22, style="F")
    pdf.set_y(7)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 10)
    if pdf.lang == "en":
        pdf.cell(0, 5, T("KINGDOM OF MOROCCO"), align="C", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 8)
        pdf.cell(0, 4, T("Higher Education — Engineering Degree"), align="C", new_x="LMARGIN", new_y="NEXT")
    else:
        pdf.cell(0, 5, T("ROYAUME DU MAROC"), align="C", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 8)
        pdf.cell(0, 4, T("Enseignement Superieur — Diplome d'Ingenieur"), align="C", new_x="LMARGIN", new_y="NEXT")

    # School logo (logo.webp at repo root)
    logo = ensure_school_logo()
    pdf.set_y(28)
    if logo and logo.exists():
        logo_w = 72
        x = (pdf.w - logo_w) / 2
        pdf.image(str(logo), x=x, w=logo_w)
        pdf.ln(4)
    pdf.set_text_color(*NAVY)
    pdf.set_font("Helvetica", "B", 10)
    pdf.center(SCHOOL_EN if pdf.lang == "en" else SCHOOL_FR, size=10, bold=True, color=NAVY)

    pdf.ln(6)
    pdf.set_text_color(*MUTED)
    pdf.set_font("Helvetica", "B", 11)
    if pdf.lang == "en":
        pdf.center("FINAL YEAR ENGINEERING PROJECT (PFE)", size=11, bold=True, color=MUTED)
    else:
        pdf.center("PROJET DE FIN D'ETUDES (PFE)", size=11, bold=True, color=MUTED)

    pdf.ln(6)
    pdf.center("MyHeath", size=28, bold=True, color=NAVY)
    pdf.ln(2)
    if pdf.lang == "en":
        pdf.center("Design and implementation of a telemedicine", size=12, color=SLATE)
        pdf.center("and connected-health platform", size=12, color=SLATE)
    else:
        pdf.center("Conception et realisation d'une plateforme", size=12, color=SLATE)
        pdf.center("de telemedecine et de sante connectee", size=12, color=SLATE)

    pdf.ln(5)
    pdf.set_draw_color(*TEAL)
    pdf.set_line_width(1.2)
    pdf.line(70, pdf.get_y(), 140, pdf.get_y())
    pdf.ln(5)
    pdf.center("ASP.NET Core 8  ·  React  ·  MongoDB  ·  Docker", size=11, color=TEAL)

    pdf.ln(10)
    if pdf.lang == "en":
        pdf.info_box(
            [
                f"Author / Student :  {AUTHOR}",
                f"Academic supervisor :  {SUPERVISOR}",
                f"Institution :  {SCHOOL_EN}",
                f"Academic year :  {YEAR}",
                "Stack : ASP.NET Core 8, React, MongoDB, Docker, Claude AI",
                "Live UI : https://heracare.vercel.app",
            ]
        )
    else:
        pdf.info_box(
            [
                f"Realise par :  {AUTHOR}",
                f"Encadre par :  {SUPERVISOR}",
                f"Etablissement :  {SCHOOL_FR}",
                f"Annee universitaire :  {YEAR}",
                "Stack : ASP.NET Core 8, React, MongoDB, Docker, Claude AI",
                "UI live : https://heracare.vercel.app",
            ]
        )

    pdf.ln(8)
    if pdf.lang == "en":
        pdf.center("Submitted in partial fulfillment of the Engineering Degree", size=9, color=MUTED)
    else:
        pdf.center("Memoire soumis pour l'obtention du diplome d'Ingenieur d'Etat", size=9, color=MUTED)


def write_thanks(pdf: Thesis):
    pdf._front_matter = True
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(*NAVY)
    title = "Acknowledgments" if pdf.lang == "en" else "Remerciements"
    pdf.cell(0, 10, T(title), new_x="LMARGIN", new_y="NEXT")
    pdf.set_draw_color(*TEAL)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.l_margin + 40, pdf.get_y())
    pdf.ln(8)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(*TEXT)
    if pdf.lang == "en":
        pdf.multi_cell(
            0, 7,
            T(
                f"I sincerely thank my academic supervisor, {SUPERVISOR}, for continuous guidance, "
                f"technical advice and scientific rigor throughout this Final Year Project.\n\n"
                f"I also thank the faculty members who provided the foundations in software engineering, "
                f"databases and web technologies that made this work possible.\n\n"
                f"Finally, I thank my family and peers for their support during the design, "
                f"implementation and documentation of MyHeath.\n\n"
                f"— {AUTHOR}"
            ),
            align="J",
        )
    else:
        pdf.multi_cell(
            0, 7,
            T(
                f"Je tiens a remercier chaleureusement mon encadrant academique, {SUPERVISOR}, "
                f"pour son accompagnement, ses conseils techniques et sa rigueur scientifique "
                f"tout au long de ce Projet de Fin d'Etudes.\n\n"
                f"Mes remerciements s'adressent egalement aux enseignants qui m'ont transmis "
                f"les bases du genie logiciel, des bases de donnees et des technologies web.\n\n"
                f"Enfin, je remercie ma famille et mes camarades pour leur soutien durant "
                f"la conception, la realisation et la redaction de MyHeath.\n\n"
                f"— {AUTHOR}"
            ),
            align="J",
        )


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
            f"MyHeath est une plateforme de telemedecine orientee sante feminine et masculine. "
            f"Elle offre un suivi quotidien (score predictif), la gestion du cycle, le suivi du diabete, "
            f"une messagerie chiffree AES-256, un coach IA (Claude), la prise de rendez-vous, "
            f"des rappels medicaments et une console d'administration (utilisateurs, abonnements). "
            f"Ce memoire presente la version dont le backend est developpe en ASP.NET Core 8 (C#), "
            f"avec un frontend React et une base MongoDB. Le projet a ete realise par {AUTHOR}, "
            f"sous l'encadrement de {SUPERVISOR}. L'accent est mis sur l'architecture en couches, "
            f"la securite, Docker et le deploiement cloud."
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
            f"MyHeath is a telemedicine platform for women's and men's health: daily tracking, "
            f"cycle insights, diabetes care, AES-256 encrypted messaging, Claude AI coaching, "
            f"appointments, medication reminders and an admin console. This report documents the "
            f"ASP.NET Core 8 backend with React and MongoDB. The work was carried out by {AUTHOR}, "
            f"supervised by {SUPERVISOR}, with focus on layered architecture, security, Docker "
            f"and cloud deployment."
        ),
        align="J",
    )
    pdf.ln(8)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(*NAVY)
    pdf.cell(0, 8, T("Keywords"), new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(*SLATE)
    pdf.multi_cell(
        0, 6,
        T(
            "ASP.NET Core 8, C#, React, MongoDB, Docker, JWT, AES-256, RBAC, "
            "telemedicine, FemTech, Claude AI, Vercel, Azure"
        ),
    )


def write_list_of_figures(pdf: Thesis):
    pdf._front_matter = True
    pdf.add_page()
    title = "List of figures" if pdf.lang == "en" else "Liste des figures"
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(*NAVY)
    pdf.cell(0, 10, T(title), new_x="LMARGIN", new_y="NEXT")
    pdf.set_draw_color(*TEAL)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.l_margin + 40, pdf.get_y())
    pdf.ln(8)
    figs = [
        "2.1 Architecture 3-tiers",
        "2.2 Deployment topology (Docker / Cloud)",
        "2.3 Use case diagram",
        "2.4 Authentication sequence (JWT)",
        "2.5 Cycle insights sequence",
        "2.6 Domain model",
        "2.7 AES-256-CBC encryption",
        "2.8 Predictive health pipeline",
        "2.9 Claude AI Coach integration",
        "3.1 Backend organization (.NET)",
        "3.3 API route map",
        "6.1-6.15 Captures UI live (https://heracare.vercel.app)",
    ]
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(*TEXT)
    for f in figs:
        pdf.set_x(pdf.l_margin)
        pdf.cell(0, 8, T(f"Figure {f}"), new_x="LMARGIN", new_y="NEXT")


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
            pdf.ln(0.6)


def write_body_fr(pdf: Thesis):
    pdf.h1("1. Introduction et contexte")
    pdf.h2("1.0 Introduction du chapitre")
    pdf.p(
        "Ce chapitre introductif pose le cadre du Projet de Fin d'Etudes MyHeath: "
        "contexte de la telemedecine numerique, problematique de fragmentation des "
        "applications de sante, objectifs techniques (ASP.NET Core, React, MongoDB) "
        "et organisation du memoire. Il precise egalement le perimetre et les livrables "
        f"attendus, realises par {AUTHOR} sous l'encadrement de {SUPERVISOR}."
    )
    pdf.h2("1.1 Contexte general")
    pdf.p(
        "La transformation numerique de la sante accélère l'apparition de plateformes permettant "
        "un suivi a distance, la prevention et une meilleure coordination patient-medecin. "
        "Dans ce contexte, MyHeath propose une solution de telemedecine centree sur le bien-etre "
        "quotidien, le diabete, le cycle menstruel et l'accompagnement IA, tout en respectant "
        "des exigences fortes de confidentialite."
    )
    pdf.h2("1.2 Problematique")
    pdf.p(
        "Les applications grand public fragmentent souvent le parcours: une app pour le cycle, "
        "une autre pour la glycemie, une messagerie non medicale, peu de lien avec un medecin "
        "assigne. De plus, les donnees de sante exigent un chiffrement au repos et un controle "
        "d'acces strict (RBAC). MyHeath vise a unifier ces besoins dans une architecture "
        "moderne, documentee et deployable."
    )
    pdf.h2("1.3 Objectifs")
    pdf.bullet("Concevoir et developper une API REST en ASP.NET Core 8")
    pdf.bullet("Conserver une UI React professionnelle (dashboard a sidebar)")
    pdf.bullet("Persister les donnees dans MongoDB (local Docker ou Atlas)")
    pdf.bullet("Securiser l'acces (JWT, BCrypt, AES-256-CBC, roles)")
    pdf.bullet("Integrer un coach IA (Anthropic Claude) avec disclaimer non diagnostique")
    pdf.bullet("Ajouter RDV, notifications, rappels medicaments et audit admin")
    pdf.bullet("Industrialiser via Docker Compose et documenter le deploiement")
    pdf.h2("1.4 Perimetre et livrables")
    pdf.p(
        f"Le present memoire porte sur la version .NET du backend, realisee par {AUTHOR} "
        f"sous l'encadrement de {SUPERVISOR}. Un backend Node.js compatible reste disponible "
        "pour comparaison. Livrables: code source GitHub, rapports FR/EN, guide d'installation, "
        "figures UML."
    )
    pdf.h2("1.5 Organisation du memoire")
    pdf.p(
        "Le chapitre 2 analyse les besoins. Le chapitre 3 detaille l'architecture. "
        "Les chapitres 4 et 5 traitent conception et realisation. Le chapitre 6 presente "
        "le frontend. Le chapitre 7 couvre Docker et le deploiement. Les chapitres 8 a 11 "
        "abordent tests, comparaison, securite et conclusion."
    )
    pdf.h2("1.6 Conclusion du chapitre")
    pdf.p(
        "En resume, le chapitre 1 a motive le besoin d'une plateforme unifiee, securisee "
        "et demonstrable. Les objectifs (API .NET, UI React, chiffrement, IA, Docker) "
        "servent de fil conducteur aux chapitres suivants, a commencer par l'analyse "
        "detaillee des besoins."
    )

    pdf.h1("2. Analyse des besoins")
    pdf.h2("2.0 Introduction du chapitre")
    pdf.p(
        "Ce chapitre formalise les besoins de MyHeath: etude de l'existant, acteurs "
        "(patient, medecin, admin), exigences fonctionnelles (auth, suivi, telemedecine, "
        "admin) et non fonctionnelles (securite, portabilite, documentabilite). "
        "Il fournit le cahier des charges qui justifiera les choix d'architecture."
    )
    pdf.h2("2.1 Etude de l'existant")
    pdf.p(
        "De nombreuses applications proposent le suivi du cycle ou du diabete, mais rarement "
        "une combinaison telemedecine + dossier chiffre + abonnements + IA + administration "
        "dans un meme produit academique coherent. MyHeath se positionne comme plateforme "
        "integrée orientee PFE ingenierie logicielle."
    )
    pdf.h2("2.2 Acteurs")
    pdf.table(
        ["Acteur", "Objectifs principaux"],
        [
            ["Patient (F/H)", "Suivi, diabete, cycle, IA, RDV, medicaments"],
            ["Medecin", "Patients assignes, chat, RDV, consultation"],
            ["Administrateur", "Users, plans, abonnements, audit, stats"],
        ],
    )
    pdf.h2("2.3 Exigences fonctionnelles")
    pdf.h3("EF1 — Authentification et profils")
    pdf.bullet("Inscription / connexion JWT (7 jours)")
    pdf.bullet("Roles: patient, doctor, admin")
    pdf.bullet("Genre (woman/man) et profil diabete optionnel")
    pdf.h3("EF2 — Sante et suivi")
    pdf.bullet("Journal quotidien + score predictif 0-100")
    pdf.bullet("Periodes / insights (moyenne, ovulation, anomalies)")
    pdf.bullet("Dossier medical (allergies, traitements) chiffre")
    pdf.h3("EF3 — Telemedecine")
    pdf.bullet("Messagerie patient-medecin chiffree")
    pdf.bullet("Rendez-vous video / chat / presentiel")
    pdf.bullet("Notifications in-app")
    pdf.h3("EF4 — Administration et monetisation pedagogique")
    pdf.bullet("CRUD utilisateurs, plans FREE/CARE/PREMIUM")
    pdf.bullet("Assignation / annulation d'abonnements")
    pdf.bullet("Journal d'audit des actions admin")
    pdf.h2("2.4 Exigences non fonctionnelles")
    pdf.table(
        ["Critere", "Cible"],
        [
            ["Securite", "JWT + BCrypt12 + AES-256-CBC"],
            ["Portabilite", "Docker Compose multi-services"],
            ["Maintenabilite", "Controllers / Services / Models"],
            ["Documentabilité", "Swagger + rapport PFE"],
            ["Disponibilite demo", "Seed comptes + guide jury"],
        ],
    )
    pdf.fig("fig_2_3_usecase.png", "Figure 2.3 — Diagramme de cas d'utilisation")
    pdf.h2("2.5 Conclusion du chapitre")
    pdf.p(
        "Le chapitre 2 a cadre les acteurs et exigences. Les criteres de securite "
        "(JWT, BCrypt, AES) et de demo (seed, Swagger) imposent une architecture "
        "3-tiers claire, detaillee au chapitre suivant."
    )

    pdf.h1("3. Architecture technique")
    pdf.h2("3.0 Introduction du chapitre")
    pdf.p(
        "Ce chapitre presente l'architecture logique et physique de MyHeath: decoupage "
        "3-tiers, stack technologique, organisation du code ASP.NET Core, cartographie "
        "des routes /api et compatibilite volontaire avec le backend Node.js."
    )
    pdf.h2("3.1 Architecture logique 3-tiers")
    pdf.p(
        "MyHeath suit une architecture 3-tiers classique: presentation (React SPA), "
        "application (ASP.NET Core Web API), donnees (MongoDB). Les echanges se font en "
        "HTTPS/JSON. Le frontend utilise VITE_API_URL pour pointer vers l'API .NET (5080) "
        "ou Node (5000)."
    )
    pdf.fig("fig_2_1_architecture.png", "Figure 2.1 — Architecture 3-tiers MyHeath")
    pdf.h2("3.2 Stack technologique")
    pdf.table(
        ["Couche", "Choix techniques"],
        [
            ["Backend", "ASP.NET Core 8, C#, MongoDB.Driver, JWT Bearer"],
            ["Frontend", "React 18, Vite, Tailwind, Recharts, Axios"],
            ["Donnees", "MongoDB 7 (Compose) ou MongoDB Atlas"],
            ["IA", "Anthropic Claude (Messages API)"],
            ["Ops", "Docker multi-stage, Vercel (UI), Azure (option API)"],
        ],
    )
    write_tech_catalog(pdf, lang="fr")
    pdf.h2("3.3 Organisation du code .NET")
    pdf.code(
        "backend-dotnet/\n"
        "  MyHeath.Api/\n"
        "    Controllers/   Auth, Health, Suivi, Chat, Ai, Admin,\n"
        "                   Appointments, Notifications, Medications\n"
        "    Models/        User, DailyHealthLog, Message, Plan...\n"
        "    Services/      Mongo, AES, JWT, Claude, Seed, HealthScore\n"
        "    Program.cs     DI, CORS, Swagger, Authentication\n"
        "  Dockerfile\n"
        "docker-compose.dotnet.yml"
    )
    pdf.fig("fig_3_1_backend.png", "Figure 3.1 — Organisation du backend ASP.NET Core")
    pdf.h2("3.4 Cartographie API")
    pdf.p(
        "Toutes les routes sont prefixees par /api. Swagger est disponible sur /swagger "
        "pour faciliter les tests du jury et la validation des contrats."
    )
    pdf.fig("fig_3_3_routes.png", "Figure 3.3 — Cartographie des routes API")
    pdf.h2("3.5 Compatibilite avec le backend Node")
    pdf.p(
        "Le contrat JSON camelCase, la claim JWT id, et le format AES iv:ciphertext "
        "permettent de reutiliser le meme frontend. Cela illustre la separation "
        "interface / implementation, principe cle du genie logiciel."
    )
    pdf.h2("3.6 Conclusion du chapitre")
    pdf.p(
        "L'architecture retenue separe presentation, application et donnees, avec un "
        "contrat REST stable. Cette separation facilite le deploiement (Vercel + Docker) "
        "et prepare la conception detaillee des modeles, de la securite et des algorithmes."
    )

    pdf.h1("4. Conception detaillee")
    pdf.h2("4.0 Introduction du chapitre")
    pdf.p(
        "Ce chapitre descend au niveau conception: modele MongoDB, authentification JWT, "
        "chiffrement AES-256-CBC, et les deux pipelines predictifs (HealthScoreService "
        "et CycleAnalyzer). L'objectif est d'expliquer les choix avant le code des controllers."
    )
    pdf.h2("4.1 Modele de donnees")
    pdf.p(
        "MongoDB stocke des documents flexibles adaptes aux journaux de sante. "
        "Les collections principales sont: users, healthrecords, symptomlogs, "
        "dailyhealthlogs, messages, subscriptionplans, usersubscriptions, "
        "appointments, appnotifications, medicationreminders, auditlogs."
    )
    pdf.fig("fig_2_6_class.png", "Figure 2.6 — Modele de domaines (extrait)")
    pdf.h2("4.2 Securite applicative")
    pdf.h3("Authentification")
    pdf.p(
        "Les mots de passe sont hashes avec BCrypt (work factor 12). "
        "JwtTokenService emet un token HMAC-SHA256 valide 7 jours contenant id et role."
    )
    pdf.fig("fig_2_4_sequence_login.png", "Figure 2.4 — Sequence d'authentification JWT")
    pdf.h3("Chiffrement AES-256-CBC")
    pdf.p(
        "Les allergies, medicaments, notes cliniques et messages sont chiffres au repos. "
        "La cle derive d'un secret via SHA-256; le payload stocke iv_hex:ciphertext_hex, "
        "format compatible avec l'implementation Node."
    )
    pdf.fig("fig_2_7_aes.png", "Figure 2.7 — Pipeline de chiffrement AES-256-CBC")
    pdf.h2("4.3 Analyse predictive")
    pdf.p(
        "MyHeath expose deux pipelines predictifs distincts, tous deux deterministes "
        "(regles explicables, adaptes a une defense PFE) et non un unique enchainement lineaire."
    )
    pdf.h3("Pipeline A — Score bien-etre (HealthScoreService)")
    pdf.p(
        "Le patient saisit un journal via POST /api/suivi/daily. SuiviController realise un "
        "upsert MongoDB (collection dailyhealthlogs) puis appelle HealthScoreService.Compute. "
        "Les features extraites sont: sommeil (heures + qualite), energie, stress inverse, "
        "humeur, hydratation, activite (minutes + pas). Le profil User module les poids: "
        "recuperation et activite renforcee pour les hommes; penalites glycemie a jeun / "
        "postprandiale et bonus d'adherence medicamenteuse si hasDiabetes. Le resultat est "
        "un score 0-100 et un label (excellent, good, fair, low, concerning) affiche dans "
        "le dashboard Recharts."
    )
    pdf.h3("Pipeline B — Analyse de cycle (CycleAnalyzer)")
    pdf.p(
        "Les debuts de periodes et symptomes (douleur) sont journalises puis agreges par "
        "GET /api/health/insights. CycleAnalyzer calcule les longueurs inter-cycles, la "
        "moyenne (defaut 28 j), la prochaine regle, la fenetre d'ovulation (pic a J-14, "
        "+/-2 j), la phase courante (menstruelle / folliculaire / ovulatoire / luteale) et "
        "des anomalies (ecart-type > 7 j, douleur severe repetee). Si des anomalies existent, "
        "recommendConsultation = true pour alerter le patient / medecin."
    )
    pdf.fig("fig_2_8_predictive.png", "Figure 2.8 — Pipelines predictifs (score + cycle)")
    pdf.fig("fig_2_5_sequence_insights.png", "Figure 2.5 — Sequence calcul des insights")
    pdf.h2("4.4 Conclusion du chapitre")
    pdf.p(
        "La conception detaillee fixe un modele document, une securite en profondeur et "
        "des moteurs predictifs explicables. Le chapitre 5 traduit ces decisions en "
        "modules ASP.NET Core (controllers, services, seed)."
    )

    pdf.h1("5. Realisation backend ASP.NET Core")
    pdf.h2("5.0 Introduction du chapitre")
    pdf.p(
        "Ce chapitre decrit la realisation concrete de l'API: modules Auth, Sante/Suivi, "
        "Chat/IA, Administration, RDV, notifications et medicaments, ainsi que le "
        "SeedService pour la demonstration jury."
    )
    pdf.h2("5.1 Module Auth")
    pdf.p(
        "AuthController est le point d'entree identite. L'inscription valide l'unicite "
        "email (HTTP 409), restreint les roles publics a patient|doctor, hash le mot de "
        "passe (BCrypt 12) et persiste l'utilisateur. Le login verifie le hash et retourne "
        "{ token, user }. GET /me hydrate la session; /doctors alimente l'UI d'assignation; "
        "assign-doctor lie patient.doctorId."
    )
    pdf.bullet("POST /api/auth/register — roles patient|doctor uniquement")
    pdf.bullet("POST /api/auth/login — retourne token + user")
    pdf.bullet("GET /api/auth/me, /doctors — profil et liste medecins")
    pdf.bullet("POST /api/auth/assign-doctor — liaison patient-medecin")
    pdf.h2("5.2 Modules Sante et Suivi")
    pdf.p(
        "HealthController gere symptomes, periodes, insights (CycleAnalyzer) et dossier "
        "chiffre (encrypt a l'ecriture, decrypt a la lecture). SuiviController assure "
        "l'upsert quotidien (cle user+jour), appelle HealthScoreService, expose "
        "l'historique pour Recharts et la vue diabete (adherence, moyennes glycemie "
        "a jeun / postprandiale). Ces modules constituent le coeur metier patient."
    )
    pdf.h2("5.3 Chat et IA")
    pdf.p(
        "ChatController filtre les partenaires selon le role (patient↔medecin assigne, "
        "admin→tous) et chiffre le contenu des messages. AiController delegue a "
        "ClaudeService (HttpClient); coach/wellness sont reserves aux patients. "
        "Sans ANTHROPIC_API_KEY l'API repond 503 clairement. Un disclaimer rappelle "
        "le caractere educatif, non diagnostique, des reponses."
    )
    pdf.fig("fig_2_9_ai.png", "Figure 2.9 — Integration MyHeath AI Coach")
    pdf.h2("5.4 Administration et abonnements")
    pdf.p(
        "AdminController alimente la console: overview (utilisateurs, abonnements actifs, "
        "MRR estime), CRUD users/plans, assignation/annulation d'abonnements FREE/CARE/"
        "PREMIUM, et GET /api/admin/audit. AuditService journalise acteur, entite, action "
        "et detail pour la tracabilite pedagogique et la defense orale."
    )
    pdf.h2("5.5 Fonctionnalites avancees")
    pdf.p(
        "Au-dela du coeur sante, MyHeath ajoute la couche operationnelle telemedecine: "
        "prise de RDV (modes video/chat/presentiel) avec notification medecin, centre "
        "de notifications in-app, rappels medicaments patient, et Swagger pour explorer "
        "les contrats sans Postman."
    )
    pdf.table(
        ["Fonctionnalite", "Route", "Role"],
        [
            ["Rendez-vous", "/api/appointments", "patient/doctor/admin"],
            ["Notifications", "/api/notifications", "authentifie"],
            ["Rappels medicaments", "/api/medications", "patient"],
            ["Audit", "/api/admin/audit", "admin"],
            ["Swagger", "/swagger", "public (dev)"],
        ],
    )
    pdf.h2("5.6 Seed et comptes demo")
    pdf.p(
        "SeedService cree au demarrage admin, medecin, patients femme/homme et plans "
        "FREE/CARE/PREMIUM s'ils n'existent pas. Cela elimine la friction pour le jury: "
        "Compose up, ouvrir la SPA, se connecter avec les mots de passe documentes."
    )
    write_features_catalog(pdf, lang="fr")
    pdf.h2("5.9 Conclusion du chapitre")
    pdf.p(
        "Le backend .NET couvre l'ensemble du contrat fonctionnel avec une organisation "
        "Controllers/Services claire. Le chapitre 6 montre comment le frontend React "
        "consomme cette API, y compris via le deploiement live Vercel."
    )

    pdf.h1("6. Frontend React")
    pdf.h2("6.0 Introduction du chapitre")
    pdf.p(
        "Ce chapitre presente l'interface React (shell dashboard, navigation par role, "
        "integration Axios) et inclut des captures d'ecran reelles de l'application "
        "deployee sur Vercel (https://heracare.vercel.app), afin d'illustrer le rendu "
        "final pour le patient, le medecin et l'administrateur."
    )
    pdf.h2("6.1 Experience utilisateur")
    pdf.p(
        "L'interface adopte un shell dashboard: sidebar sombre, zone de contenu claire, "
        "navigation par role. Pages publiques: Landing (/), Login, Register. "
        "Patient: Dashboard (resume cycle + alertes), Suivi quotidien, Period (calendrier), "
        "Diabetes, Medications, AI Coach, Records (dossier), Appointments, Chat. "
        "Medecin: dashboard patients, RDV, messagerie. Admin: Overview, Users, "
        "Subscriptions, Plans (aussi via /admin?tab=...). Charts Recharts pour tendances "
        "et longueurs de cycle. Deploiement live: https://heracare.vercel.app."
    )
    pdf.h2("6.2 Integration API")
    pdf.p(
        "Axios centralise le Bearer token (localStorage myheath_token). "
        "Les services healthService, suiviService, adminService et extraService "
        "appellent les endpoints REST. VITE_API_URL selectionne le backend actif. "
        "En production, le frontend Vercel pointe vers l'API publique configuree."
    )
    pdf.h2("6.3 Points d'attention UX")
    pdf.bullet("Messages d'erreur clairs si l'API .NET n'est pas joignable")
    pdf.bullet("Disclaimer medical sur les ecrans IA")
    pdf.bullet("Responsive: drawer mobile pour la sidebar")
    write_ui_gallery(pdf, lang="fr")
    pdf.h2("6.5 Conclusion du chapitre")
    pdf.p(
        "Le frontend offre une experience role-aware coherent avec le backend. Les "
        "captures Vercel confirment que landing, dashboard, modules sante, chat, "
        "admin et espace medecin sont operationnels en conditions reelles."
    )

    pdf.h1("7. Docker et deploiement")
    pdf.h2("7.0 Introduction du chapitre")
    pdf.p(
        "Apres l'UI, ce chapitre traite l'industrialisation: Dockerfile multi-stage "
        ".NET, docker-compose.dotnet.yml, variables d'environnement, scenarios cloud "
        "(Vercel, Atlas, Azure) et documentation jury."
    )
    pdf.h2("7.1 Conteneurisation")
    pdf.p(
        "Le Dockerfile multi-stage compile avec le SDK .NET 8 puis execute "
        "sur l'image runtime aspnet:8.0 (port 5080). docker-compose.dotnet.yml "
        "orchestre MongoDB, l'API et le frontend."
    )
    pdf.code(
        "git clone https://github.com/salahEddine-Admou/MyHeath.git\n"
        "cd MyHeath\n"
        "docker compose -f docker-compose.dotnet.yml up --build\n"
        "# UI      http://localhost:5173\n"
        "# API     http://localhost:5080/api/healthcheck\n"
        "# Swagger http://localhost:5080/swagger"
    )
    pdf.fig("fig_2_2_deployment.png", "Figure 2.2 — Topologie de deploiement")
    pdf.h2("7.2 Variables d'environnement")
    pdf.table(
        ["Variable", "Role"],
        [
            ["MONGODB_URI", "Connexion MongoDB"],
            ["JWT_SECRET", "Signature des tokens"],
            ["AES_SECRET_KEY", "Derivation cle AES"],
            ["CLIENT_URL", "Origines CORS"],
            ["ANTHROPIC_API_KEY", "Coach IA (optionnel)"],
            ["PORT", "5080 par defaut"],
        ],
    )
    pdf.h2("7.3 Scenarios cloud")
    pdf.bullet("Frontend: Vercel (build Vite, VITE_API_URL publique)")
    pdf.bullet("API .NET: Azure App Service / Container Apps, Render, ou VM Docker")
    pdf.bullet("Donnees: MongoDB Atlas (URI srv)")
    pdf.bullet("Secrets: App Settings / variables d'environnement — jamais Git")
    pdf.h2("7.4 Guide jury")
    pdf.p(
        "Le fichier GUIDE_INSTALLATION.md et FOR_PROFESSOR.txt expliquent le demarrage "
        "local en quelques commandes, avec comptes de demonstration."
    )
    pdf.h2("7.5 Conclusion du chapitre")
    pdf.p(
        "Docker Compose et le guide d'installation rendent la plateforme reproductible. "
        "Le deploiement cloud (Vercel + Atlas) complete la demo locale. Le chapitre 8 "
        "valide ensuite le comportement fonctionnel et securitaire."
    )

    pdf.h1("8. Tests et validation")
    pdf.h2("8.0 Introduction du chapitre")
    pdf.p(
        "Ce chapitre decrit la strategie de validation: smoke tests, parcours "
        "fonctionnels, controles 401/403, comptes de demonstration et criteres "
        "d'acceptation pour le jury."
    )
    pdf.h2("8.1 Strategie de tests")
    pdf.p(
        "La validation privilegie la demonstrabilite de bout en bout et les controles "
        "de securite, compatibles avec le calendrier academique. Une suite CI automatisee "
        "reste une perspective explicite."
    )
    pdf.bullet("Smoke: GET /api/healthcheck")
    pdf.bullet("Fonctionnel: parcours login → suivi → RDV → admin abonnements")
    pdf.bullet("Securite: 401 sans token, 403 role insuffisant")
    pdf.bullet("Crypto: champs AES illisibles dans Mongo, lisibles apres API")
    pdf.bullet("Swagger: validation manuelle des DTO")
    pdf.bullet("Live: parcours sur https://heracare.vercel.app")
    pdf.h2("8.2 Comptes de demonstration")
    pdf.table(
        ["Role", "Email", "Mot de passe"],
        [
            ["Admin", "admin@myheath.app", "Admin123"],
            ["Medecin", "doctor@myheath.app", "Doctor123"],
            ["Patient F", "patient@myheath.app", "Patient123"],
            ["Patient H", "man@myheath.app", "Patient123"],
        ],
    )
    pdf.h2("8.3 Criteres d'acceptation")
    pdf.bullet("Compose up demarre sans erreur fatale")
    pdf.bullet("Login et navigation sidebar operationnels")
    pdf.bullet("Messages et dossier dechiffrables apres auth")
    pdf.bullet("Aucun secret dans le depot public")
    pdf.h2("8.4 Conclusion du chapitre")
    pdf.p(
        "Les tests manuels et les comptes seed confirment la demonstrabilite du systeme. "
        "Le chapitre 9 compare ensuite les deux backends pour justifier le choix .NET "
        "dans le cadre pedagogique du PFE."
    )

    pdf.h1("9. Comparaison Node.js et ASP.NET Core")
    pdf.h2("9.0 Introduction du chapitre")
    pdf.p(
        "Ce chapitre compare objectivement Node.js/Express et ASP.NET Core 8 derriere "
        "le meme contrat React, afin de mettre en evidence les apports du typage, de "
        "la DI et de Swagger pour un PFE C#."
    )
    pdf.p(
        "Les deux backends exposent le meme contrat. Node facilite le prototypage et "
        "le serverless Vercel; .NET apporte typage fort, DI native, Swagger et une "
        "adequation directe avec le cursus C#."
    )
    pdf.table(
        ["Critere", "Node.js / Express", "ASP.NET Core 8"],
        [
            ["Langage", "JavaScript", "C#"],
            ["Typage", "Dynamique", "Statique / compile"],
            ["Docs API", "Manuelle", "Swagger integre"],
            ["Temps reel", "Socket.io local", "SignalR (perspective)"],
            ["Docker", "node image", "mcr.microsoft.com/dotnet"],
            ["PFE", "MERN classique", "Stack .NET enseignee"],
        ],
    )
    pdf.h2("9.1 Conclusion du chapitre")
    pdf.p(
        "La double implementation valide le principe de separation interface/implementation. "
        "ASP.NET Core reste le livrable principal du memoire; Node sert de reference. "
        "Le chapitre 10 approfondit la posture securite et conformite."
    )

    pdf.h1("10. Securite et conformite")
    pdf.h2("10.0 Introduction du chapitre")
    pdf.p(
        "Ce chapitre synthetise les contre-mesures (HTTPS, JWT, BCrypt, AES, RBAC, audit, "
        "disclaimer IA) et situe MyHeath par rapport a la Loi 09-08 et aux principes RGPD."
    )
    pdf.h2("10.1 Contre-mesures")
    pdf.p(
        "La securite est appliquee a chaque couche: transport (HTTPS/CORS), "
        "authentification (JWT+BCrypt), confidentialite au repos (AES), autorisation "
        "(RBAC), tracabilite (audit) et usage responsable de l'IA (disclaimer)."
    )
    pdf.bullet("HTTPS en production, CORS restreint")
    pdf.bullet("JWT signe, expiration 7 jours, comptes isActive")
    pdf.bullet("AES-256-CBC pour donnees sensibles et chat")
    pdf.bullet("RBAC sur chaque controller")
    pdf.bullet("Audit des actions administrateur")
    pdf.bullet("Disclaimer IA: aide educative, pas un diagnostic")
    pdf.bullet("Secrets via variables d'environnement — jamais dans Git")
    pdf.h2("10.2 Conformite")
    pdf.p(
        "Le chiffrement au repos et la minimisation des donnees s'inscrivent dans "
        "les bonnes pratiques Loi 09-08 (Maroc) et les principes RGPD "
        "(integrite, confidentialite, limitation des finalites)."
    )
    pdf.h2("10.3 Conclusion du chapitre")
    pdf.p(
        "La securite est traitee comme exigence transverse, pas comme ajout tardif. "
        "Le chapitre 11 conclut le memoire et ouvre des perspectives d'evolution."
    )

    pdf.h1("11. Conclusion et perspectives")
    pdf.h2("11.0 Introduction du chapitre")
    pdf.p(
        "Ce chapitre de cloture dresse le bilan du PFE, propose des perspectives "
        "(SignalR, paiements, mobile, CI, observabilite) et rappelle les livrables "
        "GitHub, rapports et guides."
    )
    pdf.h2("11.1 Bilan")
    pdf.p(
        f"Ce PFE demontre la conception et la realisation d'une plateforme de telemedecine "
        f"complete. Le backend ASP.NET Core 8, develope par {AUTHOR} sous l'encadrement de "
        f"{SUPERVISOR}, s'integre a React et MongoDB, avec Docker, securite AES/JWT et "
        f"fonctions avancees (RDV, medicaments, abonnements, IA)."
    )
    pdf.h2("11.2 Perspectives")
    pdf.bullet("SignalR pour chat temps reel")
    pdf.bullet("Paiement reel des abonnements")
    pdf.bullet("Application mobile (React Native)")
    pdf.bullet("Tests unitaires/integration automatises en CI")
    pdf.bullet("Observabilite (OpenTelemetry / Application Insights)")
    pdf.h2("11.3 Livrables")
    pdf.bullet("Depot: https://github.com/salahEddine-Admou/MyHeath")
    pdf.bullet("Rapports: RAPPORT_PFE_MYHEATH_DOTNET.pdf / _EN.pdf")
    pdf.bullet("Guide: GUIDE_INSTALLATION.md")
    pdf.bullet(f"Realisatrice: {AUTHOR}  |  Encadrant: {SUPERVISOR}")
    pdf.bullet("Application live: https://heracare.vercel.app")
    pdf.h2("11.4 Conclusion du chapitre")
    pdf.p(
        "Le PFE MyHeath atteint ses objectifs: plateforme telemedecine complete, "
        "backend .NET documente, UI deployee, securite et demo jury. Les perspectives "
        "indiquent les prochaines etapes industrielles."
    )

    # Extra depth for length / quality
    pdf.h1("12. Detail technique complementaire")
    pdf.h2("12.0 Introduction du chapitre")
    pdf.p(
        "Ce chapitre complementaire approfondit des points techniques utiles a la "
        "soutenance: DI, conventions MongoDB, codes d'erreur HTTP et flux bout-en-bout."
    )
    pdf.h2("12.1 Injection de dependances")
    pdf.p(
        "Program.cs enregistre MongoContext, AesCryptoService, JwtTokenService, "
        "ClaudeService, SeedService et configure Authentication JwtBearer avec "
        "MapInboundClaims=false pour lire la claim id de maniere stable."
    )
    pdf.h2("12.2 Conventions MongoDB")
    pdf.p(
        "CamelCaseElementNameConvention aligne les documents C# avec le frontend "
        "et l'eventuel backend Node. IgnoreExtraElements evite les erreurs lors "
        "de l'evolution du schema."
    )
    pdf.h2("12.3 Gestion des erreurs API")
    pdf.p(
        "Les controllers renvoient des objets { message } avec codes HTTP adaptes "
        "(400 validation, 401 auth, 403 role, 404 ressource, 409 conflit email, "
        "503 IA non configuree)."
    )
    pdf.h2("12.4 Exemple de flux patient")
    pdf.code(
        "1. POST /api/auth/login\n"
        "2. POST /api/suivi/daily  (score calcule)\n"
        "3. POST /api/appointments (notification medecin)\n"
        "4. POST /api/ai/coach-plan (si cle Anthropic)\n"
        "5. GET  /api/chat/partners puis POST /api/chat/send"
    )
    pdf.h2("12.5 Conclusion du chapitre")
    pdf.p(
        "Ces details techniques renforcent la comprehension du runtime .NET et "
        "preparent les annexes (requetes, checklist Docker, glossaire, references)."
    )

    pdf.h1("Annexe A — Exemples de requetes")
    pdf.code(
        "POST /api/auth/login\n"
        '{ "email": "patient@myheath.app", "password": "Patient123" }\n\n'
        "POST /api/suivi/daily\n"
        '{ "sleepHours": 7.5, "energy": 7, "stress": 3, "mood": "good",\n'
        '  "fastingGlucose": 105, "tookMedication": true }\n\n'
        "POST /api/appointments\n"
        '{ "doctorId": "<id>", "scheduledAt": "2026-08-01T10:00:00Z",\n'
        '  "mode": "video", "reason": "Suivi diabete" }'
    )

    pdf.h1("Annexe B — Checklist Docker pour le jury")
    for i, step in enumerate(
        [
            "Installer et demarrer Docker Desktop",
            "Cloner le depot GitHub MyHeath",
            "Executer docker compose -f docker-compose.dotnet.yml up --build",
            "Ouvrir http://localhost:5080/api/healthcheck (status ok)",
            "Ouvrir http://localhost:5173 et se connecter",
            "Tester Admin (abonnements) et Patient (suivi / RDV)",
            "Consulter /swagger pour explorer l'API",
        ],
        1,
    ):
        pdf.bullet(f"{i}. {step}")

    pdf.h1("Annexe C — Glossaire")
    for term, defn in [
        ("JWT", "JSON Web Token — jeton d'authentification API"),
        ("AES", "Advanced Encryption Standard — chiffrement symetrique"),
        ("RBAC", "Role-Based Access Control"),
        ("MRR", "Monthly Recurring Revenue (abonnements)"),
        ("DI", "Dependency Injection (.NET)"),
        ("Swagger", "Interface OpenAPI interactive"),
        ("Atlas", "MongoDB Database-as-a-Service"),
        ("Compose", "Orchestration multi-conteneurs Docker"),
        ("PFE", "Projet de Fin d'Etudes"),
    ]:
        pdf.bullet(f"{term}: {defn}")

    pdf.h1("Annexe D — References")
    pdf.bullet("Microsoft Learn — ASP.NET Core 8 documentation")
    pdf.bullet("MongoDB C# Driver documentation")
    pdf.bullet("OWASP ASVS — Authentication & Cryptography")
    pdf.bullet("Anthropic API — Messages endpoint")
    pdf.bullet("Docker multi-stage builds best practices")
    pdf.bullet("Loi 09-08 relative a la protection des donnees (Maroc)")
    pdf.bullet("RGPD — principes de securite des traitements")


def build(lang: str):
    write_body = write_body_en if lang == "en" else write_body_fr

    # Pass 1
    p1 = Thesis(lang)
    write_cover(p1)
    write_thanks(p1)
    write_abstract(p1)
    write_list_of_figures(p1)
    front = p1.page_no()
    write_body(p1)
    toc_entries = list(p1._toc)

    toc_pages = 2
    page_offset = toc_pages

    # Pass 2
    pdf = Thesis(lang)
    write_cover(pdf)
    write_thanks(pdf)
    write_abstract(pdf)
    write_list_of_figures(pdf)
    write_toc(pdf, toc_entries, page_offset=page_offset)
    while pdf.page_no() < front + toc_pages:
        pdf.add_page()
        pdf._front_matter = True
    write_body(pdf)

    name = "RAPPORT_PFE_MYHEATH_DOTNET_EN.pdf" if lang == "en" else "RAPPORT_PFE_MYHEATH_DOTNET.pdf"
    out = OUT / name
    pdf.output(str(out))
    print("Wrote", out, "pages=", pdf.page_no())
    print(f"Author={AUTHOR} | Supervisor={SUPERVISOR}")


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
