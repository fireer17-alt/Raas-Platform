import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Cpu, Battery, MapPin, Plus, Shield, Truck, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config';

const RobotsList = () => {
  const [robots, setRobots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRobot, setNewRobot] = useState({ name: '', type: 'warehouse', location: '' });
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchRobots();
  }, []);

  const fetchRobots = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/robots`);
      setRobots(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching robots:', error);
      setLoading(false);
    }
  };

  const handleAddRobot = async (e) => {
    e.preventDefault();
    try {
      const deployedName = newRobot.name;
      await axios.post(`${API_BASE_URL}/api/robots`, newRobot);
      setNotification(`DEPLOYMENT PROTOCOL COMPLETE: Robot unit "${deployedName}" registered and online.`);
      setNewRobot({ name: '', type: 'warehouse', location: '' });
      fetchRobots();
    } catch (error) {
      console.error('Error adding robot:', error);
    }
  };

  const getRobotIcon = (type) => {
    switch (type) {
      case 'warehouse':
        return <Cpu size={22} />;
      case 'delivery':
        return <Truck size={22} />;
      case 'cleaning':
        return <RefreshCw size={22} />;
      case 'security':
        return <Shield size={22} />;
      default:
        return <Cpu size={22} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
      case 'active':
        return 'var(--accent-green)';
      case 'offline':
        return 'var(--accent-red)';
      case 'maintenance':
        return 'var(--accent-gold)';
      default:
        return 'var(--text-muted)';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
        [LOADING...]
      </div>
    );
  }

  return (
    <div className="robots-page">
      <div className="page-header">
        <h1>Robot Fleet</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--accent-cyan)' }}>
          CONNECTED: {robots.length}
        </div>
      </div>

      {notification && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '6px',
          background: 'rgba(0, 240, 255, 0.1)',
          border: '1px solid var(--accent-cyan)',
          color: 'var(--accent-cyan)',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>{notification}</div>
          <button 
            onClick={() => setNotification(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 'bold'
            }}
          >
            [DISMISS]
          </button>
        </div>
      )}

      <div className="cyber-panel" style={{ marginBottom: '28px' }}>
        <h2 className="cyber-title">
          <Plus size={20} style={{ color: 'var(--accent-cyan)' }} />
          Add New Robot
        </h2>
        <form onSubmit={handleAddRobot} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.5px' }}>Name</label>
            <input
              type="text"
              placeholder="e.g. Alpha-9"
              value={newRobot.name}
              onChange={(e) => setNewRobot({ ...newRobot, name: e.target.value })}
              required
              className="cyber-input"
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.5px' }}>Type</label>
            <select
              value={newRobot.type}
              onChange={(e) => setNewRobot({ ...newRobot, type: e.target.value })}
              className="cyber-select"
              style={{ width: '100%', height: '46px' }}
            >
              <option value="warehouse">Warehouse Arm</option>
              <option value="delivery">Delivery Drone</option>
              <option value="cleaning">Cleaning Unit</option>
              <option value="security">Security Drone</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.5px' }}>Location</label>
            <input
              type="text"
              placeholder="e.g. Bay 4-A"
              value={newRobot.location}
              onChange={(e) => setNewRobot({ ...newRobot, location: e.target.value })}
              className="cyber-input"
            />
          </div>

          <button type="submit" className="cyber-button" style={{ height: '46px', width: '100%' }}>
            Deploy
          </button>
        </form>
      </div>

      <div className="robots-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {robots.map((robot) => (
          <div key={robot.id} className="cyber-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ color: 'var(--accent-cyan)', background: 'rgba(0, 113, 227, 0.08)', padding: '8px', borderRadius: '10px' }}>
                  {getRobotIcon(robot.type)}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', fontFamily: 'var(--font-heading)', letterSpacing: '-0.3px' }}>{robot.name}</h3>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{robot.type}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: getStatusColor(robot.status) }}>
                <span className="status-dot" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor(robot.status), boxShadow: `0 0 6px ${getStatusColor(robot.status)}` }}></span>
                {robot.status}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} /> Location
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#1d1d1f' }}>{robot.location || 'Unknown'}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Battery size={16} /> Battery
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: robot.battery > 30 ? 'var(--accent-green)' : 'var(--accent-red)' }}>{robot.battery}%</span>
                </div>
                
                <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${robot.battery}%`, height: '100%', background: robot.battery > 50 ? 'linear-gradient(90deg, #0071e3, #34c759)' : robot.battery > 20 ? '#ff9500' : '#ff3b30', borderRadius: '3px' }}></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RobotsList;
