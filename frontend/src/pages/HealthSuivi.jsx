import { useEffect, useState } from 'react';
import {
  Activity,
  Moon,
  Droplets,
  Flame,
  HeartPulse,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getDailyHistory, saveDailyHealth } from '../services/suiviService';

const labelColor = {
  excellent: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  good: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  fair: 'text-amber-800 bg-amber-50 border-amber-200',
  poor: 'text-rose-700 bg-rose-50 border-rose-200',
  critical: 'text-rose-900 bg-rose-100 border-rose-300',
};

export default function HealthSuivi() {
  const { user } = useAuth();
  const isMan = user?.gender === 'man';
  const [history, setHistory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [lastPrediction, setLastPrediction] = useState(null);
  const [form, setForm] = useState({
    energy: 6,
    sleepHours: 7,
    sleepQuality: 6,
    stress: 4,
    mood: 'good',
    waterLiters: 2,
    steps: 5000,
    exerciseMinutes: 30,
    workoutIntensity: 5,
    recovery: 6,
    weightKg: '',
    restingHeartRate: '',
    fastingGlucose: '',
    postMealGlucose: '',
    tookMedication: false,
    carbsGrams: '',
    notes: '',
  });

  const load = async () => {
    const { data } = await getDailyHistory(30);
    setHistory(data);
    if (data.today?.log) {
      const l = data.today.log;
      setForm((f) => ({
        ...f,
        energy: l.energy ?? f.energy,
        sleepHours: l.sleepHours ?? f.sleepHours,
        sleepQuality: l.sleepQuality ?? f.sleepQuality,
        stress: l.stress ?? f.stress,
        mood: l.mood || f.mood,
        waterLiters: l.waterLiters ?? f.waterLiters,
        steps: l.steps ?? f.steps,
        exerciseMinutes: l.exerciseMinutes ?? f.exerciseMinutes,
        workoutIntensity: l.workoutIntensity ?? f.workoutIntensity,
        recovery: l.recovery ?? f.recovery,
        weightKg: l.weightKg ?? '',
        restingHeartRate: l.restingHeartRate ?? '',
        fastingGlucose: l.fastingGlucose ?? '',
        postMealGlucose: l.postMealGlucose ?? '',
        tookMedication: Boolean(l.tookMedication),
        carbsGrams: l.carbsGrams ?? '',
        notes: l.notes || '',
      }));
      setLastPrediction(data.today.prediction);
    }
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const payload = {
        ...form,
        weightKg: form.weightKg === '' ? undefined : Number(form.weightKg),
        restingHeartRate:
          form.restingHeartRate === '' ? undefined : Number(form.restingHeartRate),
        fastingGlucose:
          form.fastingGlucose === '' ? undefined : Number(form.fastingGlucose),
        postMealGlucose:
          form.postMealGlucose === '' ? undefined : Number(form.postMealGlucose),
        carbsGrams: form.carbsGrams === '' ? undefined : Number(form.carbsGrams),
        date: new Date().toISOString(),
      };
      const { data } = await saveDailyHealth(payload);
      setLastPrediction(data.prediction);
      setMsg(data.message);
      await load();
    } catch {
      setMsg('Could not save today\'s check-in.');
    } finally {
      setSaving(false);
    }
  };

  const setNum = (k) => (e) => setForm((f) => ({ ...f, [k]: Number(e.target.value) }));

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-rose-100 bg-gradient-to-br from-ink-900 via-rose-900 to-rose-700 text-white px-6 py-8 md:px-10 overflow-hidden relative">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_80%_20%,white,transparent_40%)]" />
        <div className="relative grid md:grid-cols-[1.2fr_auto] gap-6 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-rose-100/80 mb-2">
              Daily health suivi
            </p>
            <h1 className="font-display text-4xl mb-2">How is your body today?</h1>
            <p className="text-rose-100/90 text-sm max-w-lg">
              Save a daily check-in. MyHeath predicts whether you are trending toward a{' '}
              <strong>good health day</strong> or need attention — tailored for{' '}
              {isMan ? 'men (training & recovery)' : 'women (energy & cycle-aware habits)'}
              {user?.hasDiabetes ? ' and diabetes support' : ''}.
            </p>
          </div>
          {lastPrediction && (
            <div
              className={`rounded-2xl px-5 py-4 border bg-white/10 backdrop-blur min-w-[160px] text-center ${
                lastPrediction.isGoodHealth ? 'border-emerald-300/50' : 'border-amber-300/50'
              }`}
            >
              <p className="text-xs uppercase tracking-wide text-rose-100">Today score</p>
              <p className="font-display text-4xl mt-1">{lastPrediction.score}</p>
              <p className="capitalize text-sm mt-1">{lastPrediction.label}</p>
              <p className="text-xs mt-2 text-rose-100">
                {lastPrediction.isGoodHealth ? (
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Good health signal
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Needs attention
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </section>

      {history?.trend?.average != null && (
        <div className="grid sm:grid-cols-3 gap-3">
          <MiniStat icon={<TrendingUp className="w-4 h-4 text-rose-600" />} label="30d average" value={history.trend.average} />
          <MiniStat icon={<Activity className="w-4 h-4 text-rose-600" />} label="Trend" value={history.trend.trend} />
          <MiniStat
            icon={<HeartPulse className="w-4 h-4 text-rose-600" />}
            label="Good days"
            value={`${history.trend.goodDays}/${history.trend.total}`}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
        <form
          onSubmit={onSave}
          className="bg-white/80 border border-rose-100 rounded-3xl p-5 md:p-6 space-y-4 shadow-sm"
        >
          <h2 className="font-display text-2xl">Today’s check-in</h2>

          <Range label={`Energy ${form.energy}/10`} value={form.energy} onChange={setNum('energy')} icon={<Flame className="w-4 h-4" />} />
          <Range label={`Stress ${form.stress}/10`} value={form.stress} onChange={setNum('stress')} icon={<Activity className="w-4 h-4" />} />
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Sleep hours" value={form.sleepHours} onChange={setNum('sleepHours')} step={0.5} min={0} max={14} />
            <Range label={`Sleep quality ${form.sleepQuality}/10`} value={form.sleepQuality} onChange={setNum('sleepQuality')} icon={<Moon className="w-4 h-4" />} />
          </div>

          <div>
            <label className="text-sm text-ink-700">Mood</label>
            <select
              value={form.mood}
              onChange={(e) => setForm((f) => ({ ...f, mood: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-rose-200"
            >
              {['great', 'good', 'ok', 'low', 'bad'].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Water (L)" value={form.waterLiters} onChange={setNum('waterLiters')} step={0.1} />
            <NumberField label="Steps" value={form.steps} onChange={setNum('steps')} step={500} />
            <NumberField label="Exercise (min)" value={form.exerciseMinutes} onChange={setNum('exerciseMinutes')} />
            <NumberField label="Weight (kg)" value={form.weightKg} onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))} />
          </div>

          {isMan && (
            <div className="p-4 rounded-2xl bg-sand-50 border border-rose-100 space-y-3">
              <p className="text-sm font-medium text-rose-800">Men’s training block</p>
              <Range label={`Workout intensity ${form.workoutIntensity}/10`} value={form.workoutIntensity} onChange={setNum('workoutIntensity')} />
              <Range label={`Recovery ${form.recovery}/10`} value={form.recovery} onChange={setNum('recovery')} />
            </div>
          )}

          {(user?.hasDiabetes || form.fastingGlucose !== '') && (
            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-3">
              <p className="text-sm font-medium text-rose-800 flex items-center gap-2">
                <Droplets className="w-4 h-4" /> Diabetes / glucose
              </p>
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Fasting glucose (mg/dL)" value={form.fastingGlucose} onChange={(e) => setForm((f) => ({ ...f, fastingGlucose: e.target.value }))} />
                <NumberField label="Post-meal glucose" value={form.postMealGlucose} onChange={(e) => setForm((f) => ({ ...f, postMealGlucose: e.target.value }))} />
                <NumberField label="Carbs (g)" value={form.carbsGrams} onChange={(e) => setForm((f) => ({ ...f, carbsGrams: e.target.value }))} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.tookMedication}
                  onChange={(e) => setForm((f) => ({ ...f, tookMedication: e.target.checked }))}
                  className="accent-rose-600"
                />
                Took prescribed medication today
              </label>
            </div>
          )}

          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Notes for today…"
            className="w-full px-3 py-2 rounded-xl border border-rose-200 min-h-[80px]"
          />

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-rose-600 text-white py-3 rounded-xl font-medium hover:bg-rose-700 disabled:opacity-60"
          >
            {saving ? 'Scoring…' : 'Save & predict health day'}
          </button>
          {msg && <p className="text-sm text-ink-500">{msg}</p>}
          {lastPrediction?.tips?.length > 0 && (
            <ul className="text-sm text-ink-600 list-disc pl-5 space-y-1">
              {lastPrediction.tips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          )}
        </form>

        <div className="space-y-4">
          <div className="bg-white/80 border border-rose-100 rounded-3xl p-5 shadow-sm">
            <h2 className="font-display text-xl mb-3">Score history</h2>
            <div className="h-56">
              {(history?.chart?.length || 0) === 0 ? (
                <p className="text-sm text-ink-500">Save your first check-in to see the chart.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history.chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f9d0d9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <ReferenceLine y={70} stroke="#059669" strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="score" stroke="#c92d55" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            <p className="text-xs text-ink-400 mt-2">Green line = “good health” threshold (70).</p>
          </div>

          <div className="bg-white/80 border border-rose-100 rounded-3xl p-5 shadow-sm max-h-72 overflow-y-auto">
            <h2 className="font-display text-xl mb-3">Recent days</h2>
            <div className="space-y-2">
              {(history?.logs || []).slice(0, 10).map((l) => (
                <div
                  key={l._id}
                  className="flex items-center justify-between gap-2 text-sm border-b border-rose-50 pb-2"
                >
                  <span className="text-ink-700">{l.date?.slice?.(0, 10) || String(l.date).slice(0, 10)}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-lg border capitalize ${
                      labelColor[l.healthLabel] || 'bg-sand-50'
                    }`}
                  >
                    {l.healthScore} · {l.healthLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Range({ label, value, onChange, icon }) {
  return (
    <div>
      <label className="text-sm text-ink-700 flex items-center gap-1.5 mb-1">
        {icon} {label}
      </label>
      <input type="range" min={0} max={10} value={value} onChange={onChange} className="w-full accent-rose-600" />
    </div>
  );
}

function NumberField({ label, value, onChange, step = 1, min, max }) {
  return (
    <div>
      <label className="text-sm text-ink-700">{label}</label>
      <input
        type="number"
        value={value}
        onChange={onChange}
        step={step}
        min={min}
        max={max}
        className="mt-1 w-full px-3 py-2 rounded-xl border border-rose-200"
      />
    </div>
  );
}

function MiniStat({ icon, label, value }) {
  return (
    <div className="bg-white/80 border border-rose-100 rounded-2xl p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-500 mb-1">
        {icon} {label}
      </div>
      <p className="font-display text-lg capitalize text-ink-900">{value}</p>
    </div>
  );
}
