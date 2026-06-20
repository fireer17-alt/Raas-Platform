import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Cpu, Battery, MapPin, Plus, Shield, Truck, RefreshCw } from 'lucide-react';

const RobotsList = () => {
  const [robots, setRobots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRobot, setNewRobot] = useState({ name: '', type: 'warehouse', location: '' });

  useEffect(() => {
    fetchRobots();
  }, []);

  const fetchRobots = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/robots');
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
      await axios.post('http://localhost:5000/api/robots', newRobot);
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
        [ESTABLISHING_FLEET_COMMS...]
      </div>
    );
  }

  return (
    <div className="robots-page">
      <div className="page-header">
        <h1>Robot Fleet Management</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--accent-cyan)' }}>
          NODES CONNECTED: {robots.length}
        </div>
      </div>

      <div className="cyber-panel" style={{ marginBottom: '28px' }}>
        <h2 className="cyber-title">
          <Plus size={20} style={{ color: 'var(--accent-cyan)' }} />
          Initialize New System Node
        </h2>
        <form onSubmit={handleAddRobot} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.5px' }}>Node Name</label>
            <input
              type="text"
              placeholder="e.g. ALPHA-9"
              value={newRobot.name}
              onChange={(e) => setNewRobot({ ...newRobot, name: e.target.value })}
              required
              className="cyber-input"
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.5px' }}>Node Core Class</label>
            <select
              value={newRobot.type}
              onChange={(e) => setNewRobot({ ...newRobot, type: e.target.value })}
              className="cyber-select"
              style={{ width: '100%', height: '46px' }}
            >
              <option value="warehouse">Warehouse (Kinematic Arm)</option>
              <option value="delivery">Delivery (Drone/UAV)</option>
              <option value="cleaning">Cleaning (Sanitation Unit)</option>
              <option value="security">Security (Sentinel Drone)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.5px' }}>Sector / Location</label>
            <input
              type="text"
              placeholder="e.g. Bay 4-A"
              value={newRobot.location}
              onChange={(e) => setNewRobot({ ...newRobot, location: e.target.value })}
              className="cyber-input"
            />
          </div>

          <button type="submit" className="cyber-button" style={{ height: '46px', width: '100%' }}>
            Deploy Node
          </button>
        </form>
      </div>

      <div className="robots-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {robots.map((robot) => (
          <div key={robot.id} className="cyber-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ color: 'var(--accent-cyan)', background: 'rgba(0, 240, 255, 0.08)', padding: '8px', borderRadius: '6px' }}>
                  {getRobotIcon(robot.type)}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'var(--font-heading)', letterSpacing: '0.5px' }}>{robot.name}</h3>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CLASS: {robot.type}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: getStatusColor(robot.status) }}>
                <span className="status-dot" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor(robot.status), boxShadow: `0 0 10px ${getStatusColor(robot.status)}`, animation: (robot.status === 'online' || robot.status === 'active') ? 'pulse-green 2s infinite' : 'none' }}></span>
                {robot.status}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} /> Location
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#fff' }}>{robot.location || 'SECTOR_UNKNOWN'}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Battery size={16} /> Charge Level
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: robot.battery > 30 ? 'var(--accent-green)' : 'var(--accent-red)' }}>{robot.battery}%</span>
                </div>
                
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${robot.battery}%`, height: '100%', background: robot.battery > 50 ? 'linear-gradient(90deg, var(--accent-cyan), var(--accent-green))' : robot.battery > 20 ? 'var(--accent-gold)' : 'var(--accent-red)', borderRadius: '3px', boxShadow: robot.battery > 50 ? '0 0 8px rgba(57, 255, 20, 0.4)' : 'none' }}></div>
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
