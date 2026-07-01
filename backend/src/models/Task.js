const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  robotId: { type: String, default: 'unassigned' },
  priority: { type: String, default: 'medium' },
  dueDate: { type: String, default: 'ASAP' },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', TaskSchema);
