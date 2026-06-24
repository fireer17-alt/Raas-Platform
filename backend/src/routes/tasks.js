const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

router.get('/', async (req, res) => {
  try {
    if (!db) {
      return res.json([{ id: 'mock-task-1', name: 'Pick and place items', robotId: 'mock-1', status: 'pending', priority: 'high' }]);
    }
    const tasks = await db.collection('tasks').get();
    const taskList = tasks.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(taskList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, robotId, priority, dueDate } = req.body;
    
    if (!db) {
      return res.json({ id: 'mock-task', message: 'Mock: Task created (database not connected)' });
    }
    
    const docRef = await db.collection('tasks').add({
      name,
      robotId,
      priority,
      dueDate,
      status: 'pending',
      createdAt: new Date()
    });
    res.json({ id: docRef.id, message: 'Task created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
