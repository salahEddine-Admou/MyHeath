#!/usr/bin/env python3
"""Professional UML / architecture diagrams for MyHeath PFE report."""

from pathlib import Path
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Circle, FancyArrowPatch
import matplotlib.patches as mpatches

OUT = Path(__file__).resolve().parent.parent / "docs" / "figures"
OUT.mkdir(parents=True, exist_ok=True)

# Professional academic palette (navy / slate / teal — not pink)
NAVY = "#1B365D"
SLATE = "#334155"
TEAL = "#0F766E"
BORDER = "#1E3A5F"
ARROW = "#475569"
TEXT = "#0F172A"
MUTED = "#64748B"
FILL = "#F1F5F9"
FILL_ACCENT = "#E0F2FE"
FILL_TEAL = "#CCFBF1"
WHITE = "#FFFFFF"
SOFT = "#F8FAFC"


def save(fig, name):
    path = OUT / name
    fig.savefig(path, dpi=220, bbox_inches="tight", facecolor=WHITE, pad_inches=0.25)
    plt.close(fig)
    print("wrote", path)


def box(ax, x, y, w, h, text, fc=FILL, ec=BORDER, fs=11, weight="bold", radius=0.12):
    """Large readable rounded rectangle with comfortable padding."""
    patch = FancyBboxPatch(
        (x, y), w, h,
        boxstyle=f"round,pad=0.04,rounding_size={radius}",
        linewidth=2.8,
        edgecolor=ec,
        facecolor=fc,
        zorder=2,
    )
    ax.add_patch(patch)
    ax.text(
        x + w / 2, y + h / 2, text,
        ha="center", va="center",
        fontsize=fs, color=TEXT, weight=weight,
        linespacing=1.45, zorder=3,
        family="DejaVu Sans",
        wrap=True,
    )


def arrow(ax, x1, y1, x2, y2, label="", lw=2.6):
    ax.annotate(
        "",
        xy=(x2, y2), xytext=(x1, y1),
        arrowprops=dict(
            arrowstyle="-|>",
            color=ARROW,
            lw=lw,
            mutation_scale=18,
            shrinkA=2,
            shrinkB=2,
        ),
        zorder=1,
    )
    if label:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        # offset label slightly perpendicular
        ax.text(
            mx, my + 0.18, label,
            ha="center", va="bottom",
            fontsize=10, color=MUTED, weight="normal",
            bbox=dict(boxstyle="round,pad=0.2", fc=WHITE, ec="none", alpha=0.92),
            zorder=4,
        )


def title(ax, text):
    ax.set_title(text, fontsize=15, color=NAVY, weight="bold", pad=16, loc="left")


def fig_architecture():
    fig, ax = plt.subplots(figsize=(14, 8))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 8)
    ax.axis("off")
    fig.patch.set_facecolor(WHITE)
    title(ax, "Figure 2.1 — Architecture 3-tiers MyHeath (.NET + React + MongoDB)")

    # Tier headers
    box(ax, 0.5, 5.6, 4.0, 1.8,
        "Couche Presentation\nReact + Vite + Tailwind\nSPA (Vercel / Docker)",
        fc=FILL_ACCENT, fs=12)
    box(ax, 5.0, 5.6, 4.0, 1.8,
        "Couche Application\nASP.NET Core 8 (C#)\nREST API + JWT + AES",
        fc=FILL_TEAL, fs=12)
    box(ax, 9.5, 5.6, 4.0, 1.8,
        "Couche Donnees\nMongoDB 7 / Atlas\nCollections documents",
        fc=FILL, fs=12)

    arrow(ax, 4.5, 6.5, 5.0, 6.5, "HTTPS / JSON")
    arrow(ax, 9.0, 6.5, 9.5, 6.5, "MongoDB Driver")

    box(ax, 0.7, 2.8, 3.6, 2.0,
        "UI Dashboard\nSuivi · Period · Diabete\nAdmin · RDV · Chat",
        fc=WHITE, fs=11)
    box(ax, 5.2, 2.8, 3.6, 2.0,
        "Controllers / Services\nAuth · Health · Suivi\nAI · Admin · RDV",
        fc=WHITE, fs=11)
    box(ax, 9.7, 2.8, 3.6, 2.0,
        "Collections\nusers · logs · messages\nplans · appointments",
        fc=WHITE, fs=11)

    arrow(ax, 2.5, 5.6, 2.5, 4.8)
    arrow(ax, 7.0, 5.6, 7.0, 4.8)
    arrow(ax, 11.5, 5.6, 11.5, 4.8)

    box(ax, 1.5, 0.5, 11.0, 1.6,
        "Transversal : JWT + RBAC  |  AES-256-CBC  |  Claude AI (Anthropic)  |  Docker Compose",
        fc=SOFT, ec=TEAL, fs=12)
    save(fig, "fig_2_1_architecture.png")


