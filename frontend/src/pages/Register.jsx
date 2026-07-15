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
    specialty: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Inscription impossible');
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
          <HeartPulse className="w-6 h-6" /> HeraCare
        </Link>
        <h1 className="text-xl font-semibold text-ink-900 mb-6">Créer un compte</h1>

        {error && (
          <p className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm mb-1">Prénom</label>
            <input required value={form.firstName} onChange={set('firstName')} className="input" />
          </div>
          <div>
            <label className="block text-sm mb-1">Nom</label>
            <input required value={form.lastName} onChange={set('lastName')} className="input" />
          </div>
        </div>

        <label className="block text-sm mb-1">Email</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={set('email')}
          className="input mb-4"
        />

        <label className="block text-sm mb-1">Mot de passe</label>
        <input
          type="password"
          required
          minLength={6}
          value={form.password}
          onChange={set('password')}
          className="input mb-4"
        />

        <label className="block text-sm mb-1">Profil</label>
        <select value={form.role} onChange={set('role')} className="input mb-4">
          <option value="patient">Patiente</option>
          <option value="doctor">Médecin</option>
        </select>

        {form.role === 'doctor' && (
          <>
            <label className="block text-sm mb-1">Spécialité</label>
            <input
              value={form.specialty}
              onChange={set('specialty')}
              placeholder="Gynécologie"
              className="input mb-4"
            />
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-rose-600 text-white py-2.5 rounded-lg font-medium hover:bg-rose-700 disabled:opacity-60"
        >
          {loading ? 'Création…' : 'S’inscrire'}
        </button>

        <p className="mt-4 text-sm text-ink-500 text-center">
          Déjà inscrit ?{' '}
          <Link to="/login" className="text-rose-700 font-medium">
            Se connecter
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
