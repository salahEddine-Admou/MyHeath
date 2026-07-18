#!/usr/bin/env python3
"""Update ENSET cover Word doc (split runs): author Nezha Fekoussa + MyHeath."""

from pathlib import Path
from docx import Document
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Page de garde.docx"
OUT = ROOT / "docs" / "Page_de_garde_MyHeath.docx"

# Order matters — longer / more specific first
REPLACEMENTS = [
    ("Soufiane", "Nezha"),
    ("Boubella", "Fekoussa"),
    ("place des solutions E-Banking", "MyHeath — telemedecine (.NET / React / MongoDB)"),
    ("ADRIA", "MyHeath"),
    ("BUSINESS", "PFE"),
    ("TECHNOLOGY", "Academique"),
    ("2021-", "2025-"),
    ("2021", "2025"),
]


def main():
    doc = Document(str(SRC))
    changed = 0
    for node in doc.element.iter(qn("w:t")):
        if not node.text:
            continue
        new = node.text
        for a, b in REPLACEMENTS:
            if a in new:
                new = new.replace(a, b)
        # Year day leftovers like "/ 2022" in soutenance line
        if new.strip() == "2022":
            new = "2026"
        if "06/ 2022" in new:
            new = new.replace("06/ 2022", "06/ 2026")
        if "06/\n2022" in new:
            new = new.replace("2022", "2026")
        if new != node.text:
            node.text = new
            changed += 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(OUT))
    doc.save(str(SRC))
    print(f"Updated runs: {changed}")
    print("Saved:", SRC)
    print("Copy:", OUT)


if __name__ == "__main__":
    main()
