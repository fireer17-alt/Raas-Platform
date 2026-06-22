import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Cpu, Activity, ListTodo, Zap } from 'lucide-react';

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

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
        [LOADING...]
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Operations Dashboard</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--accent-cyan)' }}>
          SYSTEM ONLINE
        </div>
      </div>
      
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <div className="cyber-panel" style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ padding: '12px', background: 'rgba(0, 113, 227, 0.08)', borderRadius: '12px', color: 'var(--accent-cyan)' }}>
            <Cpu size={26} />
          </div>
          <div>
            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Total Fleet</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: '#1d1d1f', marginTop: '4px' }}>{stats.totalRobots}</p>
          </div>
        </div>

        <div className="cyber-panel" style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ padding: '12px', background: 'rgba(52, 199, 89, 0.08)', borderRadius: '12px', color: 'var(--accent-green)', animation: 'pulse-green 3s infinite' }}>
            <Activity size={26} />
          </div>
          <div>
            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Active Nodes</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)', marginTop: '4px' }}>{stats.activeRobots}</p>
          </div>
        </div>

        <div className="cyber-panel" style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ padding: '12px', background: 'rgba(255, 149, 0, 0.08)', borderRadius: '12px', color: 'var(--accent-gold)' }}>
            <ListTodo size={26} />
          </div>
          <div>
            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Queued Tasks</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)', marginTop: '4px' }}>{stats.pendingTasks}</p>
          </div>
        </div>

        <div className="cyber-panel" style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ padding: '12px', background: 'rgba(175, 82, 222, 0.08)', borderRadius: '12px', color: 'var(--accent-purple)' }}>
            <Zap size={26} />
          </div>
          <div>
            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Core Credits</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)', marginTop: '4px' }}>{stats.totalCredits}</p>
          </div>
        </div>
      </div>

      <div className="cyber-panel">
        <h2 className="cyber-title">
          <Activity size={20} style={{ color: 'var(--accent-cyan)' }} />
          Fleet Telemetry
        </h2>
        <div style={{ width: '100%', height: 350, marginTop: '20px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={telemetryData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cyanGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(0, 0, 0, 0.06)" strokeDasharray="4 4" />
              <XAxis 
                dataKey="time" 
                stroke="#86868b" 
                tick={{ fill: '#86868b', fontFamily: 'var(--font-mono)', fontSize: 12 }} 
              />
              <YAxis 
                stroke="#86868b" 
                tick={{ fill: '#86868b', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid rgba(0, 0, 0, 0.08)', 
                  borderRadius: '12px', 
                  color: '#1d1d1f',
                  fontFamily: 'var(--font-body)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
                }}
                labelStyle={{ fontFamily: 'var(--font-mono)', color: '#0071e3', marginBottom: '4px' }}
              />
              <Legend wrapperStyle={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: '#6e6e73' }} />
              <Line 
                type="monotone" 
                dataKey="battery" 
                name="Average Battery (%)"
                stroke="var(--accent-cyan)" 
                strokeWidth={3}
                dot={{ stroke: 'var(--accent-cyan)', strokeWidth: 2, r: 4, fill: '#fff' }}
                activeDot={{ r: 7, stroke: 'var(--accent-cyan)', strokeWidth: 1, fill: 'var(--accent-cyan)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
