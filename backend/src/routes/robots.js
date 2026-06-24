const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { pubsub } = require('../config/pubsub');

router.get('/', async (req, res) => {
  try {
    if (!db) {
      return res.json([{ id: 'mock-1', name: 'Warehouse Bot 1', type: 'warehouse', status: 'online', battery: 85, location: 'Warehouse A' }]);
    }
    const robots = await db.collection('robots').get();
    const robotList = robots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(robotList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, type, location } = req.body;
    
    if (!db) {
      return res.json({ id: 'mock-robot', message: 'Mock: Robot registered (database not connected)' });
    }
    
    const docRef = await db.collection('robots').add({
      name,
      type,
      location,
      status: 'offline',
      battery: 100,
      createdAt: new Date(),
      telemetry: []
    });
    res.json({ id: docRef.id, message: 'Robot registered' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!db) {
      return res.json({ id: req.params.id, name: 'Mock Robot', type: 'warehouse', status: 'online', battery: 85 });
    }
    const robot = await db.collection('robots').doc(req.params.id).get();
    if (!robot.exists) {
      return res.status(404).json({ error: 'Robot not found' });
    }
    res.json({ id: req.params.id, ...robot.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/command', async (req, res) => {
  try {
    const { command, params } = req.body;
    const robotId = req.params.id;

    if (db) {
      // Log command to Firestore
      await db.collection('commands').add({
        robotId,
        command,
        params,
        timestamp: new Date(),
        status: 'pending'
      });
    }

    if (pubsub) {
      // Publish to Pub/Sub for robot to consume
      const topic = pubsub.topic(process.env.PUBSUB_TOPIC_COMMANDS || 'robot-commands');
      await topic.publish(Buffer.from(JSON.stringify({
        robotId,
        command,
        params,
        timestamp: new Date().toISOString()
      })));
    }

    res.json({ message: 'Command sent', robotId, command });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
