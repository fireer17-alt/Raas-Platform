// Vercel Serverless Function: GET /api/billing/subscription
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Return default free tier subscription
  // In production, this would look up the user in Firestore
  return res.json({
    plan: 'free',
    credits: 100,
    creditsUsed: 0,
    robots: 0,
    robotsLimit: 10,
    stripeCustomerId: null,
    features: [
      '5 Active Robots',
      '100 Monthly Credits',
      'Basic Monitoring',
      '1 GB Data Storage'
    ]
  });
};
