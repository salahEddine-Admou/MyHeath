"""Live Vercel UI screenshots for MyHeath PFE reports."""

LIVE_URL = "https://heracare.vercel.app"


def write_ui_gallery(pdf, lang: str = "fr") -> None:
    if lang == "en":
        pdf.h2("6.4 Live deployment screenshots (Vercel)")
        pdf.p(
            f"The following captures were taken from the production SPA at {LIVE_URL} "
            "(Playwright, Chromium, 1440x900). They illustrate the real user experience "
            "connected to the deployed API — landing, authentication, patient modules, "
            "admin console and doctor space."
        )
        pdf.info_box([f"Live URL: {LIVE_URL}", "Demo: patient@myheath.app / Patient123"])
        shots = [
            ("ui_01_landing.png", "Figure 6.1 — Landing page (Vercel)"),
            ("ui_02_login.png", "Figure 6.2 — Login screen"),
            ("ui_03_register.png", "Figure 6.3 — Registration"),
            ("ui_04_dashboard.png", "Figure 6.4 — Patient dashboard (Sara)"),
            ("ui_05_suivi.png", "Figure 6.5 — Daily health suivi"),
            ("ui_06_period.png", "Figure 6.6 — Period management & insights"),
            ("ui_07_diabetes.png", "Figure 6.7 — Diabetes care"),
            ("ui_08_ai.png", "Figure 6.8 — AI Coach (Claude)"),
            ("ui_09_appointments.png", "Figure 6.9 — Appointments"),
            ("ui_10_medications.png", "Figure 6.10 — Medication reminders"),
            ("ui_11_chat.png", "Figure 6.11 — Encrypted telemedicine chat"),
            ("ui_12_dossier.png", "Figure 6.12 — Encrypted health record"),
            ("ui_13_admin.png", "Figure 6.13 — Admin console (subscriptions)"),
            ("ui_14_doctor_dashboard.png", "Figure 6.14 — Doctor dashboard"),
            ("ui_15_doctor_appointments.png", "Figure 6.15 — Doctor appointments"),
        ]
    else:
        pdf.h2("6.4 Captures de l'application deployee (Vercel)")
        pdf.p(
            f"Les captures suivantes ont ete prises sur l'application en ligne {LIVE_URL} "
            "(Playwright, Chromium, 1440x900). Elles montrent l'experience reelle: "
            "landing, authentification, modules patient, console admin et espace medecin."
        )
        pdf.info_box([f"URL live: {LIVE_URL}", "Demo: patient@myheath.app / Patient123"])
        shots = [
            ("ui_01_landing.png", "Figure 6.1 — Page d'accueil (Vercel)"),
            ("ui_02_login.png", "Figure 6.2 — Ecran de connexion"),
            ("ui_03_register.png", "Figure 6.3 — Inscription"),
            ("ui_04_dashboard.png", "Figure 6.4 — Dashboard patient (Sara)"),
            ("ui_05_suivi.png", "Figure 6.5 — Suivi sante quotidien"),
            ("ui_06_period.png", "Figure 6.6 — Gestion du cycle / insights"),
            ("ui_07_diabetes.png", "Figure 6.7 — Suivi diabete"),
            ("ui_08_ai.png", "Figure 6.8 — Coach IA (Claude)"),
            ("ui_09_appointments.png", "Figure 6.9 — Rendez-vous"),
            ("ui_10_medications.png", "Figure 6.10 — Rappels medicaments"),
            ("ui_11_chat.png", "Figure 6.11 — Chat telemedecine chiffre"),
            ("ui_12_dossier.png", "Figure 6.12 — Dossier medical chiffre"),
            ("ui_13_admin.png", "Figure 6.13 — Console administrateur"),
            ("ui_14_doctor_dashboard.png", "Figure 6.14 — Dashboard medecin"),
            ("ui_15_doctor_appointments.png", "Figure 6.15 — RDV cote medecin"),
        ]

    for name, caption in shots:
        pdf.ui(name, caption)
