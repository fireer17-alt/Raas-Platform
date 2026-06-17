import React, { useEffect, useState } from 'react';
import axios from 'axios';

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
      alert('Robot added successfully!');
    } catch (error) {
      console.error('Error adding robot:', error);
      alert('Error adding robot');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="robots-page">
      <h1>Robot Fleet</h1>

      <div className="add-robot-form" style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '5px' }}>
        <h2>Add New Robot</h2>
        <form onSubmit={handleAddRobot}>
          <input
            type="text"
            placeholder="Robot Name"
            value={newRobot.name}
            onChange={(e) => setNewRobot({ ...newRobot, name: e.target.value })}
            required
            style={{ marginRight: '10px', padding: '8px', marginBottom: '10px', width: 'calc(50% - 5px)' }}
          />
          <select
            value={newRobot.type}
            onChange={(e) => setNewRobot({ ...newRobot, type: e.target.value })}
            style={{ marginRight: '10px', padding: '8px', marginBottom: '10px', width: 'calc(50% - 5px)' }}
          >
            <option value="warehouse">Warehouse</option>
            <option value="delivery">Delivery Drone</option>
            <option value="cleaning">Cleaning</option>
            <option value="security">Security</option>
          </select>
          <input
            type="text"
            placeholder="Location"
            value={newRobot.location}
            onChange={(e) => setNewRobot({ ...newRobot, location: e.target.value })}
            style={{ marginRight: '10px', padding: '8px', marginBottom: '10px', width: 'calc(50% - 5px)' }}
          />
          <button type="submit" style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: 'calc(50% - 5px)' }}>Add Robot</button>
        </form>
      </div>

      <div className="robots-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
        {robots.map((robot) => (
          <div key={robot.id} className="robot-card" style={{ padding: '15px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            <h3>{robot.name}</h3>
            <p><strong>Type:</strong> {robot.type}</p>
            <p><strong>Status:</strong> <span style={{ color: (robot.status === 'online' || robot.status === 'active') ? 'green' : 'red' }}>● {robot.status}</span></p>
            <p><strong>Battery:</strong> {robot.battery}%</p>
            <p><strong>Location:</strong> {robot.location}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RobotsList;
