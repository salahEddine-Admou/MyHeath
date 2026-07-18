#!/usr/bin/env python3
"""Generate clear UML / architecture PNG diagrams for the MyHeath PFE report."""

from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle, Ellipse, Rectangle
import matplotlib.lines as mlines

OUT = Path(__file__).resolve().parent.parent / "docs" / "figures"
OUT.mkdir(parents=True, exist_ok=True)

ROSE = "#c92d55"
INK = "#1a1216"
SAND = "#faf7f5"
BOX = "#fff5f7"
LINE = "#6b5560"


def save(fig, name):
    path = OUT / name
    fig.savefig(path, dpi=180, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print("wrote", path)
    return path


def rounded(ax, x, y, w, h, text, fc=BOX, ec=ROSE, fontsize=9, weight="bold"):
    box = FancyBboxPatch(
        (x, y), w, h,
        boxstyle="round,pad=0.02,rounding_size=0.08",
        linewidth=1.8, edgecolor=ec, facecolor=fc, zorder=2,
    )
    ax.add_patch(box)
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center",
            fontsize=fontsize, color=INK, weight=weight, zorder=3, wrap=True)


def arrow(ax, x1, y1, x2, y2, text="", style="-|>"):
    ax.annotate(
        "", xy=(x2, y2), xytext=(x1, y1),
        arrowprops=dict(arrowstyle=style, color=ROSE, lw=1.6),
        zorder=1,
    )
    if text:
        ax.text((x1 + x2) / 2, (y1 + y2) / 2 + 0.08, text,
                ha="center", va="bottom", fontsize=7, color=LINE)


def fig_architecture():
    fig, ax = plt.subplots(figsize=(11, 6.2))
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 6.2)
    ax.axis("off")
    ax.set_title("Figure 2.1 — MyHeath 3-tier MERN Architecture", fontsize=13, color=ROSE, weight="bold", pad=12)

    rounded(ax, 0.4, 4.3, 3.0, 1.3, "Presentation Tier\nReact + Vite + Tailwind\n(Vercel SPA)", fc="#ffe4ea")
    rounded(ax, 4.0, 4.3, 3.0, 1.3, "Application Tier\nNode.js + Express\nREST + AI + Crypto", fc="#ffe4ea")
    rounded(ax, 7.6, 4.3, 3.0, 1.3, "Data Tier\nMongoDB Atlas\nMongoose ODM", fc="#ffe4ea")

    arrow(ax, 3.4, 4.95, 4.0, 4.95, "HTTPS / JSON")
    arrow(ax, 7.0, 4.95, 7.6, 4.95, "Mongoose")

    rounded(ax, 0.6, 2.2, 2.6, 1.4, "Pages\nDashboard / AI\nChat / Records", fontsize=8)
    rounded(ax, 4.2, 2.2, 2.6, 1.4, "Modules\nAuth · Health\nChat · AI", fontsize=8)
    rounded(ax, 7.8, 2.2, 2.6, 1.4, "Collections\nusers · logs\nrecords · msgs", fontsize=8)

    arrow(ax, 1.9, 4.3, 1.9, 3.6)
    arrow(ax, 5.5, 4.3, 5.5, 3.6)
    arrow(ax, 9.1, 4.3, 9.1, 3.6)

    rounded(ax, 2.5, 0.35, 6.0, 1.1, "Cross-cutting: JWT + RBAC  |  AES-256-CBC  |  Claude AI (Anthropic)", fc="#f3ebe6", fontsize=9)
    save(fig, "fig_2_1_architecture.png")


