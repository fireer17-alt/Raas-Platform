import React, { useState } from 'react';
import './App.css';
import { LayoutDashboard, Cpu, ListTodo, CreditCard, Coffee, ArrowLeft, Eye } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import RobotsList from './pages/RobotsList';
import TaskManager from './pages/TaskManager';
import Billing from './pages/Billing';
import RoboBarista from './pages/RoboBarista';
import RvizView from './pages/RvizView';

function App() {
  const [mode, setMode] = useState('landing'); // 'landing' | 'app'
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (mode === 'landing') {
    return <LandingPage onLaunchApp={() => setMode('app')} />;
  }

  const pages = {
    dashboard: <Dashboard />,
    robots: <RobotsList />,
    barista: <RoboBarista />,
    rviz: <RvizView />,
    tasks: <TaskManager />,
    billing: <Billing />
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'robots', label: 'Fleet', icon: Cpu },
    { id: 'barista', label: 'Barista', icon: Coffee },
    { id: 'rviz', label: 'RViz', icon: Eye },
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
    { id: 'billing', label: 'Billing', icon: CreditCard },
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
          <img src="/logo.png" alt="RaaS Logo" className="topbar-logo-img" />
          <span className="topbar-logo-text">RaaS</span>
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
          <span className="status-dot"></span>
          <span className="status-text">Online</span>
        </div>
      </header>

      <main className={`main-content ${(currentPage === 'barista' || currentPage === 'rviz') ? 'main-content-immersive' : ''}`}>
        {pages[currentPage]}
      </main>
    </div>
  );
}

export default App;
