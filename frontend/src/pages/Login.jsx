import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('patiente@heracare.ma');
  const [password, setPassword] = useState('Patient123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Connexion impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-mesh grid place-items-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-white/80 backdrop-blur border border-rose-100 rounded-2xl p-8 shadow-lg"
      >
        <Link to="/" className="flex items-center gap-2 font-display text-2xl text-rose-700 mb-6">
          <HeartPulse className="w-6 h-6" /> HeraCare
        </Link>
        <h1 className="text-xl font-semibold text-ink-900 mb-1">Connexion</h1>
        <p className="text-sm text-ink-500 mb-6">Accédez à votre espace sécurisé.</p>

        {error && (
          <p className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <label className="block text-sm text-ink-700 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-3 py-2 rounded-lg border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
          required
        />

        <label className="block text-sm text-ink-700 mb-1">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 px-3 py-2 rounded-lg border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-rose-600 text-white py-2.5 rounded-lg font-medium hover:bg-rose-700 disabled:opacity-60"
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>

        <p className="mt-4 text-sm text-ink-500 text-center">
          Pas de compte ?{' '}
          <Link to="/register" className="text-rose-700 font-medium">
            S’inscrire
          </Link>
        </p>
        <p className="mt-3 text-xs text-ink-300 text-center">
          Démo : patiente@heracare.ma / Patient123 · docteur@heracare.ma / Doctor123
        </p>
      </form>
    </div>
  );
}