def fig_deployment():
    fig, ax = plt.subplots(figsize=(11, 5.5))
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 5.5)
    ax.axis("off")
    ax.set_title("Figure 2.2 — Deployment Topology", fontsize=13, color=ROSE, weight="bold", pad=12)

    rounded(ax, 0.3, 2.1, 2.2, 1.3, "Browser\nPatient / Doctor", fc="#fff")
    rounded(ax, 3.2, 3.3, 2.4, 1.2, "Vercel Frontend\nmyheath SPA", fc="#ffe4ea")
    rounded(ax, 3.2, 1.0, 2.4, 1.2, "Vercel API\nmyheath-api", fc="#ffe4ea")
    rounded(ax, 6.5, 3.3, 2.2, 1.2, "Anthropic\nClaude API", fc="#f3ebe6")
    rounded(ax, 6.5, 1.0, 2.2, 1.2, "MongoDB\nAtlas", fc="#f3ebe6")
    rounded(ax, 9.2, 2.0, 1.5, 1.3, "GitHub\nRepo", fc="#fff", fontsize=8)

    arrow(ax, 2.5, 2.75, 3.2, 3.7)
    arrow(ax, 2.5, 2.5, 3.2, 1.6)
    arrow(ax, 5.6, 3.9, 6.5, 3.9, "AI")
    arrow(ax, 5.6, 1.6, 6.5, 1.6, "DB")
    save(fig, "fig_2_2_deployment.png")


def fig_usecase():
    fig, ax = plt.subplots(figsize=(11, 7.2))
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 7.2)
    ax.axis("off")
    ax.set_title("Figure 2.3 — Use Case Diagram", fontsize=13, color=ROSE, weight="bold", pad=12)

    boundary = FancyBboxPatch(
        (2.3, 0.35), 6.4, 6.5,
        boxstyle="round,pad=0.02,rounding_size=0.05",
        linewidth=1.5, edgecolor=ROSE, facecolor="#fffafb", linestyle="--",
    )
    ax.add_patch(boundary)
    ax.text(5.5, 6.6, "MyHeath System", ha="center", fontsize=10, color=ROSE, weight="bold")

    def actor(x, y, label):
        ax.add_patch(Circle((x, y + 0.55), 0.18, fill=False, edgecolor=INK, lw=1.5))
        ax.plot([x, x], [y + 0.37, y + 0.05], color=INK, lw=1.5)
        ax.plot([x - 0.25, x + 0.25], [y + 0.28, y + 0.28], color=INK, lw=1.5)
        ax.plot([x, x - 0.18], [y + 0.05, y - 0.25], color=INK, lw=1.5)
        ax.plot([x, x + 0.18], [y + 0.05, y - 0.25], color=INK, lw=1.5)
        ax.text(x, y - 0.45, label, ha="center", fontsize=9, weight="bold", color=INK)

    actor(0.85, 4.8, "Patient")
    actor(10.15, 4.8, "Doctor")
    actor(10.15, 1.4, "Admin")

    # (cx, cy, label)
    cases = {
        "auth": (5.5, 5.85, "Authenticate"),
        "log": (3.5, 4.85, "Log symptoms"),
        "insights": (7.5, 4.85, "View insights"),
        "record": (3.5, 3.85, "Manage record"),
        "ai": (7.5, 3.85, "Use MyHeath AI"),
        "assign": (3.5, 2.85, "Assign doctor"),
        "chat": (7.5, 2.85, "Secure chat"),
        "brief": (3.5, 1.85, "Doctor brief"),
        "wellness": (7.5, 1.85, "Wellness plan"),
        "users": (5.5, 0.9, "Manage users"),
    }
    for _, (x, y, t) in cases.items():
        e = Ellipse((x, y), 2.2, 0.75, facecolor="white", edgecolor=ROSE, lw=1.6, zorder=2)
        ax.add_patch(e)
        ax.text(x, y, t, ha="center", va="center", fontsize=8, color=INK, zorder=3)

    def link(x1, y1, x2, y2):
        ax.plot([x1, x2], [y1, y2], color=LINE, lw=1.1, zorder=1)

    # Patient associations (left actor -> left/center use cases)
    px, py = 1.15, 5.2
    for key in ["auth", "log", "record", "ai", "assign", "chat", "brief", "wellness"]:
        x, y, _ = cases[key]
        link(px, py, x - 1.1, y)

    # Doctor associations
    dx, dy = 9.85, 5.2
    for key in ["auth", "insights", "chat", "brief"]:
        x, y, _ = cases[key]
        link(dx, dy, x + 1.1, y)

    # Admin
    link(9.85, 1.6, cases["users"][0] + 1.1, cases["users"][1])

    save(fig, "fig_2_3_usecase.png")


