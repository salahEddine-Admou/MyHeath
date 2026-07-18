import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'patient',
    gender: 'woman',
    hasDiabetes: false,
    diabetesType: 'type2',
    specialty: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.role === 'patient' && !form.gender) {
      setError('Please choose woman or man');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-mesh grid place-items-center px-4 py-10">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-white/80 backdrop-blur border border-rose-100 rounded-2xl p-8 shadow-lg"
      >
        <Link to="/" className="flex items-center gap-2 font-display text-2xl text-rose-700 mb-6">
          <HeartPulse className="w-6 h-6" /> MyHeath
        </Link>
        <h1 className="text-xl font-semibold text-ink-900 mb-6">Create account</h1>

        {error && (
          <p className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm mb-1">First name</label>
            <input required value={form.firstName} onChange={set('firstName')} className="input" />
          </div>
          <div>
            <label className="block text-sm mb-1">Last name</label>
            <input required value={form.lastName} onChange={set('lastName')} className="input" />
          </div>
        </div>

        <label className="block text-sm mb-1">Email</label>
        <input type="email" required value={form.email} onChange={set('email')} className="input mb-4" />

        <label className="block text-sm mb-1">Password</label>
        <input
          type="password"
          required
          minLength={6}
          value={form.password}
          onChange={set('password')}
          className="input mb-4"
        />

        <label className="block text-sm mb-1">I am</label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { id: 'woman', label: 'Woman', hint: 'Cycle · PCOS alerts' },
            { id: 'man', label: 'Man', hint: 'Training · recovery' },
          ].map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setForm((f) => ({ ...f, gender: g.id }))}
              className={`text-left px-3 py-3 rounded-xl border transition ${
                form.gender === g.id
                  ? 'border-rose-600 bg-rose-50 text-rose-900'
                  : 'border-rose-200 hover:bg-rose-50/50'
              }`}
            >
              <span className="font-medium block">{g.label}</span>
              <span className="text-xs text-ink-500">{g.hint}</span>
            </button>
          ))}
        </div>

        <label className="block text-sm mb-1">Profile</label>
        <select value={form.role} onChange={set('role')} className="input mb-4">
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
        </select>

        {form.role === 'patient' && (
          <label className="flex items-start gap-2 mb-4 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={form.hasDiabetes}
              onChange={set('hasDiabetes')}
              className="mt-1 accent-rose-600"
            />
            <span>
              I want diabetes tracking
              {form.hasDiabetes && (
                <select
                  value={form.diabetesType}
                  onChange={set('diabetesType')}
                  className="input mt-2"
                >
                  <option value="type1">Type 1</option>
                  <option value="type2">Type 2</option>
                  <option value="gestational">Gestational</option>
                  <option value="prediabetes">Prediabetes</option>
                </select>
              )}
            </span>
          </label>
        )}

        {form.role === 'doctor' && (
          <>
            <label className="block text-sm mb-1">Specialty</label>
            <input
              value={form.specialty}
              onChange={set('specialty')}
              placeholder={form.gender === 'man' ? 'General medicine' : 'Gynecology'}
              className="input mb-4"
            />
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-rose-600 text-white py-2.5 rounded-lg font-medium hover:bg-rose-700 disabled:opacity-60"
        >
          {loading ? 'Creating…' : 'Register'}
        </button>

        <p className="mt-4 text-sm text-ink-500 text-center">
          Already registered?{' '}
          <Link to="/login" className="text-rose-700 font-medium">
            Sign in
          </Link>
        </p>
      </form>

      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid #f9d0d9;
          background: white;
        }
        .input:focus {
          outline: none;
          box-shadow: 0 0 0 2px #ec7590;
        }
      `}</style>
    </div>
  );
}
