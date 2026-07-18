import { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HeartPulse,
  LayoutDashboard,
  MessageCircle,
  FolderHeart,
  LogOut,
  Sparkles,
  CalendarDays,
  Activity,
  Droplets,
  Users,
  CreditCard,
  Layers,
  Menu,
  X,
  CalendarClock,
  Pill,
} from 'lucide-react';

function SimpleNavItem({ to, icon: Icon, label, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        [
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/25'
            : 'text-ink-300 hover:bg-white/10 hover:text-white',
        ].join(' ')
      }
    >
      <Icon className="w-[18px] h-[18px] shrink-0 opacity-80" />
      <span>{label}</span>
    </NavLink>
  );
}

function AdminNavItem({ tab, icon: Icon, label, onClick }) {
  const [params] = useSearchParams();
  const location = useLocation();
  const current = params.get('tab') || 'Overview';
  const active = location.pathname === '/admin' && current === tab;

  return (
    <Link
      to={`/admin?tab=${encodeURIComponent(tab)}`}
      onClick={onClick}
      className={[
        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
        active
          ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/25'
          : 'text-ink-300 hover:bg-white/10 hover:text-white',
      ].join(' ')}
    >
      <Icon className="w-[18px] h-[18px] shrink-0 opacity-90" />
      <span>{label}</span>
    </Link>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isWoman = user?.gender !== 'man';
  const isAdmin = user?.role === 'admin';
  const isPatient = user?.role === 'patient';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const close = () => setOpen(false);

  const sidebar = (
    <aside className="flex h-full w-64 flex-col bg-ink-900 text-white">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/10">
        <div className="grid place-items-center w-9 h-9 rounded-xl bg-rose-600">
          <HeartPulse className="w-5 h-5" />
        </div>
        <div className="leading-tight min-w-0">
          <Link
            to={isAdmin ? '/admin' : '/dashboard'}
            onClick={close}
            className="font-display text-lg tracking-tight block truncate"
          >
            MyHeath
          </Link>
          <p className="text-[11px] text-white/45 uppercase tracking-wider">
            {isAdmin ? 'Admin panel' : 'Health hub'}
          </p>
        </div>
        <button
          type="button"
          className="ml-auto md:hidden p-1.5 rounded-lg text-white/60 hover:bg-white/10"
          onClick={close}
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
            {isAdmin ? 'Management' : 'Workspace'}
          </p>
          <div className="space-y-1">
            {isAdmin ? (
              <>
                <AdminNavItem tab="Overview" label="Overview" icon={LayoutDashboard} onClick={close} />
                <AdminNavItem tab="Users" label="Users" icon={Users} onClick={close} />
                <AdminNavItem
                  tab="Subscriptions"
                  label="Subscriptions"
                  icon={CreditCard}
                  onClick={close}
                />
                <AdminNavItem tab="Plans" label="Plans" icon={Layers} onClick={close} />
              </>
            ) : (
              <SimpleNavItem
                to="/dashboard"
                icon={LayoutDashboard}
                label="Dashboard"
                end
                onClick={close}
              />
            )}

            {isPatient && (
              <>
                <SimpleNavItem to="/suivi" icon={Activity} label="Daily suivi" onClick={close} />
                {isWoman && (
                  <SimpleNavItem to="/period" icon={CalendarDays} label="Period" onClick={close} />
                )}
                <SimpleNavItem to="/diabetes" icon={Droplets} label="Diabetes" onClick={close} />
                <SimpleNavItem to="/medications" icon={Pill} label="Medications" onClick={close} />
                <SimpleNavItem to="/ai" icon={Sparkles} label="AI Coach" onClick={close} />
                <SimpleNavItem to="/dossier" icon={FolderHeart} label="Records" onClick={close} />
              </>
            )}
          </div>
        </div>

        <div>
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
            Communication
          </p>
          <div className="space-y-1">
            <SimpleNavItem to="/appointments" icon={CalendarClock} label="Appointments" onClick={close} />
            <SimpleNavItem to="/chat" icon={MessageCircle} label="Consult" onClick={close} />
          </div>
        </div>
      </nav>

      <div className="border-t border-white/10 p-4 space-y-3">
        <div className="flex items-center gap-3 px-1">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-rose-800 grid place-items-center text-sm font-semibold shrink-0">
            {(user?.firstName?.[0] || 'U').toUpperCase()}
            {(user?.lastName?.[0] || '').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-white/45 capitalize truncate">
              {user?.role}
              {user?.gender ? ` · ${user.gender}` : ''}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm text-white/80 bg-white/5 hover:bg-white/10 transition"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#f3eee9] flex">
      <div className="hidden md:block sticky top-0 h-screen shrink-0 z-20">{sidebar}</div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
            aria-label="Close overlay"
            onClick={close}
          />
          <div className="relative h-full w-72 max-w-[85vw] shadow-2xl">{sidebar}</div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 h-14 md:h-16 flex items-center gap-3 px-4 md:px-8 border-b border-rose-200/40 bg-[#f3eee9]/90 backdrop-blur-md">
          <button
            type="button"
            className="md:hidden p-2 rounded-xl bg-white border border-rose-100 text-ink-700 shadow-sm"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-900 truncate md:text-base">
              {isAdmin ? 'Administration' : `Welcome back, ${user?.firstName || ''}`}
            </p>
            <p className="text-xs text-ink-500 hidden sm:block">
              {isAdmin
                ? 'Manage users, plans and subscriptions'
                : 'Your personal health workspace'}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-white border border-rose-100 px-3 py-1.5 text-xs text-ink-500 capitalize shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {user?.role}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
