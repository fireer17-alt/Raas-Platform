const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const localDb = require('../config/localDb');

router.get('/', async (req, res) => {
  try {
    if (!db) {
      return res.json(await localDb.getTasks());
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
      const newTaskObj = await localDb.addTask({ name, robotId, priority, dueDate });
      return res.json({ id: newTaskObj.id, message: 'Task created successfully', task: newTaskObj });
    }
    
    const docRef = await db.collection('tasks').add({
      name,
      robotId,
      priority,
      dueDate: dueDate || 'ASAP',
      status: 'pending',
      createdAt: new Date()
    });
    res.json({ id: docRef.id, message: 'Task created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
