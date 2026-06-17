import React from 'react';
import './App.css';
import Dashboard from './pages/Dashboard';
import RobotsList from './pages/RobotsList';
import TaskManager from './pages/TaskManager';
import Billing from './pages/Billing';

function App() {
  const [currentPage, setCurrentPage] = React.useState('dashboard');

  const pages = {
    dashboard: <Dashboard />,
    robots: <RobotsList />,
    tasks: <TaskManager />,
    billing: <Billing />
  };

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="logo">
          <h1>🤖 RaaS</h1>
        </div>
        <ul className="nav-menu">
          <li>
            <a onClick={() => setCurrentPage('dashboard')}
               className={currentPage === 'dashboard' ? 'active' : ''}
            >
              Dashboard
            </a>
          </li>
          <li>
            <a onClick={() => setCurrentPage('robots')}
               className={currentPage === 'robots' ? 'active' : ''}
            >
              Robots
            </a>
          </li>
          <li>
            <a onClick={() => setCurrentPage('tasks')}
               className={currentPage === 'tasks' ? 'active' : ''}
            >
              Tasks
            </a>
          </li>
          <li>
            <a onClick={() => setCurrentPage('billing')}
               className={currentPage === 'billing' ? 'active' : ''}
            >
              Billing
            </a>
          </li>
        </ul>
      </nav>
      <main className="main-content">
        {pages[currentPage]}
      </main>
    </div>
  );
}

export default App;
