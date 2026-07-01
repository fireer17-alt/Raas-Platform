// Vercel Serverless Function: POST /api/billing/create-portal-session
const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const stripeSecretKey    = process.env.STRIPE_SECRET_KEY;
    const frontendUrl        = process.env.FRONTEND_URL || 'https://smaratara-jeevanchiru17s-projects.vercel.app';
    const stripeCustomerId   = req.body?.stripeCustomerId;

    if (!stripeSecretKey) {
      // No Stripe configured → mock cancel
      return res.json({
        url: `${frontendUrl}/billing?mock_action=cancel`
      });
    }

    if (!stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer ID associated with this subscription.' });
    }

    const stripe = Stripe(stripeSecretKey);

    const session = await stripe.billingPortal.sessions.create({
      customer:   stripeCustomerId,
      return_url: `${frontendUrl}/billing`,
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error('Portal Session Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
