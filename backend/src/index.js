const http = require('http');
require('dotenv').config();
const app = require('./app');
const { initSockets } = require('./sockets/socketManager');

const server = http.createServer(app);

// Initialize Socket.io
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
const io = initSockets(server, corsOrigin);

const { connectDB } = require('./config/mongo');
connectDB();

// Start Server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`\n🚀 RaaS Backend running on port ${PORT}`);
  console.log(`📊 GCP Project: ${process.env.GOOGLE_CLOUD_PROJECT || 'Not configured'}`);
  console.log(`🤖 ROS Bridge: ${process.env.ROSBRIDGE_URL || 'ws://localhost:9090'}\n`);
});

// Import connections for export compatibility (in case tests or custom imports check them)
const { db } = require('./config/firebase');
const { pubsub } = require('./config/pubsub');

module.exports = { app, io, db, pubsub };
