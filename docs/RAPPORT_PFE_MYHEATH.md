# MyHeath — Full PFE Report

The complete academic report (**55 pages**) is here:

- **PDF:** [`RAPPORT_PFE_MYHEATH.pdf`](./RAPPORT_PFE_MYHEATH.pdf)

## Contents overview

1. Cover, Dedication, Acknowledgments  
2. Abstract (EN) / Résumé (FR)  
3. Table of Contents, List of Figures & Tables  
4. General Introduction  
5. **Chapter 1** — Preliminary study & requirements  
6. **Chapter 2** — Architecture, UML, MongoDB, AES-256, predictive engine, AI design  
7. **Chapter 3** — Implementation (Auth, Health, Chat, Crypto, Analyzer, MyHeath AI, Frontend)  
8. **Chapter 4** — Testing & Vercel/Atlas deployment  
9. Conclusion & perspectives  
10. Bibliography + Annexes A–K  

## UML / architecture figures

High-resolution PNGs are in `docs/figures/` and embedded in the PDF:

- Use case, sequence (login / insights), class diagram
- 3-tier architecture, deployment, AES pipeline, predictive flowchart, AI pipeline

## Regenerate

```bash
python scripts/generate_uml_figures.py
python scripts/generate_rapport_55.py
```

**Author:** Nezha Fekoussa — 2025/2026
