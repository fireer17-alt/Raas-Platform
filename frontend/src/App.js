import React, { useState, useEffect } from 'react';
import './App.css';
import { LayoutDashboard, Cpu, ListTodo, CreditCard, ArrowLeft, LogOut } from 'lucide-react';
import { auth } from './config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import RobotsList from './pages/RobotsList';
import TaskManager from './pages/TaskManager';
import Billing from './pages/Billing';


function App() {
  // mode: 'landing' | 'login' | 'app'
  const [mode, setMode] = useState('landing');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Persist auth — if already signed in, skip landing/login
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthChecked(true);
      if (firebaseUser && mode !== 'app') {
        setMode('app');
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setMode('landing');
    setCurrentPage('dashboard');
  };

  // While Firebase checks stored session, show nothing (avoid flicker)
  if (!authChecked) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#05050f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 36, height: 36,
          border: '3px solid rgba(124,58,237,0.3)',
          borderTopColor: '#7c3aed',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (mode === 'landing') {
    return (
      <LandingPage
        onLaunchApp={() => setMode('login')}
        user={user}
        onGoToDashboard={() => setMode('app')}
      />
    );
  }

  if (mode === 'login') {
    return (
      <LoginPage
        onSuccess={(firebaseUser) => {
          setUser(firebaseUser);
          setMode('app');
        }}
        onBack={() => setMode('landing')}
      />
    );
  }

  // ─── App shell ───
  const pages = {
    dashboard: <Dashboard />,
    robots:    <RobotsList />,
    tasks:     <TaskManager />,
    billing:   <Billing />,
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'robots',    label: 'Fleet',     icon: Cpu },
    { id: 'tasks',     label: 'Tasks',     icon: ListTodo },
    { id: 'billing',   label: 'Billing',   icon: CreditCard },
  ];

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-brand">
          <button
            className="back-btn"
            onClick={() => setMode('landing')}
            title="Back to Landing"
          >
            <ArrowLeft size={18} />
          </button>
          <img src="/logo.png" alt="ForaMetric Logo" className="topbar-logo-img" />
          <span className="topbar-logo-text">ForaMetric</span>
        </div>
        <nav className="topbar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={currentPage === item.id ? 'active' : ''}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="topbar-meta">
          {user && (
            <>
              <span className="status-dot" />
              <span className="status-text">
                {user.displayName || user.email?.split('@')[0] || 'User'}
              </span>
              <button
                className="back-btn"
                onClick={handleSignOut}
                title="Sign out"
                style={{ marginLeft: 4 }}
              >
                <LogOut size={16} />
              </button>
            </>
          )}
          {!user && (
            <>
              <span className="status-dot" />
              <span className="status-text">Online</span>
            </>
          )}
        </div>
      </header>

      <main className="main-content">
        {pages[currentPage]}
      </main>
    </div>
  );
}

export default App;

