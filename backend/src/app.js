const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl && req.originalUrl.includes('/webhook')) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Modular Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/robots', require('./routes/robots'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/billing', require('./routes/billing'));

module.exports = app;
