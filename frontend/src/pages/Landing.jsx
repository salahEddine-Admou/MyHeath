import { Link } from 'react-router-dom';
import { HeartPulse, Shield, Activity, MessageSquare, Sparkles } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-hero-mesh">
      <header className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-display text-2xl text-rose-700">
          <HeartPulse className="w-7 h-7" />
          HeraCare
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-ink-700 hover:text-rose-700"
          >
            Connexion
          </Link>
          <Link
            to="/register"
            className="text-sm font-medium bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition"
          >
            Créer un compte
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 pt-16 pb-24 grid lg:grid-cols-2 gap-12 items-center">
        <div className="animate-in">
          <p className="font-display text-5xl md:text-6xl leading-[1.05] text-ink-900 text-balance mb-2">
            HeraCare
          </p>
          <h1 className="text-xl md:text-2xl text-ink-700 mb-6 max-w-lg">
            Télémédecine, suivi prédictif et Hera AI — l’assistant santé qui impressionne.
          </h1>
          <p className="text-ink-500 mb-8 max-w-md leading-relaxed">
            Journal en langage naturel, explication d’insights, brief médecin et plan
            bien-être générés par Claude. Données chiffrées AES-256.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/register"
              className="bg-rose-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-rose-700 transition shadow-sm"
            >
              Commencer le suivi
            </Link>
            <Link
              to="/login"
              className="border border-rose-300 text-rose-800 px-6 py-3 rounded-lg font-medium hover:bg-white/60 transition"
            >
              Espace patient / médecin
            </Link>
          </div>
        </div>

        <div className="relative">
          <div
            className="aspect-[4/5] rounded-2xl overflow-hidden bg-cover bg-center shadow-xl"
            style={{
              backgroundImage:
                'linear-gradient(160deg, rgba(26,18,22,0.15), rgba(168,33,69,0.35)), url(https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80)',
            }}
            role="img"
            aria-label="Consultation médicale à distance"
          />
          <div className="absolute -bottom-4 -left-4 bg-white/90 backdrop-blur px-4 py-3 rounded-xl shadow-lg max-w-xs border border-rose-100">
            <p className="text-xs uppercase tracking-wide text-rose-600 font-semibold mb-1">
              Chiffrement au repos
            </p>
            <p className="text-sm text-ink-700">AES-256 · Loi 09-08 · Canal sécurisé</p>
          </div>
        </div>
      </section>

      <section className="border-t border-rose-200/50 bg-white/40">
        <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-4 gap-10">
          <Feature
            icon={<Sparkles className="w-6 h-6 text-rose-600" />}
            title="Hera AI (Claude)"
            text="Chat intelligent, journal NL, brief médecin et plan bien-être personnalisé."
          />
          <Feature
            icon={<Activity className="w-6 h-6 text-rose-600" />}
            title="Analyse prédictive"
            text="Prédiction du cycle, fenêtre d’ovulation et détection d’anomalies via règles métier."
          />
          <Feature
            icon={<MessageSquare className="w-6 h-6 text-rose-600" />}
            title="Télémédecine"
            text="Messagerie temps réel Patient ↔ Médecin avec Socket.io et contenu chiffré."
          />
          <Feature
            icon={<Shield className="w-6 h-6 text-rose-600" />}
            title="Sécurité avancée"
            text="JWT, RBAC et chiffrement AES-256-CBC des données de santé sensibles."
          />
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div>
      <div className="mb-3">{icon}</div>
      <h2 className="font-display text-xl text-ink-900 mb-2">{title}</h2>
      <p className="text-sm text-ink-500 leading-relaxed">{text}</p>
    </div>
  );
}