def fig_sequence_login():
    fig, ax = plt.subplots(figsize=(11, 6.5))
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 6.5)
    axis = False
    ax.axis("off")
    ax.set_title("Figure 2.4 — Sequence: Login & JWT", fontsize=13, color=ROSE, weight="bold", pad=12)

    actors = [("Client\n(React)", 1.5), ("API\n/auth/login", 5.5), ("MongoDB", 9.0)]
    for name, x in actors:
        rounded(ax, x - 0.9, 5.5, 1.8, 0.8, name, fontsize=8)
        ax.plot([x, x], [5.5, 0.4], color="#d0c4c8", lw=1.2, linestyle="--")

    steps = [
        (1.5, 5.0, 5.5, 5.0, "1. POST email+password"),
        (5.5, 4.4, 9.0, 4.4, "2. find user +password"),
        (9.0, 3.8, 5.5, 3.8, "3. user document"),
        (5.5, 3.2, 5.5, 3.2, ""),  # self
        (5.5, 2.6, 1.5, 2.6, "5. { token, user }"),
    ]
    # self message for bcrypt+jwt
    ax.annotate("", xy=(6.3, 3.2), xytext=(5.5, 3.2),
                arrowprops=dict(arrowstyle="-|>", color=ROSE, lw=1.4))
    ax.text(6.5, 3.25, "4. bcrypt.compare + jwt.sign", fontsize=7, color=LINE, va="center")

    for x1, y1, x2, y2, t in steps:
        if not t:
            continue
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="-|>", color=ROSE, lw=1.5))
        ax.text((x1 + x2) / 2, y1 + 0.12, t, ha="center", fontsize=7.5, color=INK)

    save(fig, "fig_2_4_sequence_login.png")


def fig_sequence_insights():
    fig, ax = plt.subplots(figsize=(11, 6.5))
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 6.5)
    ax.axis("off")
    ax.set_title("Figure 2.5 — Sequence: Insights Computation", fontsize=13, color=ROSE, weight="bold", pad=12)

    actors = [("Dashboard", 1.3), ("API\n/insights", 4.0), ("SymptomLog", 6.8), ("analyzer.js", 9.3)]
    for name, x in actors:
        rounded(ax, x - 0.85, 5.5, 1.7, 0.8, name, fontsize=8)
        ax.plot([x, x], [5.5, 0.4], color="#d0c4c8", lw=1.2, linestyle="--")

    msgs = [
        (1.3, 5.0, 4.0, 5.0, "1. GET /health/insights + JWT"),
        (4.0, 4.3, 6.8, 4.3, "2. find({patient}).sort(date)"),
        (6.8, 3.6, 4.0, 3.6, "3. logs[]"),
        (4.0, 2.9, 9.3, 2.9, "4. analyzeCycle(cycles, logs)"),
        (9.3, 2.2, 4.0, 2.2, "5. insights object"),
        (4.0, 1.5, 1.3, 1.5, "6. JSON { insights, logsCount }"),
    ]
    for x1, y1, x2, y2, t in msgs:
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="-|>", color=ROSE, lw=1.5))
        ax.text((x1 + x2) / 2, y1 + 0.12, t, ha="center", fontsize=7.2, color=INK)

    save(fig, "fig_2_5_sequence_insights.png")


