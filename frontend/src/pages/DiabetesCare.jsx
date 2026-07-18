import { useEffect, useState } from 'react';
import { Droplets, Pill, LineChart as ChartIcon } from 'lucide-react';
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
import {
  getDiabetesOverview,
  updateDiabetesProfile,
  saveDailyHealth,
  getTodayHealth,
} from '../services/suiviService';

export default function DiabetesCare() {
  const { user, refreshUser } = useAuth();
  const [overview, setOverview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [quick, setQuick] = useState({
    fastingGlucose: '',
    postMealGlucose: '',
    carbsGrams: '',
    tookMedication: false,
  });

  const load = async () => {
    const { data } = await getDiabetesOverview();
    setOverview(data);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const enableDiabetes = async (on) => {
    await updateDiabetesProfile({
      hasDiabetes: on,
      diabetesType: on ? user?.diabetesType || 'type2' : 'none',
    });
    await refreshUser();
    await load();
  };

  const saveReading = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      // Merge with today's existing log if any
      const today = await getTodayHealth().catch(() => ({ data: {} }));
      const base = today.data?.log || {};
      await saveDailyHealth({
        energy: base.energy ?? 5,
        sleepHours: base.sleepHours ?? 7,
        sleepQuality: base.sleepQuality ?? 5,
        stress: base.stress ?? 5,
        mood: base.mood || 'ok',
        waterLiters: base.waterLiters ?? 2,
        steps: base.steps ?? 0,
        exerciseMinutes: base.exerciseMinutes ?? 0,
        recovery: base.recovery ?? 5,
        workoutIntensity: base.workoutIntensity ?? 0,
        fastingGlucose:
          quick.fastingGlucose === '' ? base.fastingGlucose : Number(quick.fastingGlucose),
        postMealGlucose:
          quick.postMealGlucose === '' ? base.postMealGlucose : Number(quick.postMealGlucose),
        carbsGrams: quick.carbsGrams === '' ? base.carbsGrams : Number(quick.carbsGrams),
        tookMedication: quick.tookMedication,
        date: new Date().toISOString(),
      });
      setMsg('Glucose reading saved and health score updated.');
      setQuick({ fastingGlucose: '', postMealGlucose: '', carbsGrams: '', tookMedication: false });
      await load();
    } catch {
      setMsg('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-r from-rose-800 to-rose-600 text-white px-6 py-8 md:px-10">
        <p className="text-xs uppercase tracking-[0.2em] text-rose-100/80 mb-2">Diabetes care</p>
        <h1 className="font-display text-4xl mb-2">Glucose & habits</h1>
        <p className="text-rose-100 max-w-xl text-sm">
          Log fasting / post-meal readings, medication adherence and carbs. These feed your daily
          health prediction (educational bands — not a diagnosis).
        </p>
      </section>

      {!user?.hasDiabetes ? (
        <div className="bg-white/80 border border-rose-100 rounded-3xl p-6">
          <p className="text-ink-700 mb-4">
            Diabetes tracking is off on your profile. Enable it to unlock glucose charts and adherence.
          </p>
          <button
            type="button"
            onClick={() => enableDiabetes(true)}
            className="bg-rose-600 text-white px-5 py-2.5 rounded-xl font-medium"
          >
            Enable diabetes tracking
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm text-ink-500 capitalize">
              Type: {user.diabetesType || overview?.profile?.diabetesType}
            </span>
            <button
              type="button"
              onClick={() => enableDiabetes(false)}
              className="text-xs text-ink-400 underline"
            >
              Disable
            </button>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <Card
              icon={<Droplets className="w-5 h-5 text-rose-600" />}
              label="Avg fasting (recent)"
              value={overview?.avgFasting != null ? `${overview.avgFasting} mg/dL` : '—'}
            />
            <Card
              icon={<Pill className="w-5 h-5 text-rose-600" />}
              label="Med adherence"
              value={
                overview?.adherencePercent != null ? `${overview.adherencePercent}%` : '—'
              }
            />
            <Card
              icon={<ChartIcon className="w-5 h-5 text-rose-600" />}
              label="Logged days"
              value={overview?.recent?.length ?? 0}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <form
              onSubmit={saveReading}
              className="bg-white/80 border border-rose-100 rounded-3xl p-5 space-y-3"
            >
              <h2 className="font-display text-xl">Log reading</h2>
              <label className="text-sm block">
                Fasting glucose (mg/dL)
                <input
                  type="number"
                  value={quick.fastingGlucose}
                  onChange={(e) => setQuick((q) => ({ ...q, fastingGlucose: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </label>
              <label className="text-sm block">
                Post-meal glucose
                <input
                  type="number"
                  value={quick.postMealGlucose}
                  onChange={(e) => setQuick((q) => ({ ...q, postMealGlucose: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </label>
              <label className="text-sm block">
                Carbs (g)
                <input
                  type="number"
                  value={quick.carbsGrams}
                  onChange={(e) => setQuick((q) => ({ ...q, carbsGrams: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={quick.tookMedication}
                  onChange={(e) => setQuick((q) => ({ ...q, tookMedication: e.target.checked }))}
                  className="accent-rose-600"
                />
                Took medication
              </label>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-rose-600 text-white py-2.5 rounded-xl font-medium disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save reading'}
              </button>
              {msg && <p className="text-sm text-ink-500">{msg}</p>}
            </form>

            <div className="bg-white/80 border border-rose-100 rounded-3xl p-5">
              <h2 className="font-display text-xl mb-3">Fasting trend</h2>
              <div className="h-56">
                {(overview?.chart?.length || 0) === 0 ? (
                  <p className="text-sm text-ink-500">No glucose points yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={overview.chart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f9d0d9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <ReferenceLine y={100} stroke="#059669" strokeDasharray="4 4" />
                      <ReferenceLine y={126} stroke="#c92d55" strokeDasharray="4 4" />
                      <Line
                        type="monotone"
                        dataKey="fastingGlucose"
                        stroke="#c92d55"
                        strokeWidth={2}
                        name="Fasting"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
              <p className="text-xs text-ink-400 mt-2">
                Reference lines are educational (~100 / ~126 mg/dL fasting bands).
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Card({ icon, label, value }) {
  return (
    <div className="bg-white/80 border border-rose-100 rounded-2xl p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-500 mb-1">
        {icon} {label}
      </div>
      <p className="font-display text-lg text-ink-900">{value}</p>
    </div>
  );
}
