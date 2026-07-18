"""English body for MyHeath ASP.NET Core PFE report — dense technical content."""

from __future__ import annotations

from rapport_ui_gallery import write_ui_gallery
from rapport_catalog import write_tech_catalog, write_features_catalog

AUTHOR = "Nezha Fekoussa"
SUPERVISOR = "Salah Eddine Admou"


def write_body_en(pdf) -> None:
    # ------------------------------------------------------------------ #
    # 1. Introduction
    # ------------------------------------------------------------------ #
    pdf.h1("1. Introduction and context")
    pdf.h2("1.0 Chapter introduction")
    pdf.p(
        "This opening chapter frames the MyHeath Final Year Project: the digital "
        "telemedicine context, the fragmentation problem in consumer health apps, "
        "the technical objectives (ASP.NET Core, React, MongoDB) and the report "
        f"structure. It also states the scope and deliverables produced by {AUTHOR} "
        f"under the supervision of {SUPERVISOR}."
    )
    pdf.h2("1.1 General context")
    pdf.p(
        "Digital transformation in healthcare is accelerating the adoption of platforms that "
        "combine remote monitoring, prevention and structured patient-doctor coordination. "
        "Beyond simple wellness trackers, modern telemedicine systems must handle sensitive "
        "clinical data, enforce role-based access, and remain deployable both on a laptop "
        "(Docker Compose for a jury demonstration) and in the cloud (Atlas, Azure, Vercel)."
    )
    pdf.p(
        "MyHeath is a telemedicine and personal-health platform focused on daily wellness "
        "logging, diabetes follow-up, menstrual-cycle insights, encrypted messaging with an "
        "assigned clinician, appointment booking, medication reminders, subscription plans "
        "and an AI coaching layer (Anthropic Claude). The product deliberately unifies "
        "women's and men's health modules behind one React dashboard and one REST contract, "
        "while the persistence and security layers treat health data as confidential by default."
    )
    pdf.h2("1.2 Problem statement")
    pdf.p(
        "Consumer health applications often fragment the care journey: one app for the menstrual "
        "cycle, another for glucose, a generic messenger with no clinician binding, and little "
        "administrative visibility for subscription or audit. Sensitive fields are frequently "
        "stored in clear text. From a software-engineering standpoint, this raises three gaps:"
    )
    pdf.bullet("Functional fragmentation — no single coherent patient pathway")
    pdf.bullet("Security gap — missing encryption at rest and weak access control")
    pdf.bullet("Industrialization gap — hard to demo, document and redeploy for a PFE jury")
    pdf.p(
        "MyHeath addresses these gaps with a documented ASP.NET Core 8 API, MongoDB persistence, "
        "AES-256-CBC at rest for clinical payloads, JWT + RBAC, Docker multi-stage builds, "
        "Swagger OpenAPI and a seed dataset for immediate demonstration."
    )
    pdf.h2("1.3 Objectives")
    pdf.p("The project objectives are both pedagogical and technical:")
    pdf.bullet("Design and implement a REST API on ASP.NET Core 8 (C#) with clear layering")
    pdf.bullet("Preserve a professional React 18 / Vite / Tailwind dashboard (role-aware sidebar)")
    pdf.bullet("Persist flexible health documents in MongoDB 7 (local Compose or Atlas)")
    pdf.bullet("Secure the system: BCrypt (cost 12), JWT HMAC-SHA256, AES-256-CBC, RBAC")
    pdf.bullet("Integrate Claude AI with an explicit non-diagnostic medical disclaimer")
    pdf.bullet("Deliver appointments, in-app notifications, medication reminders and admin audit")
    pdf.bullet("Industrialize with Docker Compose and publish installation guides for the jury")
    pdf.bullet("Keep API parity with an optional Node.js backend to illustrate contract stability")
    pdf.h2("1.4 Scope and deliverables")
    pdf.p(
        f"This memoir focuses on the .NET backend implementation, developed by {AUTHOR} under "
        f"the supervision of {SUPERVISOR}. A compatible Node.js / Express API remains in the "
        "repository for comparative evaluation (same JSON camelCase contract, same JWT claim "
        "`id`, same AES `iv_hex:ciphertext_hex` format). Deliverables include: public GitHub "
        "source code, French and English PDF reports, UML figures, GUIDE_INSTALLATION.md and "
        "FOR_PROFESSOR.txt."
    )
    pdf.h2("1.5 Report organization")
    pdf.p(
        "Chapter 2 analyses functional and non-functional requirements. Chapter 3 presents the "
        "3-tier architecture and technology stack. Chapter 4 details design (data model, "
        "security, predictive algorithms). Chapter 5 documents backend modules and routes. "
        "Chapter 6 describes the React frontend. Chapter 7 covers Docker and cloud deployment. "
        "Chapters 8-11 address testing, Node vs .NET comparison, security/compliance and "
        "conclusions. Chapter 12 and the appendices provide complementary technical depth, "
        "sample requests, a jury checklist, a glossary and references."
    )
    pdf.h2("1.6 Chapter conclusion")
    pdf.p(
        "Chapter 1 established why a unified, secure and demo-ready platform is needed. "
        "The stated objectives guide the rest of the memoir, starting with a formal "
        "requirements analysis."
    )

    # ------------------------------------------------------------------ #
    # 2. Requirements
    # ------------------------------------------------------------------ #
    pdf.h1("2. Requirements analysis")
    pdf.h2("2.0 Chapter introduction")
    pdf.p(
        "This chapter formalises MyHeath requirements: existing solutions, actors "
        "(patient, doctor, admin), functional needs (auth, tracking, telemedicine, "
        "admin) and non-functional targets (security, portability, documentation). "
        "It is the specification that justifies later architecture choices."
    )
    pdf.h2("2.1 Existing solutions")
    pdf.p(
        "The market offers many specialized applications (cycle trackers, diabetes logs, "
        "generic teleconsultation). Academic PFE projects often stop at a CRUD prototype "
        "without encryption, without RBAC, without Docker, or without a coherent admin "
        "console. MyHeath positions itself as an integrated engineering platform: telemedicine "
        "+ encrypted records + subscriptions + AI + administration, with dual backend "
        "implementations that prove the frontend is decoupled from the server technology."
    )
    pdf.h2("2.2 Actors")
    pdf.table(
        ["Actor", "Main goals"],
        [
            ["Patient (F/M)", "Daily suivi, diabetes, cycle, AI, RDV, medications, chat"],
            ["Doctor", "Assigned patients, encrypted chat, appointments, consult notes"],
            ["Administrator", "Users, FREE/CARE/PREMIUM plans, subscriptions, audit, KPIs"],
        ],
    )
    pdf.p(
        "Gender is stored on the patient profile (`woman` / `man`) and influences which "
        "predictive weights and UI modules are emphasized (for example recovery scoring for "
        "men, cycle insights for women). Diabetes is an optional profile flag that activates "
        "glucose fields and adherence metrics."
    )
    pdf.h2("2.3 Functional requirements")
    pdf.h3("FR1 — Authentication and profiles")
    pdf.bullet("Public registration limited to patient|doctor; admin is seeded only")
    pdf.bullet("Login returns JWT (7-day expiry) + sanitized user DTO")
    pdf.bullet("GET /api/auth/me hydrates the current session from the `id` claim")
    pdf.bullet("Patients may assign / reassign a doctor; doctors list via GET /api/auth/doctors")
    pdf.h3("FR2 — Health tracking")
    pdf.bullet("Daily journal upsert (sleep, stress, mood, activity, optional glucose)")
    pdf.bullet("Predictive wellness score 0-100 with label (excellent / good / fair / low / concerning)")
    pdf.bullet("Period logging and insights: average length, ovulation window, phase, anomalies")
    pdf.bullet("Encrypted medical record (allergies, treatments, clinical notes)")
    pdf.h3("FR3 — Telemedicine")
    pdf.bullet("AES-encrypted patient-doctor messaging with partner filtering by role")
    pdf.bullet("Appointments: video / chat / in-person; status workflow; doctor notifications")
    pdf.bullet("In-app notification centre for booking and system events")
    pdf.h3("FR4 — Administration and pedagogical monetization")
    pdf.bullet("User CRUD, activate/deactivate accounts")
    pdf.bullet("Subscription plans FREE / CARE / PREMIUM with feature flags")
    pdf.bullet("Assign or cancel user subscriptions; estimate MRR on the overview")
    pdf.bullet("Immutable-style audit trail of sensitive admin actions")
    pdf.h3("FR5 — AI coaching")
    pdf.bullet("Coach plan and wellness endpoints reserved to authenticated patients")
    pdf.bullet("Claude Messages API via typed HttpClient; 503 if API key missing")
    pdf.bullet("UI + API disclaimer: educational support, not a medical diagnosis")
    pdf.h2("2.4 Non-functional requirements")
    pdf.table(
        ["Criterion", "Target"],
        [
            ["Security", "JWT + BCrypt12 + AES-256-CBC + RBAC + audit"],
            ["Portability", "Docker Compose (mongo + api + frontend)"],
            ["Maintainability", "Controllers / Services / Models / Program.cs DI"],
            ["Documentability", "Swagger OpenAPI + PFE reports FR/EN"],
            ["Demo readiness", "Seed accounts + jury guide under 10 minutes"],
            ["Contract stability", "JSON camelCase shared with Node backend"],
            ["Performance (demo)", "Local API response typically under 300 ms on healthcheck"],
        ],
    )
    pdf.fig("fig_2_3_usecase.png", "Figure 2.3 — Use case diagram")
    pdf.h2("2.5 Chapter conclusion")
    pdf.p(
        "Chapter 2 framed actors and requirements. Security and demo constraints "
        "call for a clear 3-tier architecture, detailed next."
    )

    # ------------------------------------------------------------------ #
    # 3. Architecture
    # ------------------------------------------------------------------ #
    pdf.h1("3. Technical architecture")
    pdf.h2("3.0 Chapter introduction")
    pdf.p(
        "This chapter presents MyHeath's logical and physical architecture: 3-tier "
        "split, technology stack, ASP.NET Core code layout, /api route map and "
        "intentional compatibility with the Node.js backend."
    )
    pdf.h2("3.1 Logical 3-tier architecture")
    pdf.p(
        "MyHeath follows a classical 3-tier architecture. The presentation tier is a React "
        "Single-Page Application built with Vite; it never accesses MongoDB directly. The "
        "application tier is an ASP.NET Core 8 Web API that owns business rules, encryption, "
        "JWT issuance and external AI calls. The data tier is MongoDB, either as a Compose "
        "service (`mongo:7`) or as MongoDB Atlas. Exchanges are JSON over HTTP(S). The "
        "frontend selects the active API through `VITE_API_URL` (for example "
        "`http://localhost:5080` for .NET or `http://localhost:5000` for Node)."
    )
    pdf.fig("fig_2_1_architecture.png", "Figure 2.1 — MyHeath 3-tier architecture")
    pdf.h2("3.2 Technology stack")
    pdf.table(
        ["Layer", "Technologies"],
        [
            ["Backend", "ASP.NET Core 8, C#, MongoDB.Driver, JWT Bearer, Swagger"],
            ["Frontend", "React 18, Vite, Tailwind CSS, Recharts, Axios, React Router"],
            ["Data", "MongoDB 7 (Compose) or MongoDB Atlas (srv URI)"],
            ["AI", "Anthropic Claude Messages API (HttpClient)"],
            ["Security", "BCrypt.Net, System.Security.Cryptography AES, JWT HMAC"],
            ["Ops", "Docker multi-stage, docker-compose.dotnet.yml, Vercel UI"],
        ],
    )
    write_tech_catalog(pdf, lang="en")
    pdf.h2("3.3 .NET solution organization")
    pdf.p(
        "The backend lives under `backend-dotnet/MyHeath.Api/`. Controllers expose HTTP "
        "endpoints; Services encapsulate Mongo access, crypto, JWT, Claude, seeding, scoring "
        "and audit; Models define BSON documents; `Program.cs` is the composition root."
    )
    pdf.code(
        "backend-dotnet/\n"
        "  MyHeath.Api/\n"
        "    Controllers/\n"
        "      Auth, Health, Suivi, Chat, Ai, Admin,\n"
        "      Appointments, Notifications, Medications, Healthcheck\n"
        "    Models/Entities.cs   User, DailyHealthLog, Message, Plan...\n"
        "    Services/\n"
        "      MongoContext, AesCryptoService, JwtTokenService,\n"
        "      ClaudeService, SeedService, HealthScoreService,\n"
        "      CycleAnalyzer, AuditService, UserMapper\n"
        "    Infrastructure/AuthExtensions.cs\n"
        "    Program.cs           DI, CORS, Swagger, JWT, seed on startup\n"
        "  Dockerfile             multi-stage sdk:8.0 -> aspnet:8.0\n"
        "docker-compose.dotnet.yml"
    )
    pdf.fig("fig_3_1_backend.png", "Figure 3.1 — Backend organization (ASP.NET Core)")
    pdf.h2("3.4 API route map")
    pdf.p(
        "All business routes are prefixed with `/api`. Swagger UI is exposed at `/swagger` "
        "and includes a Bearer security definition so the jury can authorize and exercise "
        "protected endpoints without Postman. A public smoke endpoint "
        "`GET /api/healthcheck` returns `{ status: \"ok\" }` for Compose readiness checks."
    )
    pdf.fig("fig_3_3_routes.png", "Figure 3.3 — API route map")
    pdf.h2("3.5 Cross-cutting configuration in Program.cs")
    pdf.p(
        "At startup the API registers a MongoDB convention pack "
        "(`CamelCaseElementNameConvention` + `IgnoreExtraElementsConvention`) so C# properties "
        "align with the React/Node camelCase documents. Controllers serialize with "
        "`JsonNamingPolicy.CamelCase` and omit nulls. Authentication uses "
        "`JwtBearerDefaults` with `MapInboundClaims = false` and `NameClaimType = \"id\"` "
        "so the same claim name as the Node API is preserved. CORS origins come from "
        "`CLIENT_URL` (comma-separated). After the pipeline is built, `SeedService` ensures "
        "demo users and plans exist."
    )
    pdf.h2("3.6 Compatibility with the Node.js backend")
    pdf.p(
        "Keeping two backends behind one SPA is intentional: it demonstrates the "
        "interface/implementation separation principle. The shared contract includes:"
    )
    pdf.bullet("REST paths under /api with identical resource names")
    pdf.bullet("JWT payload fields: id, role, email; Authorization: Bearer <token>")
    pdf.bullet("AES storage format iv_hex:ciphertext_hex (lowercase hex)")
    pdf.bullet("User DTO shape returned by login/me (no password hash)")
    pdf.p(
        "Switching backends for a jury demo is therefore a single environment variable change "
        "on the frontend, not a UI rewrite."
    )
    pdf.h2("3.7 Chapter conclusion")
    pdf.p(
        "The chosen architecture separates presentation, application and data behind "
        "a stable REST contract, enabling Vercel + Docker deployment and preparing "
        "the detailed design of models, security and predictive engines."
    )

    # ------------------------------------------------------------------ #
    # 4. Design
    # ------------------------------------------------------------------ #
    pdf.h1("4. Detailed design")
    pdf.h2("4.0 Chapter introduction")
    pdf.p(
        "This chapter goes deeper into design: MongoDB model, JWT authentication, "
        "AES-256-CBC encryption, and the two predictive pipelines (HealthScoreService "
        "and CycleAnalyzer), before controller-level implementation."
    )
    pdf.h2("4.1 Data model")
    pdf.p(
        "MongoDB was chosen because health journals are document-oriented and evolve during "
        "a PFE (new glucose fields, medication schedules, audit payloads). Collections are "
        "accessed through typed `IMongoCollection<T>` properties on `MongoContext`."
    )
    pdf.table(
        ["Collection", "Purpose"],
        [
            ["users", "Accounts, roles, gender, doctorId, diabetes flags"],
            ["dailyhealthlogs", "Per-day wellness upsert + computed score"],
            ["symptomlogs", "Period starts and symptom severity"],
            ["healthrecords", "Encrypted allergies / treatments / notes"],
            ["messages", "Encrypted chat payloads + partners"],
            ["subscriptionplans", "FREE / CARE / PREMIUM definitions"],
            ["usersubscriptions", "Active plan binding per user"],
            ["appointments", "Scheduled consultations and modes"],
            ["appnotifications", "In-app notification feed"],
            ["medicationreminders", "Patient medication schedules"],
            ["auditlogs", "Admin action history"],
        ],
    )
    pdf.fig("fig_2_6_class.png", "Figure 2.6 — Domain model (excerpt)")
    pdf.h2("4.2 Application security")
    pdf.h3("Password hashing and JWT authentication")
    pdf.p(
        "Passwords are never stored in clear text. Registration and seeding hash with BCrypt "
        "at work factor 12. `JwtTokenService` issues an HMAC-SHA256 token valid for seven days, "
        "embedding at least the user `id` and `role`. Controllers read the caller via "
        "extension helpers on `ClaimsPrincipal`. Inactive users (`isActive = false`) are "
        "rejected at login."
    )
    pdf.fig("fig_2_4_sequence_login.png", "Figure 2.4 — JWT authentication sequence")
    pdf.h3("AES-256-CBC encryption at rest")
    pdf.p(
        "Allergies, medications, clinical notes and chat message bodies are encrypted before "
        "persistence. `AesCryptoService` derives a 256-bit key by SHA-256 hashing "
        "`AES_SECRET_KEY`, generates a random 16-byte IV per encryption, uses CBC + PKCS7, "
        "and stores `iv_hex:ciphertext_hex`. Decryption attempts JSON deserialization so "
        "structured objects round-trip cleanly; plain strings remain strings. The format is "
        "byte-compatible with the Node `crypto` helper, which is critical for dual-backend demos."
    )
    pdf.fig("fig_2_7_aes.png", "Figure 2.7 — AES-256-CBC encryption pipeline")
    pdf.h3("Authorization (RBAC)")
    pdf.p(
        "ASP.NET `[Authorize(Roles = \"admin\")]` (and equivalents for doctor/patient) guards "
        "controllers. Chat partner discovery further filters by assignment: a patient only "
        "sees their doctor; a doctor sees assigned patients; an admin may see all. "
        "AI coach endpoints are patient-only. Admin audit records actor, entity, action and "
        "detail JSON for forensic review during the oral defence."
    )
    pdf.h2("4.3 Predictive analysis algorithms")
    pdf.p(
        "MyHeath runs two separate deterministic pipelines — not one linear chain that would "
        "incorrectly imply CycleAnalyzer depends on the wellness score. Both engines use "
        "explicit rules (defensible in a PFE oral exam) rather than opaque ML."
    )
    pdf.h3("Pipeline A — Wellness score (HealthScoreService)")
    pdf.p(
        "The patient submits a daily journal via POST /api/suivi/daily. SuiviController upserts "
        "a DailyHealthLog in MongoDB, then calls HealthScoreService.Compute. Extracted features "
        "include sleep hours and quality, energy, inverted stress, mood, hydration, exercise "
        "minutes and steps. The User profile modulates weights: recovery and stronger activity "
        "weighting for men; fasting/post-meal glucose penalties plus a medication-adherence "
        "bonus when hasDiabetes is true. Output: score in [0, 100] and a label "
        "(excellent / good / fair / low / concerning) rendered on Recharts dashboards."
    )
    pdf.bullet("Sleep: optimal band 7-9 h, averaged with sleep quality")
    pdf.bullet("Energy (direct), stress as (10 - stress), mood dictionary mapping")
    pdf.bullet("Hydration vs 2.5 L target; activity from minutes + steps")
    pdf.bullet("Men: +recovery; diabetes: glucose terms + tookMedication bonus")
    pdf.bullet("Labels: >=85 excellent, >=70 good, >=55 fair, >=40 low, else concerning")
    pdf.h3("Pipeline B — Cycle insights (CycleAnalyzer)")
    pdf.p(
        "Period starts and symptom logs (pain level) are stored, then aggregated by "
        "GET /api/health/insights. CycleAnalyzer computes inter-period lengths (kept if "
        "0 < length < 90), average cycle length (default 28), next period date, ovulation "
        "peak at next-14 days with a +/-2 day window, current phase (menstrual / follicular / "
        "ovulatory / luteal), and anomalies: length standard deviation > 7 days, or repeated "
        "severe pain (painLevel >= 7 at least three times). When anomalies exist, "
        "recommendConsultation becomes true for patient/doctor alerts."
    )
    pdf.fig("fig_2_8_predictive.png", "Figure 2.8 — Predictive pipelines (score + cycle)")
    pdf.fig("fig_2_5_sequence_insights.png", "Figure 2.5 — Cycle insights sequence")
    pdf.h2("4.4 Chapter conclusion")
    pdf.p(
        "Detailed design fixed the document model, defence-in-depth security and "
        "explainable predictive engines. Chapter 5 turns these decisions into "
        "ASP.NET Core modules."
    )

    # ------------------------------------------------------------------ #
    # 5. Implementation
    # ------------------------------------------------------------------ #
    pdf.h1("5. ASP.NET Core backend implementation")
    pdf.h2("5.0 Chapter introduction")
    pdf.p(
        "This chapter describes the concrete API realisation: Auth, Health/Suivi, "
        "Chat/AI, Admin, appointments, notifications, medications and SeedService "
        "for jury demonstration."
    )
    pdf.h2("5.1 Auth module (AuthController)")
    pdf.p(
        "`AuthController` is the entry point for identity. Registration validates email "
        "uniqueness (HTTP 409 on conflict), restricts public roles to patient|doctor, hashes "
        "the password and persists the user. Login verifies BCrypt and returns "
        "`{ token, user }`. Additional endpoints hydrate the session, list doctors and "
        "bind a patient to a clinician."
    )
    pdf.bullet("POST /api/auth/register — create account (patient|doctor)")
    pdf.bullet("POST /api/auth/login — JWT + user DTO")
    pdf.bullet("GET /api/auth/me — current profile from Bearer token")
    pdf.bullet("GET /api/auth/doctors — directory for assignment UI")
    pdf.bullet("POST /api/auth/assign-doctor — set patient.doctorId")
    pdf.h2("5.2 Health and daily suivi")
    pdf.p(
        "`HealthController` manages symptom logs, period events, insights aggregation via "
        "`CycleAnalyzer`, and the encrypted health record (encrypt on write, decrypt on read). "
        "`SuiviController` performs a daily upsert keyed by user + calendar day, invokes "
        "`HealthScoreService.Compute`, returns history/trends and a diabetes overview "
        "(adherence percentage, average fasting/post-meal glucose when present)."
    )
    pdf.bullet("POST /api/suivi/daily — upsert log + score")
    pdf.bullet("GET /api/suivi/history — time series for charts")
    pdf.bullet("GET /api/suivi/diabetes — adherence and glucose averages")
    pdf.bullet("GET /api/health/insights — cycle analytics payload")
    pdf.bullet("GET/PUT /api/health/record — encrypted dossier")
    pdf.h2("5.3 Chat and AI")
    pdf.p(
        "`ChatController` lists partners according to role rules, returns conversation "
        "threads and encrypts message bodies with `AesCryptoService` before insert. "
        "`AiController` delegates to `ClaudeService` (typed `HttpClient`). Endpoints such as "
        "coach-plan and wellness tips are `[Authorize(Roles = \"patient\")]`. If "
        "`ANTHROPIC_API_KEY` is absent, the API returns 503 with a clear message so the demo "
        "can continue without AI. Responses always remind that output is educational."
    )
    pdf.fig("fig_2_9_ai.png", "Figure 2.9 — Claude AI Coach integration")
    pdf.h2("5.4 Administration and subscriptions")
    pdf.p(
        "`AdminController` powers the admin console: KPI overview (users, active subscriptions, "
        "estimated MRR), user listing/update/deactivation, plan CRUD, subscription assign/cancel, "
        "and `GET /api/admin/audit`. `AuditService` appends structured entries whenever a "
        "sensitive mutation occurs (who, what entity, action verb, detail object)."
    )
    pdf.h2("5.5 Advanced operational features")
    pdf.table(
        ["Feature", "Route prefix", "Roles"],
        [
            ["Appointments", "/api/appointments", "patient / doctor / admin"],
            ["Notifications", "/api/notifications", "authenticated"],
            ["Medication reminders", "/api/medications", "patient"],
            ["Admin audit", "/api/admin/audit", "admin"],
            ["Healthcheck", "/api/healthcheck", "public"],
            ["Swagger UI", "/swagger", "public (dev/demo)"],
        ],
    )
    pdf.p(
        "Appointment creation notifies the target doctor through `appnotifications`. "
        "Medication reminders store schedule metadata so the patient UI can surface today's "
        "doses. These modules illustrate how the same Mongo + JWT foundation extends without "
        "rewriting authentication."
    )
    pdf.h2("5.6 SeedService and demo accounts")
    pdf.p(
        "On application start, `SeedService` idempotently creates admin, doctor, female patient, "
        "male patient and FREE/CARE/PREMIUM plans when missing. This removes friction for the "
        "jury: Compose up, open the SPA, log in. Passwords follow the documented demo set "
        "(Admin123 / Doctor123 / Patient123)."
    )
    pdf.h2("5.7 Error handling conventions")
    pdf.p(
        "Controllers return JSON `{ message }` (and optional fields) with HTTP semantics: "
        "400 validation, 401 missing/invalid token, 403 insufficient role, 404 missing "
        "resource, 409 email conflict, 503 AI not configured. This keeps the Axios client "
        "error UX consistent across Node and .NET."
    )
    write_features_catalog(pdf, lang="en")
    pdf.h2("5.9 Chapter conclusion")
    pdf.p(
        "The .NET backend covers the full functional contract with a clear "
        "Controllers/Services layout. Chapter 6 shows how the React frontend "
        "consumes it, including the live Vercel deployment."
    )

    # ------------------------------------------------------------------ #
    # 6. Frontend
    # ------------------------------------------------------------------ #
    pdf.h1("6. React frontend")
    pdf.h2("6.0 Chapter introduction")
    pdf.p(
        "This chapter presents the React interface (dashboard shell, role-based "
        "navigation, Axios integration) and includes real screenshots of the app "
        "deployed at https://heracare.vercel.app for patient, doctor and admin roles."
    )
    pdf.h2("6.1 User experience shell")
    pdf.p(
        "The UI adopts a dashboard shell: dark sidebar, light content canvas, role-based "
        "navigation. Administrators open Overview, Users, Subscriptions and Plans (also "
        "reachable via `/admin?tab=...`). Patients navigate Suivi, Period, Diabetes, "
        "Medications, AI Coach, Records, Appointments and Chat. Doctors focus on patients, "
        "appointments and messaging. Charts use Recharts for trends and cycle lengths."
    )
    pdf.h2("6.2 API integration layer")
    pdf.p(
        "Axios is configured with a request interceptor that attaches "
        "`Authorization: Bearer` from `localStorage.myheath_token`. Domain services "
        "(`healthService`, `suiviService`, `adminService`, `extraService`, etc.) map UI "
        "actions to REST calls. `VITE_API_URL` is injected at build time; for local .NET "
        "work it points to port 5080. Logout clears the token and redirects to login."
    )
    pdf.h2("6.3 UX and safety notes")
    pdf.bullet("Readable errors when the .NET API is down (connection refused / CORS)")
    pdf.bullet("Medical disclaimer on AI screens (not a diagnosis)")
    pdf.bullet("Mobile drawer for the sidebar on narrow viewports")
    pdf.bullet("Protected routes redirect unauthenticated users to /login")
    pdf.bullet("Admin routes refuse non-admin roles on the client as a first gate (API still enforces)")
    write_ui_gallery(pdf, lang="en")
    pdf.h2("6.5 Chapter conclusion")
    pdf.p(
        "The frontend delivers a role-aware experience aligned with the API. Live "
        "Vercel captures confirm that landing, dashboard, health modules, chat, "
        "admin and doctor spaces work in real conditions."
    )

    # ------------------------------------------------------------------ #
    # 7. Docker
    # ------------------------------------------------------------------ #
    pdf.h1("7. Docker and deployment")
    pdf.h2("7.0 Chapter introduction")
    pdf.p(
        "After the UI, this chapter covers industrialisation: .NET multi-stage "
        "Dockerfile, docker-compose.dotnet.yml, environment variables, cloud "
        "scenarios (Vercel, Atlas, Azure) and jury documentation."
    )
    pdf.h2("7.1 Multi-stage containerization")
    pdf.p(
        "The API Dockerfile uses a multi-stage build: the SDK 8.0 image restores and publishes "
        "the project; the final image is `mcr.microsoft.com/dotnet/aspnet:8.0`, exposing port "
        "5080. This keeps the runtime image smaller and free of compilers. "
        "`docker-compose.dotnet.yml` orchestrates MongoDB, the API and the Vite frontend, "
        "wiring environment variables and dependency order."
    )
    pdf.code(
        "git clone https://github.com/salahEddine-Admou/MyHeath.git\n"
        "cd MyHeath\n"
        "docker compose -f docker-compose.dotnet.yml up --build\n"
        "# UI      http://localhost:5173\n"
        "# API     http://localhost:5080/api/healthcheck\n"
        "# Swagger http://localhost:5080/swagger"
    )
    pdf.fig("fig_2_2_deployment.png", "Figure 2.2 — Deployment topology")
    pdf.h2("7.2 Environment variables")
    pdf.table(
        ["Variable", "Role"],
        [
            ["MONGODB_URI", "Mongo connection string (Compose service or Atlas)"],
            ["MONGODB_DATABASE", "Database name (default myheath)"],
            ["JWT_SECRET", "HMAC signing key for tokens"],
            ["AES_SECRET_KEY", "Passphrase hashed to AES-256 key"],
            ["CLIENT_URL", "Allowed CORS origin(s), comma-separated"],
            ["ANTHROPIC_API_KEY", "Optional Claude access"],
            ["PORT", "HTTP listen port (default 5080)"],
        ],
    )
    pdf.p(
        "Secrets must never be committed. Local `.env` files and cloud App Settings hold "
        "production values; the public repository only documents variable names."
    )
    pdf.h2("7.3 Cloud deployment scenarios")
    pdf.bullet("Frontend: Vercel (Vite build, public VITE_API_URL)")
    pdf.bullet("API .NET: Azure App Service / Container Apps, Render, or a Docker VM")
    pdf.bullet("Data: MongoDB Atlas with `mongodb+srv://` URI and network IP allow-list")
    pdf.bullet("Optional: GitHub Actions for build/publish (future CI work)")
    pdf.h2("7.4 Jury documentation")
    pdf.p(
        "GUIDE_INSTALLATION.md and FOR_PROFESSOR.txt describe the shortest path from clone "
        "to login, including demo credentials and which compose file targets the .NET stack."
    )
    pdf.h2("7.5 Chapter conclusion")
    pdf.p(
        "Docker Compose and the installation guide make the platform reproducible. "
        "Cloud deployment (Vercel + Atlas) complements local demos. Chapter 8 "
        "validates functional and security behaviour."
    )

    # ------------------------------------------------------------------ #
    # 8. Testing
    # ------------------------------------------------------------------ #
    pdf.h1("8. Testing and validation")
    pdf.h2("8.0 Chapter introduction")
    pdf.p(
        "This chapter describes the validation strategy: smoke tests, functional "
        "journeys, 401/403 checks, demo accounts and acceptance criteria for the jury."
    )
    pdf.h2("8.1 Test strategy")
    pdf.p(
        "Given the academic schedule, validation prioritizes end-to-end demonstrability and "
        "security smoke checks over a full automated suite (automation remains a stated "
        "perspective)."
    )
    pdf.bullet("Smoke: GET /api/healthcheck returns ok after Compose up")
    pdf.bullet("Functional: login -> daily suivi -> appointment -> admin subscription assign")
    pdf.bullet("Security: 401 without token; 403 when role is insufficient")
    pdf.bullet("Crypto: encrypted fields unreadable in Mongo shell; readable after API decrypt")
    pdf.bullet("Swagger: manual DTO validation for login, suivi and appointments")
    pdf.bullet("Cross-backend: same frontend against Node :5000 and .NET :5080")
    pdf.h2("8.2 Demonstration accounts")
    pdf.table(
        ["Role", "Email", "Password"],
        [
            ["Admin", "admin@myheath.app", "Admin123"],
            ["Doctor", "doctor@myheath.app", "Doctor123"],
            ["Patient (F)", "patient@myheath.app", "Patient123"],
            ["Patient (M)", "man@myheath.app", "Patient123"],
        ],
    )
    pdf.h2("8.3 Acceptance criteria")
    pdf.bullet("docker compose -f docker-compose.dotnet.yml up --build starts without fatal errors")
    pdf.bullet("Sidebar navigation works for each role after login")
    pdf.bullet("Chat and health record decrypt correctly for authorized users")
    pdf.bullet("Admin can assign CARE/PREMIUM and see audit entries")
    pdf.bullet("No production secrets committed to the public GitHub repository")
    pdf.h2("8.4 Chapter conclusion")
    pdf.p(
        "Manual tests and seed accounts confirm demonstrability. Chapter 9 compares "
        "both backends to justify the .NET choice in this C# academic context."
    )

    # ------------------------------------------------------------------ #
    # 9. Comparison
    # ------------------------------------------------------------------ #
    pdf.h1("9. Node.js versus ASP.NET Core")
    pdf.h2("9.0 Chapter introduction")
    pdf.p(
        "This chapter objectively compares Node.js/Express and ASP.NET Core 8 behind "
        "the same React contract, highlighting typing, DI and Swagger benefits for a C# PFE."
    )
    pdf.p(
        "Both backends expose the same REST contract so the React client remains unchanged. "
        "Node.js / Express favours rapid prototyping and fits serverless hosts such as Vercel "
        "functions. ASP.NET Core 8 brings static typing, a mature DI container, first-class "
        "Swagger, compile-time safety and a direct match with a C# curriculum — which is the "
        "primary pedagogical reason for the .NET delivery of this PFE."
    )
    pdf.table(
        ["Criterion", "Node.js / Express", "ASP.NET Core 8"],
        [
            ["Language", "JavaScript", "C#"],
            ["Typing", "Dynamic (optional JSDoc/TS)", "Static / compiled"],
            ["DI", "Manual / libraries", "Built-in IServiceCollection"],
            ["API docs", "Often manual", "Swagger integrated"],
            ["Realtime path", "Socket.io (local Node)", "SignalR (future work)"],
            ["Docker base", "node image", "mcr.microsoft.com/dotnet"],
            ["PFE alignment", "Classic MERN", "Taught .NET stack"],
            ["Parity goal", "Reference implementation", "Feature-complete twin"],
        ],
    )
    pdf.p(
        "Feature parity for the jury includes auth, suivi, periods, diabetes overview, "
        "encrypted chat, AI coach hooks, admin subscriptions, appointments, notifications, "
        "medications and audit. Differences are intentional only where the platform idioms "
        "diverge (for example Swagger is richer on .NET)."
    )
    pdf.h2("9.1 Chapter conclusion")
    pdf.p(
        "Dual backends validate interface/implementation separation. ASP.NET Core "
        "remains the primary memoir deliverable; Node is the reference twin. "
        "Chapter 10 deepens security and compliance."
    )

    # ------------------------------------------------------------------ #
    # 10. Security
    # ------------------------------------------------------------------ #
    pdf.h1("10. Security and compliance")
    pdf.h2("10.0 Chapter introduction")
    pdf.p(
        "This chapter summarises countermeasures (HTTPS, JWT, BCrypt, AES, RBAC, audit, "
        "AI disclaimer) and situates MyHeath relative to Moroccan Law 09-08 and GDPR principles."
    )
    pdf.h2("10.1 Countermeasures implemented")
    pdf.bullet("HTTPS termination in production; CORS restricted to CLIENT_URL")
    pdf.bullet("JWT signed with a server secret; 7-day expiry; inactive users blocked")
    pdf.bullet("BCrypt cost 12 for password hashes")
    pdf.bullet("AES-256-CBC for sensitive documents and chat at rest")
    pdf.bullet("RBAC attributes on controllers + partner filtering in chat")
    pdf.bullet("Admin audit trail for sensitive mutations")
    pdf.bullet("AI disclaimer: educational assistance, not a clinical diagnosis")
    pdf.bullet("Secrets via environment variables — never hard-coded for production")
    pdf.h2("10.2 Compliance posture")
    pdf.p(
        "Encryption at rest, purpose limitation (health follow-up and telemedicine only), "
        "and access control align with good practices under Moroccan Law 09-08 on personal "
        "data protection and with GDPR security principles (integrity, confidentiality, "
        "accountability). MyHeath is an academic demonstrator: a production hospital system "
        "would additionally require formal DPIA, retention policies, key rotation and "
        "independent penetration testing."
    )
    pdf.h2("10.3 Threat-oriented notes")
    pdf.bullet("Stolen JWT: mitigate with HTTPS, short-lived tokens (future refresh tokens)")
    pdf.bullet("Mongo exposure: bind to internal Docker network; Atlas IP rules")
    pdf.bullet("Prompt injection on AI: treat outputs as advice only; never auto-prescribe")
    pdf.bullet("Privilege escalation: server-side role checks are authoritative, not the SPA")
    pdf.h2("10.4 Chapter conclusion")
    pdf.p(
        "Security is treated as a cross-cutting requirement, not a late add-on. "
        "Chapter 11 concludes the memoir and outlines future work."
    )

    # ------------------------------------------------------------------ #
    # 11. Conclusion
    # ------------------------------------------------------------------ #
    pdf.h1("11. Conclusion and future work")
    pdf.h2("11.0 Chapter introduction")
    pdf.p(
        "This closing chapter summarises the PFE outcomes, lists perspectives "
        "(SignalR, payments, mobile, CI, observability) and recalls GitHub, "
        "report and guide deliverables."
    )
    pdf.h2("11.1 Summary")
    pdf.p(
        f"This Final Year Project demonstrates the design and delivery of a complete "
        f"telemedicine platform. The ASP.NET Core 8 backend, developed by {AUTHOR} under the "
        f"supervision of {SUPERVISOR}, integrates with a React dashboard and MongoDB, ships "
        f"via Docker, enforces AES/JWT security, and exposes advanced features: appointments, "
        f"medications, subscriptions, audit and AI coaching. The dual-backend strategy "
        f"validates a stable API contract and strengthens the software-engineering narrative "
        f"of the memoir."
    )
    pdf.h2("11.2 Perspectives")
    pdf.bullet("SignalR hubs for realtime chat and notification push")
    pdf.bullet("Real payment provider integration for CARE/PREMIUM plans")
    pdf.bullet("React Native (or Flutter) mobile client on the same API")
    pdf.bullet("Automated unit/integration tests in GitHub Actions CI")
    pdf.bullet("Observability with OpenTelemetry or Azure Application Insights")
    pdf.bullet("Refresh-token rotation and stricter JWT issuer/audience validation")
    pdf.h2("11.3 Deliverables")
    pdf.bullet("Repository: https://github.com/salahEddine-Admou/MyHeath")
    pdf.bullet("Reports: docs/RAPPORT_PFE_MYHEATH_DOTNET.pdf and _EN.pdf")
    pdf.bullet("Guide: GUIDE_INSTALLATION.md / FOR_PROFESSOR.txt")
    pdf.bullet(f"Author: {AUTHOR}  |  Supervisor: {SUPERVISOR}")
    pdf.bullet("Live application: https://heracare.vercel.app")
    pdf.h2("11.4 Chapter conclusion")
    pdf.p(
        "MyHeath meets its goals: a complete telemedicine platform, documented .NET "
        "backend, deployed UI, security controls and jury-ready demos. Perspectives "
        "indicate the next industrial steps."
    )

    # ------------------------------------------------------------------ #
    # 12. Extra technical depth
    # ------------------------------------------------------------------ #
    pdf.h1("12. Complementary technical depth")
    pdf.h2("12.0 Chapter introduction")
    pdf.p(
        "This complementary chapter deepens technical points useful for the oral "
        "defence: DI, Mongo conventions, HTTP error codes and end-to-end flows."
    )
    pdf.h2("12.1 Dependency injection and composition root")
    pdf.p(
        "`Program.cs` registers `MongoContext`, `AesCryptoService`, `JwtTokenService`, "
        "`AuditService`, `SeedService` as singletons and `ClaudeService` via "
        "`AddHttpClient` for pooled HTTP. Controllers receive dependencies through "
        "constructor injection — the idiomatic ASP.NET Core pattern taught in industrial "
        "C# courses and directly applicable after graduation."
    )
    pdf.h2("12.2 MongoDB driver conventions")
    pdf.p(
        "The convention pack ensures element names are camelCase in BSON, matching the "
        "frontend and the Node ODM layer. `IgnoreExtraElements` prevents deserialization "
        "failures when older documents miss new fields (forward-compatible reads during "
        "iterative PFE development)."
    )
    pdf.h2("12.3 Health score weight formulas (summary)")
    pdf.code(
        "Base (woman, no diabetes):\n"
        "  total = 1.2*sleep + energy + (10-stress) + mood + water + activity\n"
        "  score = round(clamp(total / weightSum * 10, 0, 100))\n\n"
        "Man: activity * 1.3 + recovery term\n"
        "Diabetes: + 1.5*glucoseScore + (tookMedication ? 8 : 3)"
    )
    pdf.h2("12.4 End-to-end patient flow")
    pdf.code(
        "1. POST /api/auth/login\n"
        "2. POST /api/suivi/daily          -> score computed server-side\n"
        "3. GET  /api/health/insights      -> cycle analytics (if woman)\n"
        "4. POST /api/appointments        -> doctor notification created\n"
        "5. POST /api/ai/coach-plan       -> Claude (optional key)\n"
        "6. GET  /api/chat/partners\n"
        "7. POST /api/chat/send           -> AES ciphertext stored"
    )
    pdf.h2("12.5 Admin subscription flow")
    pdf.code(
        "1. Login as admin@myheath.app\n"
        "2. GET  /api/admin/overview      -> KPIs / estimated MRR\n"
        "3. POST /api/admin/subscriptions/assign\n"
        "      { userId, planCode: \"PREMIUM\" }\n"
        "4. GET  /api/admin/audit         -> assignment recorded"
    )
    pdf.h2("12.6 Local development without Docker")
    pdf.p(
        "Developers may run MongoDB locally or Atlas, then `dotnet run` inside "
        "`backend-dotnet/MyHeath.Api` with environment variables set, while `npm run dev` "
        "serves the SPA. This path is useful for breakpoint debugging in Visual Studio or "
        "Rider; Compose remains the recommended jury path."
    )
    pdf.h2("12.7 Chapter conclusion")
    pdf.p(
        "These technical notes reinforce understanding of the .NET runtime and "
        "prepare the appendices (requests, Docker checklist, glossary, references)."
    )

    # ------------------------------------------------------------------ #
    # Appendices
    # ------------------------------------------------------------------ #
    pdf.h1("Appendix A — Sample HTTP requests")
    pdf.p("Illustrative JSON bodies used during functional validation:")
    pdf.code(
        "POST /api/auth/login\n"
        '{ "email": "patient@myheath.app", "password": "Patient123" }\n\n'
        "POST /api/suivi/daily\n"
        '{ "sleepHours": 7.5, "sleepQuality": 8, "energy": 7, "stress": 3,\n'
        '  "mood": "good", "waterLiters": 2.0, "exerciseMinutes": 30,\n'
        '  "steps": 6000, "fastingGlucose": 105, "tookMedication": true }\n\n'
        "POST /api/appointments\n"
        '{ "doctorId": "<objectId>", "scheduledAt": "2026-08-01T10:00:00Z",\n'
        '  "mode": "video", "reason": "Diabetes follow-up" }\n\n'
        "POST /api/chat/send\n"
        '{ "receiverId": "<doctorId>", "content": "Hello doctor, my fasting glucose..." }'
    )

    pdf.h1("Appendix B — Docker checklist for the jury")
    for i, step in enumerate(
        [
            "Install and start Docker Desktop (Windows/macOS/Linux)",
            "Clone https://github.com/salahEddine-Admou/MyHeath.git",
            "Run: docker compose -f docker-compose.dotnet.yml up --build",
            "Open http://localhost:5080/api/healthcheck and verify status ok",
            "Open http://localhost:5080/swagger and authorize with a JWT after login",
            "Open http://localhost:5173 and sign in with a demo account",
            "As patient: create a daily log, book an appointment, open AI disclaimer",
            "As admin: assign a subscription and open the audit tab",
            "Optionally switch VITE_API_URL to the Node API to show contract parity",
        ],
        1,
    ):
        pdf.bullet(f"{i}. {step}")

    pdf.h1("Appendix C — Glossary")
    for term, defn in [
        ("JWT", "JSON Web Token — signed bearer credential for API auth"),
        ("AES", "Advanced Encryption Standard — symmetric encryption (here 256-bit CBC)"),
        ("RBAC", "Role-Based Access Control — patient / doctor / admin"),
        ("MRR", "Monthly Recurring Revenue — pedagogical subscription KPI"),
        ("DI", "Dependency Injection — ASP.NET Core IServiceCollection pattern"),
        ("Swagger", "Interactive OpenAPI documentation UI"),
        ("Atlas", "MongoDB Database-as-a-Service"),
        ("Compose", "Docker multi-container orchestration file"),
        ("BCrypt", "Adaptive password hashing algorithm (work factor 12)"),
        ("CORS", "Cross-Origin Resource Sharing — browser API access control"),
        ("PFE", "Projet de Fin d'Etudes / Final Year Project"),
        ("SPA", "Single-Page Application (React)"),
    ]:
        pdf.bullet(f"{term}: {defn}")

    pdf.h1("Appendix D — References")
    pdf.bullet("Microsoft Learn — ASP.NET Core 8 documentation")
    pdf.bullet("MongoDB C# Driver documentation")
    pdf.bullet("OWASP ASVS — Authentication and Cryptography chapters")
    pdf.bullet("Anthropic API — Messages endpoint reference")
    pdf.bullet("Docker documentation — multi-stage builds best practices")
    pdf.bullet("Moroccan Law 09-08 — personal data protection")
    pdf.bullet("GDPR — integrity and confidentiality of processing (Art. 5 / 32 principles)")
    pdf.bullet("RFC 7519 — JSON Web Token (JWT)")
