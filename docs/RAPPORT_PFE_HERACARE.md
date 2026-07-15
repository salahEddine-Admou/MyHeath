# HeraCare — Extraits du Rapport de PFE

**Titre :** Conception et réalisation d’une plateforme intelligente de télémédecine et de suivi de santé féminine — *HeraCare*

**Filière :** Sciences de l’Ingénieur — Génie Informatique / Génie Logiciel

---

## Résumé (Français)

HeraCare est une application web de télémédecine dédiée à la santé féminine (FemTech). Elle combine un suivi menstruel prédictif, un dossier médical partagé sécurisé et une messagerie temps réel entre patientes et médecins. L’architecture repose sur la stack MERN (MongoDB, Express.js, React, Node.js), conteneurisée via Docker, avec un chiffrement AES-256-CBC des données de santé au repos, conformément aux principes de la loi 09-08 relative à la protection des personnes physiques à l’égard du traitement des données à caractère personnel (Maroc).

**Mots-clés :** FemTech, télémédecine, MERN, AES-256, Socket.io, algorithme prédictif, Loi 09-08, PFE

## Abstract (English)

HeraCare is a FemTech telemedicine web platform that provides predictive menstrual-cycle tracking, an encrypted shared medical record, and real-time patient–doctor messaging. Built on the MERN stack with Docker orchestration and AES-256-CBC encryption at rest, it demonstrates engineering practices aligned with personal-data protection requirements.

**Keywords:** FemTech, telemedicine, MERN, AES-256, Socket.io, predictive analytics

---

## Introduction Générale

### Contexte

La santé des femmes reste insuffisamment adressée par les systèmes numériques de santé, notamment dans les zones à faible densité médicale. Le marché FemTech connaît une croissance mondiale forte, mais l’offre nationale (Maroc / Maghreb) demeure fragmentée. HeraCare vise à combler ce fossé en proposant un suivi algorithmique du cycle et une consultation à distance sécurisée.

### Problématique

Comment concevoir une plateforme de télémédecine féminine qui (1) protège les données de santé sensibles, (2) apporte une valeur clinique via l’analyse prédictive des cycles et symptômes, et (3) s’appuie sur une architecture logicielle modulaire digne d’un projet d’ingénierie ?

### Objectifs

1. Spécifier et réaliser une architecture MERN modulaire (Auth, Dossier, Consultation, Engine d’analyse).
2. Implémenter un chiffrement AES-256 des données médicales et messages au repos.
3. Développer un moteur de prédiction de cycle et de détection d’anomalies (signaux SOPK / endométriose).
4. Déployer le frontend sur Vercel et documenter le backend cloud.

---

## Chapitre 2 : Conception et Modélisation

### 2.1 Architecture globale du système

HeraCare adopte une architecture **3-tiers** :

| Couche | Technologies | Rôle |
|--------|--------------|------|
| Présentation | React 18, Vite, Tailwind CSS, Recharts | Interfaces patiente / médecin |
| Logique métier | Node.js, Express, Socket.io | API REST + temps réel |
| Persistance | MongoDB (Mongoose) | Stockage documentaire NoSQL |

Le choix de **MongoDB** se justifie par :
- la souplesse des schémas pour des journaux de symptômes hétérogènes ;
- l’évolutivité horizontale adaptée aux micro-services futurs ;
- l’intégration native avec Node.js via Mongoose.

La **conteneurisation Docker** assure la reproductibilité de l’environnement (frontend, backend, MongoDB) et facilite les tests d’intégration ainsi que le déploiement multi-environnements (dev / staging / prod).

```
┌─────────────┐     HTTPS/REST      ┌──────────────┐     Mongoose     ┌──────────┐
│  React SPA  │ ◄─────────────────► │ Express API  │ ◄──────────────► │ MongoDB  │
│  (Vercel)   │     WebSocket       │  + Socket.io │   AES-256 fields │          │
└─────────────┘ ◄─────────────────► └──────────────┘                  └──────────┘
```

### 2.2 Modélisation des données (MongoDB)

#### Collection `users`
- Attributs : `firstName`, `lastName`, `email`, `password` (bcrypt), `role` ∈ {patient, doctor, admin}, `assignedDoctor`, `specialty`.
- Relations : une patiente référence un médecin (`assignedDoctor`).