def fig_deployment():
    fig, ax = plt.subplots(figsize=(14, 7.5))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 7.5)
    ax.axis("off")
    title(ax, "Figure 2.2 — Topologie de deploiement (Docker / Cloud)")

    box(ax, 0.4, 2.8, 2.8, 1.8, "Navigateur\nPatient / Medecin\n/ Admin", fc=WHITE, fs=11)
    box(ax, 4.0, 4.8, 3.4, 1.8, "Frontend React\nVercel ou Docker\n:5173", fc=FILL_ACCENT, fs=12)
    box(ax, 4.0, 1.2, 3.4, 1.8, "API ASP.NET Core\nDocker / Azure\n:5080", fc=FILL_TEAL, fs=12)
    box(ax, 8.6, 4.8, 2.8, 1.8, "Anthropic\nClaude API\n(IA Coach)", fc=SOFT, fs=11)
    box(ax, 8.6, 1.2, 2.8, 1.8, "MongoDB\nAtlas ou\nConteneur :27017", fc=SOFT, fs=11)
    box(ax, 12.0, 2.8, 1.6, 1.8, "GitHub\nRepo\npublic", fc=WHITE, fs=10)

    arrow(ax, 3.2, 4.0, 4.0, 5.4, "")
    arrow(ax, 3.2, 3.4, 4.0, 2.2, "")
    arrow(ax, 7.4, 5.7, 8.6, 5.7, "HTTPS")
    arrow(ax, 7.4, 2.1, 8.6, 2.1, "Driver")
    ax.text(3.5, 6.9, "Docker Compose (.NET) ou Vercel + Atlas", fontsize=11, color=MUTED, style="italic")
    save(fig, "fig_2_2_deployment.png")


