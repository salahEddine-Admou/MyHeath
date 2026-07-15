import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { getHealthRecord, updateHealthRecord } from '../services/healthService';

export default function HealthRecord() {
  const [form, setForm] = useState({
    bloodType: '',
    allergies: '',
    medications: '',
    clinicalNotes: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getHealthRecord()
      .then(({ data }) => {
        const r = data.record;
        setForm({
          bloodType: r.bloodType || '',
          allergies: Array.isArray(r.allergies) ? r.allergies.join(', ') : r.allergies || '',
          medications: Array.isArray(r.medications)
            ? r.medications.join(', ')
            : r.medications || '',
          clinicalNotes: r.clinicalNotes || '',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await updateHealthRecord({
        bloodType: form.bloodType,
        allergies: form.allergies.split(',').map((s) => s.trim()).filter(Boolean),
        medications: form.medications.split(',').map((s) => s.trim()).filter(Boolean),
        clinicalNotes: form.clinicalNotes,
      });
      setMsg('Record updated (sensitive fields encrypted AES-256 at rest).');
    } catch {
      setMsg('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-ink-500">Loading record…</p>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-start gap-3 mb-6">
        <Shield className="w-6 h-6 text-rose-600 shrink-0 mt-1" />
        <div>
          <h1 className="font-display text-3xl text-ink-900">Health record</h1>
          <p className="text-ink-500 text-sm mt-1">
            Sensitive fields (allergies, medications, notes) are encrypted with AES-256-CBC before
            MongoDB storage.
          </p>
        </div>
      </div>

      <form
        onSubmit={onSave}
        className="bg-white/70 border border-rose-100 rounded-2xl p-6 space-y-4"
      >
        <div>
          <label className="text-sm text-ink-700">Blood type</label>
          <input
            value={form.bloodType}
            onChange={(e) => setForm((f) => ({ ...f, bloodType: e.target.value }))}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-rose-200 bg-white"
            placeholder="A+"
          />
        </div>
        <div>
          <label className="text-sm text-ink-700">Allergies (comma-separated)</label>
          <input
            value={form.allergies}
            onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-rose-200 bg-white"
          />
        </div>
        <div>
          <label className="text-sm text-ink-700">Medications</label>
          <input
            value={form.medications}
            onChange={(e) => setForm((f) => ({ ...f, medications: e.target.value }))}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-rose-200 bg-white"
          />
        </div>
        <div>
          <label className="text-sm text-ink-700">Clinical notes</label>
          <textarea
            value={form.clinicalNotes}
            onChange={(e) => setForm((f) => ({ ...f, clinicalNotes: e.target.value }))}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-rose-200 bg-white min-h-[120px]"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-rose-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-rose-700 disabled:opacity-60"
        >
          {saving ? 'Encrypting & saving…' : 'Save'}
        </button>
        {msg && <p className="text-sm text-ink-500">{msg}</p>}
      </form>
    </div>
  );
}
