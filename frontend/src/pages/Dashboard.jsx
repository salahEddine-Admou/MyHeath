import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { AlertTriangle, Calendar, Droplets, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getInsights,
  logSymptom,
  getDoctors,
  assignDoctor,
} from '../services/healthService';
import { aiExplainInsights } from '../services/aiService';

const SYMPTOM_OPTIONS = [
  'crampes',
  'douleur pelvienne',
  'acné',
  'fatigue',
  'hirsutisme',
  'prise de poids',
  'maux de tête',
  'nausées',
];

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({
    entryType: 'symptom',
    painLevel: 3,
    symptoms: [],
    mood: 'ok',
    flow: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      if (user?.role === 'patient') {
        const [{ data }, docs] = await Promise.all([
          getInsights(),
          getDoctors().catch(() => ({ data: { doctors: [] } })),
        ]);
        setInsights(data.insights);
        setDoctors(docs.data.doctors || []);
      } else {
        setInsights(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const toggleSymptom = (s) => {
    setForm((f) => ({
      ...f,
      symptoms: f.symptoms.includes(s)
        ? f.symptoms.filter((x) => x !== s)
        : [...f.symptoms, s],
    }));
  };

  const submitLog = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await logSymptom({
        ...form,
        date: new Date().toISOString(),
      });
      setMsg('Entrée enregistrée.');
      setForm((f) => ({ ...f, symptoms: [], notes: '', painLevel: 3 }));
      await load();
    } catch {
      setMsg('Erreur d’enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const onAssign = async (doctorId) => {
    await assignDoctor(doctorId);
    await refreshUser();
    setMsg('Médecin assigné.');
  };

  if (user?.role === 'doctor') {
    return (
      <div>
        <h1 className="font-display text-3xl text-ink-900 mb-2">
          Bonjour Dr. {user.lastName}
        </h1>
        <p className="text-ink-500 mb-8">
          Accédez à la messagerie pour consulter vos patientes et suivre leurs alertes.
        </p>
        <a
          href="/chat"
          className="inline-flex bg-rose-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-rose-700"
        >
          Ouvrir les consultations
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-ink-900 mb-1">
          Bonjour {user?.firstName}
        </h1>
        <p className="text-ink-500">
          Tableau de suivi prédictif — cycle, ovulation et signaux d’alerte.
        </p>
      </div>

      <Link
        to="/ai"
        className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-rose-600 to-rose-800 text-white rounded-2xl px-5 py-4 shadow-md hover:shadow-lg transition"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6" />
          <div>
            <p className="font-display text-lg">Hera AI est prête</p>
            <p className="text-sm text-rose-100">
              Chat Claude · journal en langage naturel · brief médecin · plan du jour
            </p>
          </div>
        </div>
        <span className="text-sm font-medium bg-white/20 px-3 py-1.5 rounded-lg">
          Ouvrir →
        </span>
      </Link>

      {loading ? (
        <p className="text-ink-500">Analyse en cours…</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat
              icon={<Calendar className="w-5 h-5 text-rose-600" />}
              label="Prochaines règles"
              value={insights?.nextPeriodPrediction || '—'}
            />
            <Stat
              icon={<Droplets className="w-5 h-5 text-rose-600" />}
              label="Cycle moyen"
              value={`${insights?.averageCycleLength || '—'} j`}
            />
            <Stat
              icon={<Sparkles className="w-5 h-5 text-rose-600" />}
              label="Phase actuelle"
              value={insights?.currentPhase?.name || '—'}
            />
            <Stat
              icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
              label="Fenêtre fertile"
              value={
                insights?.ovulationWindow
                  ? `${insights.ovulationWindow.start} → ${insights.ovulationWindow.end}`
                  : '—'
              }
            />
          </div>

          {insights?.anomalies?.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-xl text-ink-900">Alertes analytiques</h2>
              {insights.anomalies.map((a) => (
                <div
                  key={a.code}
                  className={`border-l-4 px-4 py-3 bg-white/70 rounded-r-lg ${
                    a.severity === 'high'
                      ? 'border-rose-600'
                      : 'border-amber-500'
                  }`}
                >
                  <p className="font-medium text-ink-900">{a.title}</p>
                  <p className="text-sm text-ink-500 mt-1">{a.message}</p>
                  {insights.recommendConsultation && a.severity === 'high' && (
                    <a
                      href="/chat"
                      className="inline-block mt-2 text-sm font-medium text-rose-700 underline"
                    >
                      Consulter mon médecin →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="bg-white/70 border border-rose-100 rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="font-display text-xl">Historique des cycles</h2>
              <button
                type="button"
                disabled={aiLoading}
                onClick={async () => {
                  setAiLoading(true);
                  setAiText('');
                  try {
                    const { data } = await aiExplainInsights();
                    setAiText(data.explanation);
                  } catch (e) {
                    setAiText(e.response?.data?.message || 'IA indisponible');
                  } finally {
                    setAiLoading(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
              >
                <Sparkles className="w-4 h-4" />
                {aiLoading ? 'Hera explique…' : 'Expliquer avec l’IA'}
              </button>
            </div>
            {aiText && (
              <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-100 text-sm text-ink-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {aiText}
              </div>
            )}
            <div className="h-64">
              {(insights?.chartData?.length || 0) === 0 ? (
                <p className="text-sm text-ink-500">
                  Ajoutez au moins 2 débuts de règles pour visualiser l’historique.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={insights.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f9d0d9" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 50]} />
                    <Tooltip />
                    <ReferenceLine y={28} stroke="#c92d55" strokeDasharray="4 4" />
                    <Bar dataKey="cycleLength" fill="#dc4a6d" radius={[6, 6, 0, 0]} name="Durée (j)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <form
          onSubmit={submitLog}
          className="bg-white/70 border border-rose-100 rounded-2xl p-5 space-y-4"
        >
          <h2 className="font-display text-xl">Journaliser une entrée</h2>

          <div>
            <label className="text-sm text-ink-700">Type</label>
            <select
              value={form.entryType}
              onChange={(e) => setForm((f) => ({ ...f, entryType: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-rose-200 bg-white"
            >
              <option value="symptom">Symptôme</option>
              <option value="period_start">Début des règles</option>
              <option value="period_end">Fin des règles</option>
              <option value="note">Note</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-ink-700">Douleur : {form.painLevel}/10</label>
            <input
              type="range"
              min={0}
              max={10}
              value={form.painLevel}
              onChange={(e) =>
                setForm((f) => ({ ...f, painLevel: Number(e.target.value) }))
              }
              className="w-full mt-1 accent-rose-600"
            />
          </div>

          <div>
            <p className="text-sm text-ink-700 mb-2">Symptômes</p>
            <div className="flex flex-wrap gap-2">
              {SYMPTOM_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSymptom(s)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                    form.symptoms.includes(s)
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'border-rose-200 text-ink-700 hover:bg-rose-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Notes libres…"
            className="w-full px-3 py-2 rounded-lg border border-rose-200 bg-white min-h-[80px]"
          />

          <button
            type="submit"
            disabled={saving}
            className="bg-rose-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-rose-700 disabled:opacity-60"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          {msg && <p className="text-sm text-ink-500">{msg}</p>}
        </form>

        <div className="bg-white/70 border border-rose-100 rounded-2xl p-5">
          <h2 className="font-display text-xl mb-3">Mon médecin</h2>
          {user?.assignedDoctor ? (
            <p className="text-sm text-ink-500">
              Médecin assigné. Vous pouvez démarrer une consultation sécurisée.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-ink-500 mb-3">
                Choisissez un médecin pour activer la télémédecine.
              </p>
              {doctors.map((d) => (
                <button
                  key={d._id}
                  type="button"
                  onClick={() => onAssign(d._id)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-rose-200 hover:bg-rose-50"
                >
                  <span className="font-medium">
                    Dr. {d.firstName} {d.lastName}
                  </span>
                  <span className="block text-xs text-ink-500">{d.specialty}</span>
                </button>
              ))}
              {doctors.length === 0 && (
                <p className="text-sm text-ink-300">Aucun médecin disponible.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="bg-white/70 border border-rose-100 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs uppercase tracking-wide text-ink-500">{label}</span>
      </div>
      <p className="font-display text-lg text-ink-900 capitalize break-words">{value}</p>
    </div>
  );
}
