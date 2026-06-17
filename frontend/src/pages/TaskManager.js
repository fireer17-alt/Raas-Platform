import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [robots, setRobots] = useState([]);
  const [newTask, setNewTask] = useState({ name: '', robotId: '', priority: 'medium', dueDate: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, robotsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/tasks'),
        axios.get('http://localhost:5000/api/robots')
      ]);
      setTasks(tasksRes.data);
      setRobots(robotsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/tasks', newTask);
      setNewTask({ name: '', robotId: '', priority: 'medium', dueDate: '' });
      fetchData();
      alert('Task created successfully!');
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="tasks-page">
      <h1>Task Manager</h1>

      <div className="create-task-form" style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '5px' }}>
        <h2>Create New Task</h2>
        <form onSubmit={handleCreateTask}>
          <input
            type="text"
            placeholder="Task Name"
            value={newTask.name}
            onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
            required
            style={{ marginRight: '10px', padding: '8px', marginBottom: '10px', width: '100%' }}
          />
          <select
            value={newTask.robotId}
            onChange={(e) => setNewTask({ ...newTask, robotId: e.target.value })}
            required
            style={{ marginRight: '10px', padding: '8px', marginBottom: '10px', width: '100%' }}
          >
            <option value="">Select Robot</option>
            {robots.map(robot => (
              <option key={robot.id} value={robot.id}>{robot.name}</option>
            ))}
          </select>
          <select
            value={newTask.priority}
            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
            style={{ marginRight: '10px', padding: '8px', marginBottom: '10px', width: '100%' }}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <input
            type="date"
            value={newTask.dueDate}
            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
            style={{ marginRight: '10px', padding: '8px', marginBottom: '10px', width: '100%' }}
          />
          <button type="submit" style={{ padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%' }}>Create Task</button>
        </form>
      </div>

      <div className="tasks-list">
        <h2>All Tasks</h2>
        {tasks.map((task) => (
          <div key={task.id} className="task-card" style={{ padding: '15px', backgroundColor: 'white', borderRadius: '5px', marginBottom: '15px', borderLeft: `4px solid ${task.priority === 'high' ? '#dc3545' : task.priority === 'medium' ? '#ffc107' : '#6c757d'}` }}>
            <h3>{task.name}</h3>
            <p><strong>Status:</strong> {task.status}</p>
            <p><strong>Priority:</strong> {task.priority}</p>
            <p><strong>Due Date:</strong> {task.dueDate}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskManager;
