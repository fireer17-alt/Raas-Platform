const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIO = require('socket.io');
require('dotenv').config();

const ROSBridge = require('./ros-bridge');
const RobotController = require('./robot-controller');

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

// ROS Bridge
const rosBridge = new ROSBridge(process.env.ROSBRIDGE_URL || 'ws://localhost:9090');
const robotController = new RobotController(rosBridge);

let rosConnected = false;

// Connect to ROS
(async () => {
  try {
    await rosBridge.connect();
    rosConnected = true;
    console.log('✓ ROS Bridge connected');
    
    // Initialize sample robots
    await robotController.initializeRobot('robot_1', 'warehouse');
    console.log('✓ Sample robots initialized');
  } catch (error) {
    console.error('✗ Failed to connect to ROS:', error.message);
    rosConnected = false;
  }
})();

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    ros: rosConnected ? 'connected' : 'disconnected',
    timestamp: new Date() 
  });
});

app.get('/api/robots', (req, res) => {
  const robots = robotController.getAllRobots();
  res.json(robots);
});

app.post('/api/robots', async (req, res) => {
  try {
    const { name, type, location } = req.body;
    const robotId = name.toLowerCase().replace(/\s+/g, '_');
    
    const robot = await robotController.initializeRobot(robotId, type);
    res.json({ id: robot.id, message: 'Robot registered', robot });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/robots/:id', (req, res) => {
  const robot = robotController.getRobotState(req.params.id);
  if (!robot) {
    return res.status(404).json({ error: 'Robot not found' });
  }
  res.json(robot);
});

app.get('/api/robots/:id/telemetry', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const history = robotController.getTelemetryHistory(req.params.id, limit);
  res.json(history);
});

app.post('/api/robots/:id/command', async (req, res) => {
  try {
    const { command, params } = req.body;
    const robotId = req.params.id;

    switch (command) {
      case 'move_to':
        await robotController.moveRobot(robotId, params.x, params.y, params.z);
        break;
      case 'stop':
        await robotController.stopRobot(robotId);
        break;
      case 'pick':
        await robotController.pickItem(robotId);
        break;
      case 'drop':
        await robotController.dropItem(robotId);
        break;
      case 'charge':
        await robotController.chargeRobot(robotId);
        break;
      case 'reset':
        await robotController.resetRobot(robotId);
        break;
      default:
        return res.status(400).json({ error: 'Unknown command' });
    }

    res.json({ message: `Command '${command}' sent to ${robotId}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ros/status', (req, res) => {
  res.json({
    connected: rosBridge.getConnectedStatus(),
    url: process.env.ROSBRIDGE_URL || 'ws://localhost:9090',
    robots: robotController.getAllRobots().length
  });
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

  socket.on('unsubscribe:robot', (robotId) => {
    socket.leave(`robot:${robotId}`);
    console.log(`Client unsubscribed from robot:${robotId}`);
  });

  socket.on('command:robot', async (data) => {
    const { robotId, command, params } = data;
    try {
      switch (command) {
        case 'move_to':
          await robotController.moveRobot(robotId, params.x, params.y, params.z);
          break;
        case 'stop':
          await robotController.stopRobot(robotId);
          break;
        case 'pick':
          await robotController.pickItem(robotId);
          break;
        case 'drop':
          await robotController.dropItem(robotId);
          break;
        case 'charge':
          await robotController.chargeRobot(robotId);
          break;
      }
      io.to(`robot:${robotId}`).emit('command:ack', { command, status: 'sent' });
    } catch (error) {
      io.to(`robot:${robotId}`).emit('command:error', { error: error.message });
    }
  });
});

// Periodic telemetry broadcast
setInterval(() => {
  const robots = robotController.getAllRobots();
  robots.forEach(robot => {
    io.to(`robot:${robot.id}`).emit('robot:telemetry', {
      id: robot.id,
      type: robot.type,
      status: robot.status,
      battery: robot.battery,
      position: robot.position,
      lastUpdate: robot.lastUpdate
    });
  });
}, 1000);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 RaaS Backend running on port ${PORT}`);
  console.log(`🤖 ROS Bridge: ${process.env.ROSBRIDGE_URL || 'ws://localhost:9090'}`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}\n`);
});

module.exports = { app, io, rosBridge, robotController };