#### Collection `healthrecords`
- Champs sensibles stockés sous forme chiffrée : `allergiesEncrypted`, `medicationsEncrypted`, `notesEncrypted`, `encryptedData`.
- Méthodes `setSensitiveFields` / `getDecrypted` encapsulent le chiffrement / déchiffrement.

#### Collection `symptomlogs`
- Entrées horodatées : type (`period_start`, `symptom`, …), `painLevel` (0–10), `symptoms[]`, `mood`, `flow`.
- Index composé `(patient, date)` pour les requêtes d’historique.

#### Collection `messages`
- Contenu stocké dans `encryptedContent` (AES-256-CBC).
- `conversationId` dérivé de l’ordre lexicographique des deux identifiants utilisateurs.

### 2.3 Sécurité des données médicales (AES-256)

Conformément aux bonnes pratiques inspirées de la **loi 09-08** et des principes HIPAA (*encryption at rest*), HeraCare chiffre les données cliniques avant insertion dans MongoDB :

1. Dérivation d’une clé 256 bits via SHA-256 sur le secret d’environnement `AES_SECRET_KEY`.
2. Génération d’un IV aléatoire de 16 octets pour chaque chiffrement.
3. Chiffrement **AES-256-CBC** ; stockage sous la forme `iv_hex:ciphertext_hex`.
4. Déchiffrement uniquement côté serveur lors des réponses API authentifiées (JWT + RBAC).

Ce mécanisme s’applique au dossier médical et aux messages de télémédecine. L’authentification repose sur JWT ; l’autorisation sur le middleware `authorize(...roles)`.

### 2.4 Engine prédictif (`analyzer.js`)

L’algorithme calcule :
- la **durée moyenne** des cycles à partir des `period_start` historiques ;
- la **date prédite** des prochaines règles ;
- la **fenêtre d’ovulation** (pic ≈ J-14, ±2 jours) ;
- des **anomalies** par règles métier :
  - écart-type des cycles ≥ 7 jours → alerte irrégularité (signal SOPK) ;
  - durée moyenne hors [21 ; 35] → alerte longueur anormale ;
  - ≥ 3 épisodes de douleur ≥ 7/10 → alerte douleur récurrente (signal endométriose) ;
  - co-occurrence de symptômes (acné, hirsutisme, prise de poids) → signal SOPK de sévérité moyenne.

En cas d’anomalie de sévérité *high*, l’API positionne `recommendConsultation: true` pour orienter la patiente vers le chat médical.

### 2.5 Diagramme de cas d’utilisation (synthèse)

**Acteurs :** Patiente, Médecin, Administrateur.

**Cas principaux :**
- S’inscrire / Se connecter
- Journaliser symptômes et règles
- Consulter insights prédictifs
- Mettre à jour le dossier médical
- Échanger en messagerie sécurisée
- (Médecin) Suivre les patientes assignées

---

## Chapitre 3 : Réalisation (extraits)

### Environnement
- IDE : Cursor / VS Code
- Backend : Express 4, Mongoose 8, Socket.io 4, bcryptjs, jsonwebtoken
- Frontend : React 18, Vite 5, Tailwind 3, Recharts, Axios
- Conteneurs : Docker Compose (3 services)

### Modules clés
1. **Auth** — inscription, login, JWT, assignation médecin
2. **Health** — symptômes, insights, dossier chiffré
3. **Chat** — Socket.io + persistance chiffrée
4. **Crypto** — utilitaire AES-256-CBC partagé

---

## Chapitre 4 : Tests et Déploiement

### Stratégie de tests
- Tests manuels des parcours Patiente / Médecin
- Seed MongoDB pour scénarios d’alertes
- Vérification healthcheck `/api/healthcheck`

### Déploiement
- **Frontend :** Vercel (SPA Vite, variables `VITE_API_URL`, `VITE_SOCKET_URL`)
- **Backend :** service Node persistant (Render / Railway) + **MongoDB Atlas**
- **CI/CD :** build Vite sur push ; Docker Compose pour l’environnement local

---

## Conclusion et Perspectives

HeraCare démontre la faisabilité d’une plateforme FemTech sécurisée intégrant analyse prédictive et télémédecine. Perspectives : modèles ML (classification SOPK), notifications push, téléconsultation vidéo WebRTC, et certification ISO 27001 / hébergement HDS.

---

*Document généré pour accompagner le code source HeraCare — à enrichir avec dédicaces, remerciements, étude de l’existant et figures UML.*
