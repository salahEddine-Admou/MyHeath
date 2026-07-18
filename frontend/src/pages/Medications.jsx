import { useEffect, useState } from 'react';
import {
  createMedicationReminder,
  deleteMedicationReminder,
  getMedicationReminders,
} from '../services/extraService';

export default function Medications() {
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    medicationName: '',
    dosage: '',
    timesOfDay: '08:00,20:00',
    notes: '',
  });

  const load = async () => {
    try {
      const { data } = await getMedicationReminders();
      setList(data.reminders || []);
    } catch (e) {
      setMsg(e.response?.data?.message || 'Medication API available on .NET backend.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await createMedicationReminder({
        medicationName: form.medicationName,
        dosage: form.dosage,
        timesOfDay: form.timesOfDay.split(',').map((t) => t.trim()).filter(Boolean),
        notes: form.notes,
      });
      setForm({ medicationName: '', dosage: '', timesOfDay: '08:00,20:00', notes: '' });
      await load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Save failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink-900 mb-1">Medication reminders</h1>
        <p className="text-ink-500">Track chronic medication schedules (diabetes & more).</p>
      </div>
      {msg && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2 text-sm">
          {msg}
        </div>
      )}
      <form onSubmit={submit} className="bg-white border border-rose-100 rounded-2xl p-4 grid sm:grid-cols-2 gap-3 shadow-sm">
        <label className="text-sm">
          Medication
          <input
            className="input mt-1"
            required
            value={form.medicationName}
            onChange={(e) => setForm((f) => ({ ...f, medicationName: e.target.value }))}
          />
        </label>
        <label className="text-sm">
          Dosage
          <input
            className="input mt-1"
            value={form.dosage}
            onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))}
            placeholder="500mg"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          Times (comma-separated HH:mm)
          <input
            className="input mt-1"
            value={form.timesOfDay}
            onChange={(e) => setForm((f) => ({ ...f, timesOfDay: e.target.value }))}
          />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" className="bg-rose-600 text-white px-4 py-2 rounded-xl">
            Add reminder
          </button>
        </div>
      </form>
      <ul className="space-y-2">
        {list.map((r) => (
          <li
            key={r.id || r._id}
            className="bg-white border border-rose-100 rounded-xl px-4 py-3 flex justify-between gap-3 shadow-sm"
          >
            <div>
              <p className="font-medium text-ink-900">{r.medicationName}</p>
              <p className="text-sm text-ink-500">
                {r.dosage} · {(r.timesOfDay || []).join(', ')}
              </p>
            </div>
            <button
              type="button"
              className="text-red-600 text-sm hover:underline"
              onClick={async () => {
                await deleteMedicationReminder(r.id || r._id);
                await load();
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
