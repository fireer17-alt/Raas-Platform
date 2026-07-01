const mongoose = require('mongoose');

const RobotSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  location: { type: String, default: 'Warehouse Bay' },
  status: { type: String, default: 'online' },
  battery: { type: Number, default: 100 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Robot', RobotSchema);
