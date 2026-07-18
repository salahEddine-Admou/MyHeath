#!/usr/bin/env python3
"""Capture live UI screenshots from https://heracare.vercel.app for the PFE report."""

from __future__ import annotations

from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "https://heracare.vercel.app"
OUT = Path(__file__).resolve().parent.parent / "docs" / "figures" / "ui"
OUT.mkdir(parents=True, exist_ok=True)

VIEWPORT = {"width": 1440, "height": 900}


def shot(page, name: str, full_page: bool = False):
    path = OUT / name
    page.screenshot(path=str(path), full_page=full_page)
    print("wrote", path)


def login(page, email: str, password: str):
    page.goto(f"{BASE}/login", wait_until="networkidle", timeout=60000)
    page.wait_for_timeout(800)
    # Clear and fill — Login.jsx pre-fills patient demo
    email_input = page.locator('input[type="email"], input[name="email"]').first
    pass_input = page.locator('input[type="password"]').first
    email_input.fill(email)
    pass_input.fill(password)
    page.locator('button[type="submit"]').first.click()
    page.wait_for_url("**/dashboard**", timeout=45000)
    page.wait_for_timeout(1500)


def logout(page):
    # Clear token and go login
    page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
    page.goto(f"{BASE}/login", wait_until="domcontentloaded")
    page.wait_for_timeout(500)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport=VIEWPORT, locale="en-US")
        page = context.new_page()

        # Public pages
        page.goto(BASE + "/", wait_until="networkidle", timeout=60000)
        page.wait_for_timeout(1200)
        shot(page, "ui_01_landing.png", full_page=True)

        page.goto(BASE + "/login", wait_until="networkidle", timeout=60000)
        page.wait_for_timeout(800)
        shot(page, "ui_02_login.png")

        page.goto(BASE + "/register", wait_until="networkidle", timeout=60000)
        page.wait_for_timeout(800)
        shot(page, "ui_03_register.png")

        # Patient journey
        login(page, "patient@myheath.app", "Patient123")
        shot(page, "ui_04_dashboard.png", full_page=True)

        for route, name in [
            ("/suivi", "ui_05_suivi.png"),
            ("/period", "ui_06_period.png"),
            ("/diabetes", "ui_07_diabetes.png"),
            ("/ai", "ui_08_ai.png"),
            ("/appointments", "ui_09_appointments.png"),
            ("/medications", "ui_10_medications.png"),
            ("/chat", "ui_11_chat.png"),
            ("/dossier", "ui_12_dossier.png"),
        ]:
            page.goto(BASE + route, wait_until="networkidle", timeout=60000)
            page.wait_for_timeout(1200)
            shot(page, name, full_page=True)

        # Admin
        logout(page)
        login(page, "admin@myheath.app", "Admin123")
        page.goto(BASE + "/admin", wait_until="networkidle", timeout=60000)
        page.wait_for_timeout(1500)
        shot(page, "ui_13_admin.png", full_page=True)

        # Doctor
        logout(page)
        login(page, "doctor@myheath.app", "Doctor123")
        shot(page, "ui_14_doctor_dashboard.png", full_page=True)
        page.goto(BASE + "/appointments", wait_until="networkidle", timeout=60000)
        page.wait_for_timeout(1000)
        shot(page, "ui_15_doctor_appointments.png", full_page=True)

        browser.close()
    print("Done. Screenshots in", OUT)


if __name__ == "__main__":
    main()