def fig_usecase():
    fig, ax = plt.subplots(figsize=(14, 9))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 9)
    ax.axis("off")
    title(ax, "Figure 2.3 — Diagramme de cas d'utilisation")

    boundary = FancyBboxPatch(
        (3.2, 0.4), 7.6, 8.0,
        boxstyle="round,pad=0.02,rounding_size=0.15",
        linewidth=2.2, edgecolor=NAVY, facecolor=SOFT, linestyle="--",
    )
    ax.add_patch(boundary)
    ax.text(7.0, 8.1, "Systeme MyHeath", ha="center", fontsize=13, color=NAVY, weight="bold")

    def actor(x, y, label):
        ax.add_patch(Circle((x, y + 0.7), 0.28, fill=False, edgecolor=TEXT, lw=2.2))
        ax.plot([x, x], [y + 0.42, y - 0.05], color=TEXT, lw=2.2)
        ax.plot([x - 0.35, x + 0.35], [y + 0.28, y + 0.28], color=TEXT, lw=2.2)
        ax.plot([x, x - 0.25], [y - 0.05, y - 0.45], color=TEXT, lw=2.2)
        ax.plot([x, x + 0.25], [y - 0.05, y - 0.45], color=TEXT, lw=2.2)
        ax.text(x, y - 0.75, label, ha="center", fontsize=11, weight="bold", color=TEXT)

    actor(1.3, 6.5, "Patient")
    actor(1.3, 3.2, "Medecin")
    actor(12.7, 5.0, "Admin")

    cases = [
        (4.0, 7.0, "Suivi quotidien"),
        (7.2, 7.0, "Gestion periodes"),
        (4.0, 5.5, "Diabete / glycemie"),
        (7.2, 5.5, "Coach IA Claude"),
        (4.0, 4.0, "Dossier chiffre"),
        (7.2, 4.0, "Messagerie / RDV"),
        (5.5, 2.5, "Console admin\nUsers · Plans · Audit"),
    ]
    for x, y, t in cases:
        box(ax, x, y, 2.6, 1.1, t, fc=WHITE, ec=TEAL, fs=10, radius=0.35)

    # associations
    for y in (7.5, 6.0, 4.5, 3.0):
        ax.plot([1.7, 4.0], [y, y], color=ARROW, lw=1.8)
    ax.plot([1.7, 4.0], [3.5, 4.5], color=ARROW, lw=1.8)
    ax.plot([12.2, 8.1], [5.2, 3.0], color=ARROW, lw=1.8)
    save(fig, "fig_2_3_usecase.png")


def fig_sequence_login():
    fig, ax = plt.subplots(figsize=(14, 7.5))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 7.5)
    ax.axis("off")
    title(ax, "Figure 2.4 — Sequence : authentification JWT")

    cols = [(2, "React\nClient"), (5.5, "API\nASP.NET"), (9, "MongoDB"), (12, "JWT\nService")]
    for x, label in cols:
        box(ax, x - 1.1, 6.2, 2.2, 1.0, label, fc=FILL_ACCENT, fs=11)
        ax.plot([x, x], [0.6, 6.2], color="#CBD5E1", lw=2, linestyle="--")

    steps = [
        (2, 5.5, 5.5, 5.5, "1. POST /auth/login"),
        (5.5, 4.7, 9, 4.7, "2. Find user + BCrypt"),
        (9, 4.0, 5.5, 4.0, "3. User document"),
        (5.5, 3.2, 12, 3.2, "4. CreateToken()"),
        (12, 2.4, 5.5, 2.4, "5. JWT (7 jours)"),
        (5.5, 1.5, 2, 1.5, "6. { token, user }"),
    ]
    for x1, y1, x2, y2, lab in steps:
        arrow(ax, x1, y1, x2, y2, lab)
    save(fig, "fig_2_4_sequence_login.png")


def fig_sequence_insights():
    fig, ax = plt.subplots(figsize=(14, 7.5))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 7.5)
    ax.axis("off")
    title(ax, "Figure 2.5 — Sequence : calcul des insights cycle")

    cols = [(2.5, "Patient\nUI"), (6.5, "Health\nController"), (10.5, "Cycle\nAnalyzer")]
    for x, label in cols:
        box(ax, x - 1.2, 6.2, 2.4, 1.0, label, fc=FILL_TEAL, fs=11)
        ax.plot([x, x], [0.6, 6.2], color="#CBD5E1", lw=2, linestyle="--")

    steps = [
        (2.5, 5.4, 6.5, 5.4, "GET /health/insights"),
        (6.5, 4.4, 10.5, 4.4, "SymptomLog period_start"),
        (10.5, 3.4, 6.5, 3.4, "avg, ovulation, anomalies"),
        (6.5, 2.2, 2.5, 2.2, "JSON insights"),
    ]
    for x1, y1, x2, y2, lab in steps:
        arrow(ax, x1, y1, x2, y2, lab)
    save(fig, "fig_2_5_sequence_insights.png")


