import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDoctors } from '../services/healthService';
import { createAppointment, getAppointments, updateAppointmentStatus } from '../services/extraService';

export default function Appointments() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    doctorId: '',
    scheduledAt: '',
    durationMinutes: 30,
    reason: '',
    mode: 'video',
  });

  const load = async () => {
    try {
      const { data } = await getAppointments();
      setList(data.appointments || []);
      if (user?.role === 'patient') {
        const docs = await getDoctors();
        setDoctors(docs.data.doctors || []);
      }
    } catch (e) {
      setMsg(e.response?.data?.message || 'Appointments require the .NET API (or Node parity).');
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await createAppointment({
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      });
      setMsg('Appointment booked');
      setForm((f) => ({ ...f, reason: '', scheduledAt: '' }));
      await load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not book');
    }
  };

  const setStatus = async (id, status) => {
    await updateAppointmentStatus(id, { status });
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink-900 mb-1">Appointments</h1>
        <p className="text-ink-500">Book and track telemedicine consultations.</p>
      </div>
      {msg && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2 text-sm">
          {msg}
        </div>
      )}

      {user?.role === 'patient' && (
        <form
          onSubmit={submit}
          className="bg-white border border-rose-100 rounded-2xl p-4 grid sm:grid-cols-2 gap-3 shadow-sm"
        >
          <h2 className="sm:col-span-2 font-display text-xl">Book appointment</h2>
          <label className="text-sm">
            Doctor
            <select
              className="input mt-1"
              required
              value={form.doctorId}
              onChange={(e) => setForm((f) => ({ ...f, doctorId: e.target.value }))}
            >
              <option value="">Select…</option>
              {doctors.map((d) => (
                <option key={d._id || d.id} value={d._id || d.id}>
                  Dr. {d.firstName} {d.lastName}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Date & time
            <input
              type="datetime-local"
              className="input mt-1"
              required
              value={form.scheduledAt}
              onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            Mode
            <select
              className="input mt-1"
              value={form.mode}
              onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value }))}
            >
              <option value="video">Video</option>
              <option value="chat">Chat</option>
              <option value="in_person">In person</option>
            </select>
          </label>
          <label className="text-sm">
            Reason
            <input
              className="input mt-1"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="bg-rose-600 text-white px-4 py-2 rounded-xl">
              Book
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-rose-100 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-rose-50 text-left text-ink-600">
            <tr>
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">Mode</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Reason</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id || a._id} className="border-t border-rose-50">
                <td className="px-4 py-2">{new Date(a.scheduledAt).toLocaleString()}</td>
                <td className="px-4 py-2 capitalize">{a.mode}</td>
                <td className="px-4 py-2 capitalize">{a.status}</td>
                <td className="px-4 py-2">{a.reason || '—'}</td>
                <td className="px-4 py-2 space-x-2">
                  {a.status === 'scheduled' && (
                    <>
                      <button
                        type="button"
                        className="text-emerald-700 hover:underline"
                        onClick={() => setStatus(a.id || a._id, 'completed')}
                      >
                        Complete
                      </button>
                      <button
                        type="button"
                        className="text-red-600 hover:underline"
                        onClick={() => setStatus(a.id || a._id, 'cancelled')}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!list.length && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-ink-500">
                  No appointments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
