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
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getInsights,
  logSymptom,
  getDoctors,
  assignDoctor,
} from '../services/healthService';
import { aiExplainInsights } from '../services/aiService';

const SYMPTOM_OPTIONS = [
  'cramps',
  'pelvic pain',
  'acne',
  'fatigue',
  'hirsutism',
  'weight gain',
  'headache',
  'nausea',
];

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const isMan = user?.gender === 'man';
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
        const docs = await getDoctors().catch(() => ({ data: { doctors: [] } }));
        setDoctors(docs.data.doctors || []);
        if (!isMan) {
          const { data } = await getInsights();
          setInsights(data.insights);
        } else {
          setInsights(null);
        }
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
  }, [user?.id, user?.gender]);

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
      await logSymptom({ ...form, date: new Date().toISOString() });
      setMsg('Entry saved.');
      setForm((f) => ({ ...f, symptoms: [], notes: '', painLevel: 3 }));
      await load();
    } catch {
      setMsg('Could not save entry.');
    } finally {
      setSaving(false);
    }
  };

  const onAssign = async (doctorId) => {
    await assignDoctor(doctorId);
    await refreshUser();
    setMsg('Doctor assigned.');
  };

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (user?.role === 'doctor') {
    return (
      <div>
        <h1 className="font-display text-3xl text-ink-900 mb-2">
          Hello Dr. {user.lastName}
        </h1>
        <p className="text-ink-500 mb-8">
          Open messaging to consult your patients and follow their alerts.
        </p>
        <Link
          to="/chat"
          className="inline-flex bg-rose-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-rose-700"
        >
          Open consultations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-ink-900 mb-1">Hello {user?.firstName}</h1>
        <p className="text-ink-500">
          {isMan
            ? 'Men’s health hub — daily suivi, training recovery, diabetes & AI Coach.'
            : 'Women’s health hub — cycle tracking, daily suivi, diabetes & AI Coach.'}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Link
          to="/suivi"
          className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-br from-ink-900 to-rose-800 text-white rounded-2xl px-5 py-4 hover:opacity-95 transition"
        >
          <div>
            <p className="font-display text-lg">Daily health suivi</p>
            <p className="text-sm text-rose-100">Save each day · predict good health</p>
          </div>
          <span className="text-sm font-medium">Open →</span>
        </Link>
        <Link
          to="/ai"
          className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-rose-600 to-rose-800 text-white rounded-2xl px-5 py-4 shadow-md hover:shadow-lg transition"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6" />
            <div>
              <p className="font-display text-lg">AI Coach</p>
              <p className="text-sm text-rose-100">Personalized for {isMan ? 'men' : 'women'}</p>
            </div>
          </div>
          <span className="text-sm font-medium bg-white/20 px-3 py-1.5 rounded-lg">Open →</span>
        </Link>
        {!isMan && (
          <Link
            to="/period"
            className="flex flex-wrap items-center justify-between gap-3 bg-white/80 border border-rose-200 text-ink-900 rounded-2xl px-5 py-4 hover:bg-rose-50/80 transition"
          >
            <div>
              <p className="font-display text-lg text-rose-800">Period management</p>
              <p className="text-sm text-ink-500">Calendar, flow, fertile window</p>
            </div>
            <span className="text-sm font-medium text-rose-700">Open →</span>
          </Link>
        )}
        <Link
          to="/diabetes"
          className="flex flex-wrap items-center justify-between gap-3 bg-white/80 border border-rose-200 text-ink-900 rounded-2xl px-5 py-4 hover:bg-rose-50/80 transition"
        >
          <div>
            <p className="font-display text-lg text-rose-800">Diabetes care</p>
            <p className="text-sm text-ink-500">Glucose logs & adherence</p>
          </div>
          <span className="text-sm font-medium text-rose-700">Open →</span>
        </Link>
      </div>

      {!isMan && (
      <>
      {loading ? (
        <p className="text-ink-500">Analyzing…</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat
              icon={<Calendar className="w-5 h-5 text-rose-600" />}
              label="Next period"
              value={insights?.nextPeriodPrediction || '—'}
            />
            <Stat
              icon={<Droplets className="w-5 h-5 text-rose-600" />}
              label="Avg cycle"
              value={`${insights?.averageCycleLength || '—'} d`}
            />
            <Stat
              icon={<Sparkles className="w-5 h-5 text-rose-600" />}
              label="Current phase"
              value={insights?.currentPhase?.name || '—'}
            />
            <Stat
              icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
              label="Fertile window"
              value={
                insights?.ovulationWindow
                  ? `${insights.ovulationWindow.start} → ${insights.ovulationWindow.end}`
                  : '—'
              }
            />
          </div>

          {insights?.anomalies?.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-xl text-ink-900">Analytical alerts</h2>
              {insights.anomalies.map((a) => (
                <div
                  key={a.code}
                  className={`border-l-4 px-4 py-3 bg-white/70 rounded-r-lg ${
                    a.severity === 'high' ? 'border-rose-600' : 'border-amber-500'
                  }`}
                >
                  <p className="font-medium text-ink-900">{a.title}</p>
                  <p className="text-sm text-ink-500 mt-1">{a.message}</p>
                  {insights.recommendConsultation && a.severity === 'high' && (
                    <Link
                      to="/chat"
                      className="inline-block mt-2 text-sm font-medium text-rose-700 underline"
                    >
                      Talk to my doctor →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="bg-white/70 border border-rose-100 rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="font-display text-xl">Cycle history</h2>
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
                    setAiText(e.response?.data?.message || 'AI unavailable');
                  } finally {
                    setAiLoading(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
              >
                <Sparkles className="w-4 h-4" />
                {aiLoading ? 'MyHeath AI…' : 'Explain with AI'}
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
                  Add at least 2 period starts to visualize history.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={insights.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f9d0d9" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 50]} />
                    <Tooltip />
                    <ReferenceLine y={28} stroke="#c92d55" strokeDasharray="4 4" />
                    <Bar
                      dataKey="cycleLength"
                      fill="#dc4a6d"
                      radius={[6, 6, 0, 0]}
                      name="Length (d)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
      </>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {!isMan && (
        <form
          onSubmit={submitLog}
          className="bg-white/70 border border-rose-100 rounded-2xl p-5 space-y-4"
        >
          <h2 className="font-display text-xl">Log an entry</h2>

          <div>
            <label className="text-sm text-ink-700">Type</label>
            <select
              value={form.entryType}
              onChange={(e) => setForm((f) => ({ ...f, entryType: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-rose-200 bg-white"
            >
              <option value="symptom">Symptom</option>
              <option value="period_start">Period start</option>
              <option value="period_end">Period end</option>
              <option value="note">Note</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-ink-700">Pain: {form.painLevel}/10</label>
            <input
              type="range"
              min={0}
              max={10}
              value={form.painLevel}
              onChange={(e) => setForm((f) => ({ ...f, painLevel: Number(e.target.value) }))}
              className="w-full mt-1 accent-rose-600"
            />
          </div>

          <div>
            <p className="text-sm text-ink-700 mb-2">Symptoms</p>
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
            placeholder="Free notes…"
            className="w-full px-3 py-2 rounded-lg border border-rose-200 bg-white min-h-[80px]"
          />

          <button
            type="submit"
            disabled={saving}
            className="bg-rose-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-rose-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {msg && <p className="text-sm text-ink-500">{msg}</p>}
        </form>
        )}

        <div className={`bg-white/70 border border-rose-100 rounded-2xl p-5 ${isMan ? 'lg:col-span-2 max-w-xl' : ''}`}>
          <h2 className="font-display text-xl mb-3">My doctor</h2>
          {user?.assignedDoctor ? (
            <p className="text-sm text-ink-500">
              Doctor assigned. You can start a secure consultation.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-ink-500 mb-3">
                Choose a doctor to enable telemedicine.
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
                <p className="text-sm text-ink-300">No doctors available.</p>
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
