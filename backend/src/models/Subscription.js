const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  plan: { type: String, default: 'free' },
  credits: { type: Number, default: 100 },
  creditsUsed: { type: Number, default: 25 },
  robots: { type: Number, default: 1 },
  robotsLimit: { type: Number, default: 10 },
  stripeCustomerId: { type: String, default: null },
  features: [{ type: String }],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);
