/**
 * Firestore Collections Schema for RaaS Platform
 * 
 * Collections:
 * 1. users
 * 2. robots
 * 3. tasks
 * 4. telemetry
 * 5. commands
 * 6. subscriptions
 */

// Users Collection
const userSchema = {
  uid: 'string',                    // Firebase Auth UID
  email: 'string',
  name: 'string',
  createdAt: 'timestamp',
  subscription: 'string',           // 'free', 'pro', 'enterprise'
  robots: 'array<string>',          // Robot IDs
  credits: 'number',                // Billing credits
  apiKey: 'string',
  settings: 'object'
};

// Robots Collection
const robotSchema = {
  id: 'string',
  name: 'string',
  type: 'string',                   // 'warehouse', 'delivery', 'cleaning', 'security'
  status: 'string',                 // 'online', 'offline', 'idle', 'active'
  location: 'string',               // GPS or warehouse location
  battery: 'number',                // 0-100 %
  lastHeartbeat: 'timestamp',
  createdAt: 'timestamp',
  rosTopics: 'array<string>',
  metadata: 'object'                // Custom fields per robot type
};

// Tasks Collection
const taskSchema = {
  id: 'string',
  name: 'string',
  description: 'string',
  robotId: 'string',
  userId: 'string',
  priority: 'string',               // 'low', 'medium', 'high'
  status: 'string',                 // 'pending', 'assigned', 'in_progress', 'completed', 'failed'
  dueDate: 'timestamp',
  createdAt: 'timestamp',
  completedAt: 'timestamp',
  location: 'object'                // {x, y, z} coordinates
};

// Telemetry Collection (Time Series)
const telemetrySchema = {
  id: 'string',
  robotId: 'string',
  timestamp: 'timestamp',
  battery: 'number',
  location: 'geopoint',             // GeoPoint type
  velocity: 'number',
  status: 'string',
  sensors: 'object',                // {temperature, pressure, etc.}
  cpu: 'number',                    // CPU usage %
  memory: 'number'                  // Memory usage %
};

// Commands Collection
const commandSchema = {
  id: 'string',
  robotId: 'string',
  userId: 'string',
  command: 'string',                // 'move', 'stop', 'reset', etc.
  params: 'object',
  status: 'string',                 // 'pending', 'sent', 'executed', 'failed'
  timestamp: 'timestamp',
  result: 'object'
};

// Subscriptions Collection
const subscriptionSchema = {
  id: 'string',
  userId: 'string',
  plan: 'string',                   // 'free', 'pro', 'enterprise'
  status: 'string',                 // 'active', 'inactive', 'cancelled'
  startDate: 'timestamp',
  endDate: 'timestamp',
  creditsAllocation: 'number',
  robotLimit: 'number',
  features: 'array<string>'
};

module.exports = {
  userSchema,
  robotSchema,
  taskSchema,
  telemetrySchema,
  commandSchema,
  subscriptionSchema
};
