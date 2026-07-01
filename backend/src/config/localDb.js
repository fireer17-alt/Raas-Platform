const fs = require('fs');
const path = require('path');
const { isMongoConnected } = require('./mongo');
const Robot = require('../models/Robot');
const Task = require('../models/Task');
const Subscription = require('../models/Subscription');

const dataDir = path.join(__dirname, '../../data');
const dbFilePath = path.join(dataDir, 'database.json');

// Default initial seed state
const initialData = {
  robots: [
    { id: 'robot-1', name: 'Warehouse Bot 1', type: 'warehouse', status: 'online', battery: 85, location: 'Warehouse A' }
  ],
  tasks: [
    { id: 'task-1', name: 'Pick and place items', robotId: 'robot-1', status: 'pending', priority: 'high', dueDate: 'ASAP' }
  ],
  subscriptions: {
    'global-user': {
      plan: 'free',
      credits: 100,
      creditsUsed: 25,
      robots: 1,
      robotsLimit: 10,
      stripeCustomerId: null,
      features: ['5 Active Robots', '100 Monthly Credits', 'Basic Monitoring', '1 GB Data Storage']
    }
  }
};

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const loadDatabase = () => {
  try {
    if (fs.existsSync(dbFilePath)) {
      const raw = fs.readFileSync(dbFilePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error('Error reading database file, initializing fresh store:', error);
  }
  saveDatabase(initialData);
  return { ...initialData };
};

const saveDatabase = (data) => {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing database file:', error);
  }
};

let memoryDb = loadDatabase();

const localDb = {
  getRobots: async () => {
    if (isMongoConnected()) {
      try {
        const docs = await Robot.find().sort({ createdAt: -1 });
        if (docs.length > 0) return docs;
      } catch (e) { console.error('Mongo Robot query fallback:', e.message); }
    }
    return memoryDb.robots || [];
  },

  addRobot: async (robotData) => {
    const newRobot = {
      id: robotData.id || `robot-${Date.now()}`,
      name: robotData.name || 'Alpha-Unit',
      type: robotData.type || 'warehouse',
      location: robotData.location || 'Bay 1',
      status: robotData.status || 'online',
      battery: robotData.battery !== undefined ? robotData.battery : 100,
      createdAt: robotData.createdAt || new Date().toISOString()
    };
    memoryDb.robots.unshift(newRobot);
    saveDatabase(memoryDb);

    if (isMongoConnected()) {
      try {
        await Robot.create(newRobot);
      } catch (e) { console.error('Mongo Robot insert fallback:', e.message); }
    }
    return newRobot;
  },

  getTasks: async () => {
    if (isMongoConnected()) {
      try {
        const docs = await Task.find().sort({ createdAt: -1 });
        if (docs.length > 0) return docs;
      } catch (e) { console.error('Mongo Task query fallback:', e.message); }
    }
    return memoryDb.tasks || [];
  },

  addTask: async (taskData) => {
    const newTask = {
      id: taskData.id || `task-${Date.now()}`,
      name: taskData.name || 'Autonomous Task',
      robotId: taskData.robotId || 'unassigned',
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate || 'ASAP',
      status: taskData.status || 'pending',
      createdAt: taskData.createdAt || new Date().toISOString()
    };
    memoryDb.tasks.unshift(newTask);
    saveDatabase(memoryDb);

    if (isMongoConnected()) {
      try {
        await Task.create(newTask);
      } catch (e) { console.error('Mongo Task insert fallback:', e.message); }
    }
    return newTask;
  },

  getSubscription: async (userId = 'global-user') => {
    if (!memoryDb.subscriptions[userId]) {
      memoryDb.subscriptions[userId] = {
        plan: 'free',
        credits: 100,
        creditsUsed: 25,
        robots: memoryDb.robots.length,
        robotsLimit: 10,
        stripeCustomerId: null,
        features: ['5 Active Robots', '100 Monthly Credits', 'Basic Monitoring', '1 GB Data Storage']
      };
      saveDatabase(memoryDb);
    }
    memoryDb.subscriptions[userId].robots = memoryDb.robots.length;

    if (isMongoConnected()) {
      try {
        let subDoc = await Subscription.findOne({ userId });
        if (!subDoc) {
          subDoc = await Subscription.create({ userId, ...memoryDb.subscriptions[userId] });
        }
        return subDoc;
      } catch (e) { console.error('Mongo Subscription fetch fallback:', e.message); }
    }
    return memoryDb.subscriptions[userId];
  },

  updateSubscription: async (userId = 'global-user', plan, stripeCustomerId = null) => {
    if (!memoryDb.subscriptions[userId]) {
      memoryDb.subscriptions[userId] = {};
    }
    const sub = memoryDb.subscriptions[userId];
    sub.plan = plan;
    if (stripeCustomerId) {
      sub.stripeCustomerId = stripeCustomerId;
    }
    if (plan === 'pro') {
      sub.credits = 1000;
      sub.robotsLimit = 50;
      sub.features = ['50 Active Robots', '1000 Monthly Credits', 'Advanced Analytics', '100 GB Data Storage', 'Priority 24/7 Support'];
    } else if (plan === 'business') {
      sub.credits = 3000;
      sub.robotsLimit = 150;
      sub.features = ['150 Active Robots', '3000 Monthly Credits', 'Team Workspace & RBAC', '500 GB Data Storage', '24/7 Priority SLA & Support'];
    } else {
      sub.credits = 100;
      sub.robotsLimit = 10;
      sub.features = ['5 Active Robots', '100 Monthly Credits', 'Basic Monitoring', '1 GB Data Storage'];
    }
    sub.robots = memoryDb.robots.length;
    saveDatabase(memoryDb);

    if (isMongoConnected()) {
      try {
        await Subscription.findOneAndUpdate({ userId }, sub, { upsert: true });
      } catch (e) { console.error('Mongo Subscription update fallback:', e.message); }
    }
    return sub;
  }
};

module.exports = localDb;