def fig_class():
    fig, ax = plt.subplots(figsize=(11, 7))
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 7)
    ax.axis("off")
    ax.set_title("Figure 2.6 — Domain Class Diagram", fontsize=13, color=ROSE, weight="bold", pad=12)

    def clazz(x, y, w, h, title, fields, methods=None):
        # header
        ax.add_patch(Rectangle((x, y + h * 0.72), w, h * 0.28, facecolor=ROSE, edgecolor=ROSE, lw=1.5))
        ax.text(x + w / 2, y + h * 0.86, title, ha="center", va="center", color="white", fontsize=9, weight="bold")
        ax.add_patch(Rectangle((x, y), w, h * 0.72, facecolor="white", edgecolor=ROSE, lw=1.5))
        body = "\n".join(fields)
        if methods:
            body += "\n----- \n" + "\n".join(methods)
        ax.text(x + 0.1, y + h * 0.68, body, ha="left", va="top", fontsize=7.2, color=INK, family="monospace")

    clazz(0.3, 4.0, 3.2, 2.6, "User",
          ["+ id: ObjectId", "+ email: String", "+ password: String", "+ role: Enum", "+ assignedDoctor"],
          ["+ comparePassword()", "+ toSafeJSON()"])
    clazz(4.0, 4.0, 3.2, 2.6, "HealthRecord",
          ["+ patient: ObjectId", "+ bloodType", "+ *Encrypted fields"],
          ["+ setSensitiveFields()", "+ getDecrypted()"])
    clazz(7.6, 4.0, 3.1, 2.6, "SymptomLog",
          ["+ patient: ObjectId", "+ date: Date", "+ entryType", "+ painLevel", "+ symptoms[]"],
          [])
    clazz(2.2, 0.5, 3.2, 2.5, "Message",
          ["+ sender / receiver", "+ encryptedContent", "+ conversationId"],
          ["+ createEncrypted()", "+ toClient()"])
    clazz(6.0, 0.5, 3.4, 2.5, "Services",
          ["analyzer.analyzeCycle()", "crypto.encrypt/decrypt", "claude.callClaude()"],
          [])

    # relations
    ax.annotate("", xy=(4.0, 5.2), xytext=(3.5, 5.2), arrowprops=dict(arrowstyle="-|>", color=LINE, lw=1.3))
    ax.text(3.7, 5.4, "1", fontsize=7, color=LINE)
    ax.annotate("", xy=(7.6, 5.2), xytext=(7.2, 5.2), arrowprops=dict(arrowstyle="-|>", color=LINE, lw=1.3))
    ax.text(6.0, 5.45, "logs", fontsize=7, color=LINE)
    ax.annotate("", xy=(3.8, 3.0), xytext=(2.0, 4.0), arrowprops=dict(arrowstyle="-|>", color=LINE, lw=1.3))
    ax.text(2.4, 3.3, "sends", fontsize=7, color=LINE)

    save(fig, "fig_2_6_class.png")


def fig_aes():
    fig, ax = plt.subplots(figsize=(11, 4.8))
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 4.8)
    ax.axis("off")
    ax.set_title("Figure 2.7 — AES-256-CBC Encryption Pipeline", fontsize=13, color=ROSE, weight="bold", pad=12)

    steps = [
        (0.3, "Plaintext\nclinical data"),
        (2.5, "Random IV\n16 bytes"),
        (4.7, "AES-256-CBC\nkey=SHA256(secret)"),
        (7.1, "Ciphertext"),
        (9.0, "Store\niv:cipher"),
    ]
    for i, (x, t) in enumerate(steps):
        rounded(ax, x, 1.7, 1.8, 1.5, t, fontsize=8)
        if i < len(steps) - 1:
            arrow(ax, x + 1.8, 2.45, steps[i + 1][0], 2.45)

    ax.text(5.5, 0.6, "Decrypt only on server after JWT + RBAC authorization",
            ha="center", fontsize=9, color=LINE, style="italic")
    save(fig, "fig_2_7_aes.png")


def fig_predictive():
    fig, ax = plt.subplots(figsize=(10, 7.5))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7.5)
    ax.axis("off")
    ax.set_title("Figure 2.8 — Predictive Cycle Analysis Flowchart", fontsize=13, color=ROSE, weight="bold", pad=12)

    # diamond helper
    def diamond(cx, cy, text):
        d = mpatches.FancyBboxPatch((cx - 1.3, cy - 0.45), 2.6, 0.9,
                                   boxstyle="round,pad=0.02,rounding_size=0.4",
                                   facecolor="#fff0f3", edgecolor=ROSE, lw=1.5)
        ax.add_patch(d)
        ax.text(cx, cy, text, ha="center", va="center", fontsize=8, color=INK)

    rounded(ax, 3.5, 6.5, 3.0, 0.7, "Start: period_start logs", fontsize=8)
    arrow(ax, 5.0, 6.5, 5.0, 6.05)
    rounded(ax, 3.3, 5.4, 3.4, 0.65, "Compute cycle lengths", fontsize=8)
    arrow(ax, 5.0, 5.4, 5.0, 4.95)
    rounded(ax, 3.3, 4.3, 3.4, 0.65, "Mean / std / next period", fontsize=8)
    arrow(ax, 5.0, 4.3, 5.0, 3.85)
    rounded(ax, 3.3, 3.2, 3.4, 0.65, "Ovulation window J-14 +/-2", fontsize=8)
    arrow(ax, 5.0, 3.2, 5.0, 2.75)
    diamond(5.0, 2.2, "Anomaly rules?")
    arrow(ax, 5.0, 1.75, 5.0, 1.35)
    rounded(ax, 3.3, 0.5, 3.4, 0.7, "Return insights + chartData", fontsize=8, fc="#e8fff0", ec="#2f9e44")

    # side branch
    ax.annotate("", xy=(7.2, 2.2), xytext=(6.3, 2.2),
                arrowprops=dict(arrowstyle="-|>", color=ROSE, lw=1.3))
    rounded(ax, 7.3, 1.7, 2.3, 1.0, "Flag high/medium\nalerts", fontsize=7)
    ax.text(6.7, 2.45, "yes", fontsize=7, color=LINE)

    save(fig, "fig_2_8_predictive.png")


