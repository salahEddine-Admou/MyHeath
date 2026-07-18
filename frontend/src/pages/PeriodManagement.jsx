import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  CalendarDays,
  Droplets,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  CircleDot,
  Heart,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getPeriods,
  logSymptom,
  deleteSymptom,
} from '../services/healthService';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FLOW_OPTIONS = [
  { id: 'light', label: 'Light', color: 'bg-rose-200' },
  { id: 'medium', label: 'Medium', color: 'bg-rose-400' },
  { id: 'heavy', label: 'Heavy', color: 'bg-rose-700' },
];

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function toKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildMonthGrid(viewDate) {
  const first = startOfMonth(viewDate);
  // Monday-first
  const startOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startOffset);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }
  return cells;
}

export default function PeriodManagement() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => toKey(new Date()));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    entryType: 'period_start',
    flow: 'medium',
    painLevel: 4,
    notes: '',
    date: toKey(new Date()),
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data: res } = await getPeriods();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cells = useMemo(() => buildMonthGrid(viewDate), [viewDate]);
  const marks = data?.calendarMarks || {};
  const stats = data?.stats || {};
  const openPeriod = data?.openPeriod;
  const phase = stats.currentPhase?.name || '—';
  const phaseDay = stats.currentPhase?.day || 0;
  const cycleLen = stats.averageCycleLength || 28;
  const progress = Math.min(100, Math.round((phaseDay / cycleLen) * 100));

  const selectedMark = marks[selectedDay];

  const shiftMonth = (dir) => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + dir, 1));
  };

  const quickLog = async (entryType) => {
    setSaving(true);
    setMsg('');
    try {
      await logSymptom({
        entryType,
        date: new Date().toISOString(),
        flow: entryType === 'period_start' ? form.flow || 'medium' : '',
        painLevel: form.painLevel,
        notes: form.notes || '',
        symptoms: entryType === 'period_start' ? ['period'] : [],
      });
      setMsg(
        entryType === 'period_start'
          ? 'Period start logged for today.'
          : 'Period end logged for today.'
      );
      await load();
    } catch {
      setMsg('Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await logSymptom({
        ...form,
        date: new Date(form.date).toISOString(),
        symptoms: form.entryType.includes('period') ? ['period'] : [],
      });
      setMsg('Entry saved to your period journal.');
      setForm((f) => ({ ...f, notes: '' }));
      await load();
    } catch {
      setMsg('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const removeEpisode = async (id) => {
    if (!window.confirm('Delete this period start entry?')) return;
    await deleteSymptom(id);
    await load();
  };

  if (user?.gender === 'man') {
    return <Navigate to="/suivi" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] grid place-items-center text-ink-500">
        Loading your cycle calendar…
      </div>
    );
  }

  return (
    <div className="space-y-8 period-page">
      {/* Hero composition */}
      <section className="relative overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-700 via-rose-600 to-rose-900 text-white px-6 py-8 md:px-10 md:py-10 shadow-lg">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, rgba(255,255,255,0.35), transparent 40%), radial-gradient(circle at 85% 10%, rgba(255,200,210,0.25), transparent 35%)',
          }}
        />
        <div className="relative grid lg:grid-cols-[1.2fr_auto] gap-8 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-rose-100/90 mb-2">
              Cycle care
            </p>
            <h1 className="font-display text-4xl md:text-5xl leading-tight mb-3">
              Period management
            </h1>
            <p className="text-rose-100 max-w-xl text-sm md:text-base leading-relaxed">
              Log starts and ends, follow flow intensity, and see period days, fertile window and
              predictions on one calm calendar.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={saving || Boolean(openPeriod)}
                onClick={() => quickLog('period_start')}
                className="inline-flex items-center gap-2 bg-white text-rose-700 px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-rose-50 disabled:opacity-50 transition period-btn"
              >
                <Droplets className="w-4 h-4" /> Period started today
              </button>
              <button
                type="button"
                disabled={saving || !openPeriod}
                onClick={() => quickLog('period_end')}
                className="inline-flex items-center gap-2 border border-white/40 bg-white/10 backdrop-blur px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-white/20 disabled:opacity-50 transition"
              >
                <CheckCircle2 className="w-4 h-4" /> Period ended today
              </button>
            </div>
            {openPeriod && (
              <p className="mt-4 text-sm text-rose-100 flex items-center gap-2">
                <CircleDot className="w-4 h-4 animate-pulse" />
                Active period · day {openPeriod.dayNumber} · started {openPeriod.startDate}
              </p>
            )}
          </div>

          {/* Phase ring */}
          <div className="justify-self-center period-ring">
            <div
              className="relative w-40 h-40 rounded-full grid place-items-center"
              style={{
                background: `conic-gradient(#fda4af ${progress}%, rgba(255,255,255,0.18) 0)`,
              }}
            >
              <div className="w-[7.5rem] h-[7.5rem] rounded-full bg-rose-800/90 grid place-items-center text-center px-3">
                <p className="text-[10px] uppercase tracking-wider text-rose-200">Phase</p>
                <p className="font-display text-xl capitalize leading-tight">{phase}</p>
                <p className="text-xs text-rose-200 mt-1">
                  Day {phaseDay}/{cycleLen}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          icon={<CalendarDays className="w-5 h-5 text-rose-600" />}
          label="Next period"
          value={stats.nextPeriodPrediction || '—'}
        />
        <Stat
          icon={<Droplets className="w-5 h-5 text-rose-600" />}
          label="Avg cycle"
          value={`${stats.averageCycleLength || '—'} days`}
        />
        <Stat
          icon={<Heart className="w-5 h-5 text-rose-600" />}
          label="Avg period length"
          value={`${stats.averagePeriodLength || data?.avgPeriodLength || '—'} days`}
        />
        <Stat
          icon={<Sparkles className="w-5 h-5 text-rose-600" />}
          label="Fertile window"
          value={
            stats.ovulationWindow
              ? `${stats.ovulationWindow.start.slice(5)} → ${stats.ovulationWindow.end.slice(5)}`
              : '—'
          }
        />
      </section>

      <div className="grid lg:grid-cols-[1.35fr_1fr] gap-6 items-start">
        {/* Calendar */}
        <section className="bg-white/80 border border-rose-100 rounded-3xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl text-ink-900">
              {viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="p-2 rounded-xl hover:bg-rose-50 text-ink-700"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setViewDate(new Date())}
                className="px-3 text-xs font-medium rounded-xl hover:bg-rose-50 text-rose-700"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="p-2 rounded-xl hover:bg-rose-50 text-ink-700"
                aria-label="Next month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[11px] uppercase tracking-wide text-ink-300 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((d) => {
              const key = toKey(d);
              const inMonth = d.getMonth() === viewDate.getMonth();
              const mark = marks[key] || {};
              const isToday = key === toKey(new Date());
              const selected = key === selectedDay;

              let bg = 'bg-transparent hover:bg-rose-50';
              let text = inMonth ? 'text-ink-900' : 'text-ink-300';
              if (mark.period) {
                bg = 'bg-rose-600 text-white hover:bg-rose-700';
                text = 'text-white';
              } else if (mark.predictedPeriod) {
                bg = 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-dashed border-rose-300';
                text = 'text-rose-800';
              } else if (mark.ovulationPeak) {
                bg = 'bg-amber-400 text-ink-900 hover:bg-amber-500';
                text = 'text-ink-900';
              } else if (mark.fertile) {
                bg = 'bg-amber-100 text-amber-900 hover:bg-amber-200';
                text = 'text-amber-900';
              }

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelectedDay(key);
                    setForm((f) => ({ ...f, date: key }));
                  }}
                  className={`aspect-square rounded-2xl text-sm font-medium transition relative ${bg} ${text} ${
                    selected ? 'ring-2 ring-offset-2 ring-rose-500' : ''
                  } ${isToday && !mark.period ? 'outline outline-1 outline-rose-400' : ''}`}
                >
                  {d.getDate()}
                  {mark.periodDay === 1 && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/90" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-xs text-ink-500">
            <Legend swatch="bg-rose-600" label="Period" />
            <Legend swatch="bg-rose-100 border border-dashed border-rose-300" label="Predicted" />
            <Legend swatch="bg-amber-100" label="Fertile" />
            <Legend swatch="bg-amber-400" label="Ovulation peak" />
          </div>

          {selectedDay && (
            <div className="mt-5 p-4 rounded-2xl bg-sand-50 border border-rose-100">
              <p className="text-sm font-medium text-ink-900">{selectedDay}</p>
              <p className="text-sm text-ink-500 mt-1">
                {selectedMark?.period &&
                  `Period day ${selectedMark.periodDay}${selectedMark.flow ? ` · flow ${selectedMark.flow}` : ''}`}
                {selectedMark?.predictedPeriod &&
                  !selectedMark?.period &&
                  `Predicted period day ${selectedMark.predictedDay}`}
                {selectedMark?.fertile &&
                  !selectedMark?.period &&
                  (selectedMark.ovulationPeak ? ' · Ovulation peak' : ' · Fertile window')}
                {!selectedMark?.period &&
                  !selectedMark?.predictedPeriod &&
                  !selectedMark?.fertile &&
                  'No period mark — use the form to log this day.'}
              </p>
            </div>
          )}
        </section>

        {/* Log form */}
        <section className="bg-white/80 border border-rose-100 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
          <h2 className="font-display text-2xl flex items-center gap-2">
            <Plus className="w-5 h-5 text-rose-600" /> Log period details
          </h2>

          <form onSubmit={submitForm} className="space-y-4">
            <div>
              <label className="text-sm text-ink-700">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-rose-200 bg-white"
                required
              />
            </div>

            <div>
              <label className="text-sm text-ink-700">Entry type</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[
                  ['period_start', 'Period start'],
                  ['period_end', 'Period end'],
                  ['symptom', 'Period day note'],
                  ['note', 'Note'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, entryType: id }))}
                    className={`text-sm px-3 py-2 rounded-xl border transition ${
                      form.entryType === id
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'border-rose-200 text-ink-700 hover:bg-rose-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-ink-700 mb-2 block">Flow</label>
              <div className="flex gap-2">
                {FLOW_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, flow: f.id }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${
                      form.flow === f.id
                        ? 'border-rose-600 bg-rose-50 text-rose-800'
                        : 'border-rose-100 text-ink-600'
                    }`}
                  >
                    <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${f.color}`} />
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-ink-700">
                Cramp / pain intensity: {form.painLevel}/10
              </label>
              <input
                type="range"
                min={0}
                max={10}
                value={form.painLevel}
                onChange={(e) =>
                  setForm((f) => ({ ...f, painLevel: Number(e.target.value) }))
                }
                className="w-full mt-2 accent-rose-600"
              />
            </div>

            <div>
              <label className="text-sm text-ink-700">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Cramps, mood, products used, anything useful…"
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-rose-200 bg-white min-h-[90px]"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-rose-600 text-white py-3 rounded-xl font-medium hover:bg-rose-700 disabled:opacity-60 transition"
            >
              {saving ? 'Saving…' : 'Save period entry'}
            </button>
            {msg && <p className="text-sm text-ink-500">{msg}</p>}
          </form>
        </section>
      </div>

      {/* History */}
      <section className="bg-white/80 border border-rose-100 rounded-3xl p-5 md:p-6 shadow-sm">
        <h2 className="font-display text-2xl mb-4">Period history</h2>
        {(data?.episodes || []).length === 0 ? (
          <p className="text-sm text-ink-500">
            No periods logged yet. Tap “Period started today” or use the form to begin.
          </p>
        ) : (
          <div className="space-y-3">
            {data.episodes.map((ep, idx) => (
              <div
                key={ep.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-rose-100 bg-gradient-to-r from-white to-rose-50/40 period-row"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div>
                  <p className="font-medium text-ink-900">
                    {ep.startDate}
                    <span className="text-ink-300 mx-2">→</span>
                    {ep.endDate}
                    {!ep.endedExplicitly && (
                      <span className="ml-2 text-xs text-ink-400">(estimated end)</span>
                    )}
                  </p>
                  <p className="text-sm text-ink-500 mt-0.5">
                    {ep.lengthDays} period days
                    {ep.cycleLength ? ` · cycle ${ep.cycleLength}d` : ''}
                    {ep.flow ? ` · ${ep.flow} flow` : ''}
                    {ep.painLevel ? ` · pain ${ep.painLevel}/10` : ''}
                  </p>
                  {ep.notes && <p className="text-xs text-ink-400 mt-1">{ep.notes}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => removeEpisode(ep.id)}
                  className="p-2 rounded-xl text-ink-400 hover:text-rose-700 hover:bg-rose-50"
                  aria-label="Delete period entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="bg-white/80 border border-rose-100 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[11px] uppercase tracking-wide text-ink-500">{label}</span>
      </div>
      <p className="font-display text-lg text-ink-900 break-words">{value}</p>
    </div>
  );
}

function Legend({ swatch, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded ${swatch}`} />
      {label}
    </span>
  );
}