def fig_class():
    fig, ax = plt.subplots(figsize=(14, 9))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 9)
    ax.axis("off")
    title(ax, "Figure 2.6 — Modele de domaines (extrait)")

    def clazz(x, y, w, h, name, fields):
        body = name + "\n" + "─" * 18 + "\n" + "\n".join(fields)
        box(ax, x, y, w, h, body, fc=WHITE, ec=NAVY, fs=9, weight="normal", radius=0.08)

    clazz(0.4, 5.5, 3.2, 3.0, "User", ["id, email, role", "gender, hasDiabetes", "assignedDoctor"])
    clazz(4.2, 5.5, 3.2, 3.0, "DailyHealthLog", ["patient, date", "sleep, stress, glucose", "healthScore"])
    clazz(8.0, 5.5, 3.2, 3.0, "HealthRecord", ["patient", "AES fields", "bloodType"])
    clazz(11.5, 5.8, 2.2, 2.4, "Message", ["sender", "receiver", "AES content"])
    clazz(0.4, 1.2, 3.2, 3.2, "SubscriptionPlan", ["code, price", "interval", "features"])
    clazz(4.2, 1.2, 3.2, 3.2, "UserSubscription", ["user, plan", "status, dates", "managedBy"])
    clazz(8.0, 1.2, 3.2, 3.2, "Appointment", ["patient, doctor", "scheduledAt", "status, mode"])
    clazz(11.5, 1.5, 2.2, 2.6, "AuditLog", ["actor", "action", "entity"])

    arrow(ax, 3.6, 6.8, 4.2, 6.8)
    arrow(ax, 3.6, 6.2, 4.2, 2.8)
    save(fig, "fig_2_6_class.png")


def fig_aes():
    fig, ax = plt.subplots(figsize=(14, 6.5))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 6.5)
    ax.axis("off")
    title(ax, "Figure 2.7 — Chiffrement AES-256-CBC des donnees sensibles")

    box(ax, 0.5, 2.2, 3.2, 2.4, "Donnee claire\nallergies /\nmessage chat", fc=WHITE, fs=12)
    box(ax, 4.5, 2.2, 5.0, 2.4, "AES-256-CBC\ncle = SHA-256(secret)\nIV aleatoire 16 octets", fc=FILL_TEAL, fs=12)
    box(ax, 10.3, 2.2, 3.2, 2.4, "Stockage Mongo\niv_hex:cipher_hex", fc=FILL_ACCENT, fs=12)
    arrow(ax, 3.7, 3.4, 4.5, 3.4, "Encrypt")
    arrow(ax, 9.5, 3.4, 10.3, 3.4, "Persist")
    ax.text(7.0, 1.2, "Dechiffrement uniquement cote API apres JWT + RBAC", ha="center", fontsize=11, color=MUTED, style="italic")
    save(fig, "fig_2_7_aes.png")


def fig_predictive():
    fig, ax = plt.subplots(figsize=(14, 6.5))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 6.5)
    ax.axis("off")
    title(ax, "Figure 2.8 — Pipeline score sante & analyse de cycle")

    steps = [
        (0.4, "Journal\nquotidien"),
        (3.2, "Features\nsommeil, stress\nglycemie..."),
        (6.2, "HealthScore\nService\n0 — 100"),
        (9.2, "Cycle\nAnalyzer\nanomalies"),
        (11.8, "Dashboard\n+ Alertes"),
    ]
    for i, (x, t) in enumerate(steps):
        box(ax, x, 2.2, 2.4, 2.6, t, fc=FILL_ACCENT if i % 2 == 0 else FILL_TEAL, fs=11)
        if i < len(steps) - 1:
            arrow(ax, x + 2.4, 3.5, steps[i + 1][0], 3.5)
    save(fig, "fig_2_8_predictive.png")


