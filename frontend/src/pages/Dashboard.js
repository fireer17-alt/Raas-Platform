import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Cpu, Activity, ListTodo, Zap } from 'lucide-react';
import { API_BASE_URL } from '../config';

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
        const robotsRes = await axios.get(`${API_BASE_URL}/api/robots`);
        const tasksRes = await axios.get(`${API_BASE_URL}/api/tasks`);

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

      <div className="cyber-panel" style={{ marginTop: '28px', background: 'linear-gradient(135deg, #0d121f 0%, #07090e 100%)', border: '1px solid rgba(124, 58, 237, 0.25)', boxShadow: '0 8px 32px rgba(124, 58, 237, 0.05)' }}>
        <h2 className="cyber-title" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#f3f4f6' }}>
          <Activity size={20} style={{ color: 'var(--accent-purple)' }} />
          Foxglove Live Observability Node
        </h2>
        <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '44px', marginBottom: '16px' }}>🛰️</div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#f3f4f6', marginBottom: '8px' }}>Security Handshake Required</h3>
          <p style={{ fontSize: '14px', color: '#9ca3af', maxWidth: '520px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Foxglove Studio's security policy restricts cross-origin iframe rendering to prevent clickjacking. Launch the layout workspace in a secure tab to inspect your physical AI stream records.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 200px)', gap: '16px', margin: '0 auto 28px', fontFamily: 'monospace', fontSize: '11px', textAlign: 'left' }}>
            <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}>
              <span style={{ color: '#9ca3af' }}>NODE:</span> <span style={{ color: '#06b6d4' }}>jeevan-h-r</span>
            </div>
            <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}>
              <span style={{ color: '#9ca3af' }}>STREAM_ID:</span> <span style={{ color: '#06b6d4' }}>rec_0dtkuuK...</span>
            </div>
          </div>

          <a
            href="https://app.foxglove.dev/jeevan-h-r/view?ds=foxglove-sample-stream&ds.recordingId=rec_0dtkuuK43PadKny8&layoutId=f1366b1a-0e21-4c96-95f8-570a7325cb1f"
            target="_blank"
            rel="noopener noreferrer"
            className="cyber-button"
            style={{ 
              background: 'linear-gradient(135deg, var(--accent-purple), #6d28d9)', 
              color: '#fff', 
              textDecoration: 'none', 
              padding: '12px 32px', 
              borderRadius: '6px', 
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(124, 58, 237, 0.45)'
            }}
          >
            Launch Observability Node ↗
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
