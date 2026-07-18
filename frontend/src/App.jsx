import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import HealthRecord from './pages/HealthRecord';
import AiCompanion from './pages/AiCompanion';
import PeriodManagement from './pages/PeriodManagement';
import HealthSuivi from './pages/HealthSuivi';
import DiabetesCare from './pages/DiabetesCare';
import Admin from './pages/Admin';
import Appointments from './pages/Appointments';
import Medications from './pages/Medications';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-sand-50 text-ink-500">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <PrivateRoute>
            <Layout>
              <Chat />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/ai"
        element={
          <PrivateRoute>
            <Layout>
              <AiCompanion />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/suivi"
        element={
          <PrivateRoute roles={['patient']}>
            <Layout>
              <HealthSuivi />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/diabetes"
        element={
          <PrivateRoute roles={['patient']}>
            <Layout>
              <DiabetesCare />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/period"
        element={
          <PrivateRoute roles={['patient']}>
            <Layout>
              <PeriodManagement />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/dossier"
        element={
          <PrivateRoute roles={['patient']}>
            <Layout>
              <HealthRecord />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute roles={['admin']}>
            <Layout>
              <Admin />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <PrivateRoute>
            <Layout>
              <Appointments />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/medications"
        element={
          <PrivateRoute roles={['patient']}>
            <Layout>
              <Medications />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
