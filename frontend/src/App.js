import React, { useEffect, useState } from 'react';
import AuthForms from './components/auth';
import { HomePage } from './components/HomePage';
import AdminPanel from './components/AdminPanel';

const LoginScreen = ({ onLogin }) => (
  <div className="relative min-h-screen overflow-hidden bg-[#07111f]">
    <div className="absolute inset-0 aurora-shell" />
    <div className="absolute left-[-10%] top-[-8%] h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
    <div className="absolute bottom-[-10%] right-[-8%] h-80 w-80 rounded-full bg-amber-400/15 blur-3xl" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_40%)]" />
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
      <AuthForms onLogin={onLogin} />
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home');

  useEffect(() => {
    const restoreUser = () => {
      const storedUser = sessionStorage.getItem('melody-user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          return;
        } catch (error) {
          console.error('Failed to parse active session', error);
          sessionStorage.removeItem('melody-user');
        }
      }

      const authData = localStorage.getItem('melody-auth');
      if (!authData) {
        setUser(null);
        return;
      }

      try {
        const parsedAuth = JSON.parse(authData);
        const isActive = parsedAuth.expiresAt && Date.now() < parsedAuth.expiresAt;

        if (isActive && parsedAuth.user) {
          sessionStorage.setItem('melody-user', JSON.stringify(parsedAuth.user));
          setUser(parsedAuth.user);
        } else {
          localStorage.removeItem('melody-auth');
          sessionStorage.removeItem('melody-user');
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to restore login session', error);
        localStorage.removeItem('melody-auth');
        sessionStorage.removeItem('melody-user');
        setUser(null);
      }
    };

    restoreUser();
    window.addEventListener('storage', restoreUser);

    return () => window.removeEventListener('storage', restoreUser);
  }, []);

  const handleLogin = (newUser) => {
    sessionStorage.setItem('melody-user', JSON.stringify(newUser));
    setUser(newUser);
    setView('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('melody-auth');
    sessionStorage.removeItem('melody-user');
    setUser(null);
    setView('home');
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      {view === 'home' && (
        <HomePage
          user={user}
          onLogout={handleLogout}
          onManageSongs={() => setView('admin')}
        />
      )}
      {view === 'admin' && <AdminPanel onBack={() => setView('home')} />}
    </div>
  );
}
