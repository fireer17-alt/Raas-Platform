import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRobots: 0,
    activeRobots: 0,
    pendingTasks: 0,
    totalCredits: 100
  });
  const [telemetryData, setTelemetryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const robotsRes = await axios.get('http://localhost:5000/api/robots');
        const tasksRes = await axios.get('http://localhost:5000/api/tasks');

        setStats({
          totalRobots: robotsRes.data.length,
          activeRobots: robotsRes.data.filter(r => r.status === 'active' || r.status === 'online').length,
          pendingTasks: tasksRes.data.filter(t => t.status === 'pending').length,
          totalCredits: 100
        });

        // Mock telemetry data
        setTelemetryData([
          { time: '00:00', battery: 85 },
          { time: '04:00', battery: 78 },
          { time: '08:00', battery: 92 },
          { time: '12:00', battery: 88 },
          { time: '16:00', battery: 75 },
          { time: '20:00', battery: 95 }
        ]);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="stat-card" style={{ padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h3>Total Robots</h3>
          <p className="stat-value" style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>{stats.totalRobots}</p>
        </div>
        <div className="stat-card" style={{ padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h3>Active Robots</h3>
          <p className="stat-value" style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>{stats.activeRobots}</p>
        </div>
        <div className="stat-card" style={{ padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h3>Pending Tasks</h3>
          <p className="stat-value" style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffc107' }}>{stats.pendingTasks}</p>
        </div>
        <div className="stat-card" style={{ padding: '20px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h3>Credits Available</h3>
          <p className="stat-value" style={{ fontSize: '32px', fontWeight: 'bold', color: '#17a2b8' }}>{stats.totalCredits}</p>
        </div>
      </div>

      <div className="chart-container" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <h2>Robot Battery Levels</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={telemetryData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="battery" stroke="#007bff" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