def fig_ai():
    fig, ax = plt.subplots(figsize=(14, 7))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 7)
    ax.axis("off")
    title(ax, "Figure 2.9 — Integration MyHeath AI Coach (Claude)")

    box(ax, 0.5, 2.5, 3.0, 2.8, "Patient\nFrontend\n/ai", fc=WHITE, fs=12)
    box(ax, 4.3, 2.5, 3.4, 2.8, "AiController\n+ contexte\nDailyHealthLog", fc=FILL_TEAL, fs=12)
    box(ax, 8.5, 2.5, 2.8, 2.8, "ClaudeService\nAnthropic\nMessages API", fc=FILL_ACCENT, fs=11)
    box(ax, 12.0, 2.5, 1.6, 2.8, "Reponse\n+ disclaimer", fc=SOFT, fs=10)
    arrow(ax, 3.5, 3.9, 4.3, 3.9)
    arrow(ax, 7.7, 3.9, 8.5, 3.9, "HTTPS")
    arrow(ax, 11.3, 3.9, 12.0, 3.9)
    ax.text(7.0, 1.3, "Usage educatif uniquement — pas un diagnostic medical", ha="center", fontsize=11, color=MUTED, style="italic")
    save(fig, "fig_2_9_ai.png")


def fig_backend():
    fig, ax = plt.subplots(figsize=(14, 8))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 8)
    ax.axis("off")
    title(ax, "Figure 3.1 — Organisation du backend ASP.NET Core")

    patch = FancyBboxPatch(
        (4.5, 6.5), 5.0, 1.2,
        boxstyle="round,pad=0.02,rounding_size=0.12",
        linewidth=2.4, edgecolor=BORDER, facecolor=NAVY, zorder=2,
    )
    ax.add_patch(patch)
    ax.text(
        7.0, 7.1, "Program.cs — DI · JWT · CORS · Swagger",
        ha="center", va="center", fontsize=12, color=WHITE, weight="bold", zorder=3,
    )

    layers = [
        (0.5, "Controllers\nAuth Health Suivi\nChat AI Admin\nRDV Notif Meds", FILL_ACCENT),
        (5.0, "Services\nMongo AES JWT\nClaude Seed\nHealthScore", FILL_TEAL),
        (9.5, "Models\nUser Log Message\nPlan Appointment\nAudit", FILL),
    ]
    for x, t, fc in layers:
        box(ax, x, 2.8, 4.0, 2.8, t, fc=fc, fs=12)
    box(ax, 2.5, 0.5, 9.0, 1.5, "MongoDB  |  Anthropic  |  Docker / Azure", fc=SOFT, ec=TEAL, fs=12)
    arrow(ax, 7.0, 6.5, 7.0, 5.6)
    save(fig, "fig_3_1_backend.png")


def fig_routes():
    fig, ax = plt.subplots(figsize=(14, 8.5))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 8.5)
    ax.axis("off")
    title(ax, "Figure 3.3 — Cartographie des routes API (/api)")

    routes = [
        (0.4, 5.5, "/api/auth", "login · register\nme · doctors"),
        (3.7, 5.5, "/api/health", "symptoms · periods\ninsights · record"),
        (7.0, 5.5, "/api/suivi", "daily · diabetes\nscore predictif"),
        (10.3, 5.5, "/api/ai", "chat · coach\nwellness · brief"),
        (0.4, 2.0, "/api/admin", "users · plans\nsubs · audit"),
        (3.7, 2.0, "/api/chat", "partners · send\nconversation"),
        (7.0, 2.0, "/api/appointments", "book · status\nliste RDV"),
        (10.3, 2.0, "/api/medications\n/notifications", "rappels\nalertes"),
    ]
    for x, y, name, detail in routes:
        box(ax, x, y, 3.0, 2.5, f"{name}\n\n{detail}", fc=WHITE, ec=BORDER, fs=10)
    save(fig, "fig_3_3_routes.png")


def main():
    fig_architecture()
    fig_deployment()
    fig_usecase()
    fig_sequence_login()
    fig_sequence_insights()
    fig_class()
    fig_aes()
    fig_predictive()
    fig_ai()
    fig_backend()
    fig_routes()
    print("All figures regenerated in", OUT)


if __name__ == "__main__":
    main()
