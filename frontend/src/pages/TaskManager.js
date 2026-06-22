import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ListTodo, Cpu, AlertTriangle, Calendar, Plus, Play, CheckCircle2, Clock } from 'lucide-react';

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
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'high':
        return {
          borderColor: 'var(--accent-red)',
          boxShadow: '0 0 15px rgba(255, 59, 59, 0.15)',
          leftColor: 'var(--accent-red)'
        };
      case 'medium':
        return {
          borderColor: 'var(--accent-gold)',
          boxShadow: '0 0 15px rgba(255, 170, 68, 0.15)',
          leftColor: 'var(--accent-gold)'
        };
      case 'low':
      default:
        return {
          borderColor: 'var(--panel-border)',
          boxShadow: 'none',
          leftColor: 'var(--text-muted)'
        };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} style={{ color: 'var(--accent-gold)' }} />;
      case 'running':
      case 'active':
        return <Play size={16} style={{ color: 'var(--accent-cyan)', animation: 'pulse-cyan 1.5s infinite' }} />;
      case 'completed':
        return <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />;
      default:
        return <Clock size={16} />;
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
    <div className="tasks-page">
      <div className="page-header">
        <h1>Task Scheduler</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--accent-cyan)' }}>
          QUEUE ACTIVE
        </div>
      </div>

      <div className="cyber-panel" style={{ marginBottom: '28px' }}>
        <h2 className="cyber-title">
          <Plus size={20} style={{ color: 'var(--accent-cyan)' }} />
          New Task
        </h2>
        <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.5px' }}>Task Name</label>
              <input
                type="text"
                placeholder="e.g. Scan Sector B-9"
                value={newTask.name}
                onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                required
                className="cyber-input"
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.5px' }}>Assign Robot</label>
              <select
                value={newTask.robotId}
                onChange={(e) => setNewTask({ ...newTask, robotId: e.target.value })}
                required
                className="cyber-select"
                style={{ height: '46px' }}
              >
                <option value="">Select Robot</option>
                {robots.map(robot => (
                  <option key={robot.id} value={robot.id}>{robot.name} ({robot.type})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.5px' }}>Priority</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="cyber-select"
                style={{ height: '46px' }}
              >
                <option value="low">Low (Routine)</option>
                <option value="medium">Medium (Standard)</option>
                <option value="high">High (Critical)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.5px' }}>Due Date</label>
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                className="cyber-input"
                style={{ height: '46px' }}
              />
            </div>
          </div>

          <button type="submit" className="cyber-button" style={{ alignSelf: 'flex-end', minWidth: '180px', height: '46px' }}>
            Create Task
          </button>
        </form>
      </div>

      <div className="tasks-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2 className="cyber-title">
          <ListTodo size={20} style={{ color: 'var(--accent-cyan)' }} />
          Active Tasks
        </h2>
        
        {tasks.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            [NO ACTIVE TASKS]
          </div>
        ) : (
          tasks.map((task) => {
            const pStyle = getPriorityStyle(task.priority);
            const assignedRobot = robots.find(r => r.id === task.robotId);
            
            return (
              <div 
                key={task.id} 
                className="cyber-panel" 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  borderColor: pStyle.borderColor, 
                  boxShadow: pStyle.boxShadow,
                  padding: '16px 24px',
                  borderLeft: `4px solid ${pStyle.leftColor}`
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', fontFamily: 'var(--font-body)', color: '#1d1d1f' }}>{task.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Cpu size={14} /> {assignedRobot ? assignedRobot.name : 'Unassigned'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} /> {task.dueDate || 'ASAP'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', padding: '4px 10px', background: 'rgba(0,0,0,0.04)', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.06)' }}>
                    {task.priority === 'high' && <AlertTriangle size={12} style={{ color: 'var(--accent-red)' }} />}
                    <span style={{ color: pStyle.leftColor, fontWeight: 'bold' }}>{task.priority}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                    {getStatusIcon(task.status)}
                    <span style={{ color: '#1d1d1f' }}>{task.status}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TaskManager;