def fig_ai():
    fig, ax = plt.subplots(figsize=(11, 5.2))
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 5.2)
    ax.axis("off")
    ax.set_title("Figure 2.9 — MyHeath AI Contextual Prompt Pipeline", fontsize=13, color=ROSE, weight="bold", pad=12)

    boxes = [
        (0.3, "1. Auth\nJWT user"),
        (2.4, "2. Build\ncontext JSON"),
        (4.5, "3. System\nprompt + safety"),
        (6.6, "4. Claude\nMessages API"),
        (8.7, "5. Reply /\nJSON parse"),
    ]
    for i, (x, t) in enumerate(boxes):
        rounded(ax, x, 2.0, 1.9, 1.5, t, fontsize=8)
        if i < len(boxes) - 1:
            arrow(ax, x + 1.9, 2.75, boxes[i + 1][0], 2.75)

    rounded(ax, 2.0, 0.35, 7.0, 0.9,
            "Context includes: insights + recent logs + allergies/meds summary (decrypted server-side)",
            fontsize=8, fc="#f3ebe6")
    save(fig, "fig_2_9_ai.png")


def fig_backend_structure():
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.axis("off")
    ax.set_title("Figure 3.1 — Backend Folder Structure", fontsize=13, color=ROSE, weight="bold", pad=12)
    tree = (
        "backend/\n"
        "├─ api/index.js          (Vercel serverless entry)\n"
        "├─ src/app.js            (Express app)\n"
        "├─ src/server.js         (local listen + Socket.io)\n"
        "├─ src/config/db.js\n"
        "├─ src/models/           User, HealthRecord, SymptomLog, Message\n"
        "├─ src/controllers/      auth, health, chat, ai\n"
        "├─ src/routes/\n"
        "├─ src/middlewares/auth.middleware.js\n"
        "├─ src/utils/            crypto.js, analyzer.js, claude.js\n"
        "└─ src/sockets/chat.socket.js"
    )
    ax.text(0.5, 5.2, tree, ha="left", va="top", fontsize=10, family="monospace", color=INK,
            bbox=dict(boxstyle="round,pad=0.6", facecolor=SAND, edgecolor=ROSE, lw=1.5))
    save(fig, "fig_3_1_backend.png")


def fig_routes():
    fig, ax = plt.subplots(figsize=(10, 5.5))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5.5)
    ax.axis("off")
    ax.set_title("Figure 3.2 — Frontend Route Map", fontsize=13, color=ROSE, weight="bold", pad=12)

    routes = [
        (1.0, 4.0, "/\nLanding"),
        (3.5, 4.0, "/login"),
        (6.0, 4.0, "/register"),
        (1.0, 2.0, "/dashboard\nTracking"),
        (3.5, 2.0, "/ai\nMyHeath AI"),
        (6.0, 2.0, "/chat\nConsult"),
        (8.3, 2.0, "/dossier\nRecords"),
    ]
    for x, y, t in routes:
        rounded(ax, x, y, 1.9, 1.1, t, fontsize=8)
    rounded(ax, 3.0, 0.3, 4.0, 0.8, "PrivateRoute + AuthContext (JWT)", fontsize=8, fc="#ffe4ea")
    arrow(ax, 5.0, 2.0, 5.0, 1.1)
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
    fig_backend_structure()
    fig_routes()
    print("All figures generated in", OUT)


if __name__ == "__main__":
    main()
