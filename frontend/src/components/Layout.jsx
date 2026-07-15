import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HeartPulse,
  LayoutDashboard,
  MessageCircle,
  FolderHeart,
  LogOut,
  Sparkles,
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
      isActive ? 'bg-rose-600 text-white' : 'text-ink-700 hover:bg-rose-100'
    }`;

  return (
    <div className="min-h-screen bg-hero-mesh">
      <header className="border-b border-rose-200/60 bg-white/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 font-display text-xl text-rose-700"
          >
            <HeartPulse className="w-6 h-6" />
            MyHeath
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <NavLink to="/dashboard" className={linkClass}>
              <LayoutDashboard className="w-4 h-4" /> Tracking
            </NavLink>
            <NavLink to="/ai" className={linkClass}>
              <Sparkles className="w-4 h-4" /> MyHeath AI
            </NavLink>
            <NavLink to="/chat" className={linkClass}>
              <MessageCircle className="w-4 h-4" /> Consult
            </NavLink>
            {user?.role === 'patient' && (
              <NavLink to="/dossier" className={linkClass}>
                <FolderHeart className="w-4 h-4" /> Records
              </NavLink>
            )}
          </nav>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-ink-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-ink-500 capitalize">{user?.role}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-lg text-ink-500 hover:bg-rose-100 hover:text-rose-700"
              aria-label="Log out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
