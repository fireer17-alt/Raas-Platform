// Vercel Serverless Function: POST /api/billing/create-checkout-session
const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const priceId        = process.env.STRIPE_PRO_PRICE_ID;
    const frontendUrl    = process.env.FRONTEND_URL || 'https://smaratara-jeevanchiru17s-projects.vercel.app';

    const userId = req.body?.userId || 'global-user';

    if (!stripeSecretKey || !priceId) {
      // No Stripe configured → mock immediate upgrade
      return res.json({
        url: `${frontendUrl}/billing?session_id=mock_checkout_completed`
      });
    }

    const stripe = Stripe(stripeSecretKey);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      metadata: { userId },
      success_url: `${frontendUrl}/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${frontendUrl}/billing?cancelled=true`,
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout Session Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
