import React from 'react';
import './App.css';
import { LayoutDashboard, Cpu, ListTodo, CreditCard, Coffee } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import RobotsList from './pages/RobotsList';
import TaskManager from './pages/TaskManager';
import Billing from './pages/Billing';
import RoboBarista from './pages/RoboBarista';

function App() {
  const [currentPage, setCurrentPage] = React.useState('dashboard');

  const pages = {
    dashboard: <Dashboard />,
    robots: <RobotsList />,
    tasks: <TaskManager />,
    billing: <Billing />,
    barista: <RoboBarista />
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'robots', label: 'Fleet', icon: Cpu },
    { id: 'barista', label: 'Barista', icon: Coffee },
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-brand">
          <Cpu size={22} className="topbar-logo-icon" />
          <span className="topbar-logo-text">RaaS Control</span>
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

      <main className={`main-content ${currentPage === 'barista' ? 'main-content-immersive' : ''}`}>
        {pages[currentPage]}
      </main>
    </div>
  );
}

export default App;
