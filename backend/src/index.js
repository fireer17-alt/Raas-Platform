const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIO = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Firebase
const admin = require('firebase-admin');
let db = null;
let pubsub = null;

try {
  const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account-key.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.GOOGLE_CLOUD_PROJECT
  });

  db = admin.firestore();
  
  const PubSub = require('@google-cloud/pubsub');
  pubsub = new PubSub.PubSub({ projectId: process.env.GOOGLE_CLOUD_PROJECT });
} catch (error) {
  console.warn('Firebase initialization skipped (for development):', error.message);
}

// ROS Integration
const ROSLIB = require('roslib');
let ros = null;

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!db) {
      return res.status(400).json({ error: 'Database not initialized. Please setup Firebase credentials.' });
    }

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    await db.collection('users').doc(userRecord.uid).set({
      email,
      name,
      createdAt: new Date(),
      subscription: 'free',
      robots: [],
      credits: 100
    });

    res.json({ uid: userRecord.uid, message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // Use Firebase client SDK on frontend for secure login
    res.json({ message: 'Use Firebase client SDK for authentication' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Robots Routes
app.get('/api/robots', async (req, res) => {
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

app.post('/api/robots', async (req, res) => {
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

app.get('/api/robots/:id', async (req, res) => {
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

app.post('/api/robots/:id/command', async (req, res) => {
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

// Tasks Routes
app.get('/api/tasks', async (req, res) => {
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

app.post('/api/tasks', async (req, res) => {
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

// Billing Routes
app.get('/api/billing/subscription', async (req, res) => {
  try {
    const subscription = {
      plan: 'free',
      credits: 100,
      creditsUsed: 25,
      robots: 5,
      robotsLimit: 10,
      features: ['Basic monitoring', 'Task scheduling', '1 GB storage']
    };
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.io Events
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  socket.on('subscribe:robot', (robotId) => {
    socket.join(`robot:${robotId}`);
    console.log(`Client subscribed to robot:${robotId}`);
  });

  socket.on('command:robot', async (data) => {
    const { robotId, command, params } = data;
    // Send command to robot
    io.to(`robot:${robotId}`).emit('command', { command, params });
  });
});

// Simulate telemetry for demo
setInterval(() => {
  io.emit('robot:telemetry', {
    robotId: 'mock-1',
    battery: Math.floor(Math.random() * 100),
    location: { x: Math.random() * 100, y: Math.random() * 100 },
    status: 'active',
    timestamp: new Date()
  });
}, 5000);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 RaaS Backend running on port ${PORT}`);
  console.log(`📊 GCP Project: ${process.env.GOOGLE_CLOUD_PROJECT || 'Not configured'}`);
  console.log(`🤖 ROS Bridge: ${process.env.ROSBRIDGE_URL || 'ws://localhost:9090'}\n`);

  // Try to connect to ROS
  if (process.env.NODE_ENV !== 'production') {
    // connectToROS();
  }
});

module.exports = { app, io, db, pubsub };
