const express = require('express');
const router = express.Router();
const stripe = require('../config/stripe');
const { db } = require('../config/firebase');

// In-memory subscription store for local fallback/mock mode
const mockSubscriptions = {
  'global-user': {
    plan: 'free',
    credits: 100,
    creditsUsed: 25,
    robots: 5,
    robotsLimit: 10,
    stripeCustomerId: null,
    features: ['Basic monitoring', 'Task scheduling', '1 GB storage']
  }
};

const getUserSubscription = async (userId) => {
  if (db) {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        return {
          plan: data.subscription || 'free',
          credits: data.credits || 100,
          creditsUsed: data.creditsUsed || 0,
          robots: (data.robots || []).length,
          robotsLimit: data.subscription === 'pro' ? 50 : 10,
          stripeCustomerId: data.stripeCustomerId || null,
          features: data.subscription === 'pro' 
            ? ['50 Active Robots', '1000 Monthly Credits', 'Advanced Analytics', '100 GB Data Storage', 'Priority 24/7 Support']
            : ['5 Active Robots', '100 Monthly Credits', 'Basic Monitoring', '1 GB Data Storage']
        };
      }
    } catch (e) {
      console.error('Error fetching user subscription from DB:', e);
    }
  }
  
  if (!mockSubscriptions[userId]) {
    mockSubscriptions[userId] = {
      plan: 'free',
      credits: 100,
      creditsUsed: 25,
      robots: 5,
      robotsLimit: 10,
      stripeCustomerId: null,
      features: ['Basic monitoring', 'Task scheduling', '1 GB storage']
    };
  }
  return mockSubscriptions[userId];
};

const updateUserSubscription = async (userId, plan, stripeCustomerId = null) => {
  if (db) {
    try {
      const updates = {
        subscription: plan,
        credits: plan === 'pro' ? 1000 : 100
      };
      if (stripeCustomerId) {
        updates.stripeCustomerId = stripeCustomerId;
      }
      await db.collection('users').doc(userId).update(updates);
    } catch (e) {
      console.error('Failed to update user subscription in DB:', e);
    }
  }
  
  if (!mockSubscriptions[userId]) {
    mockSubscriptions[userId] = {};
  }
  mockSubscriptions[userId].plan = plan;
  if (stripeCustomerId) {
    mockSubscriptions[userId].stripeCustomerId = stripeCustomerId;
  }
  if (plan === 'pro') {
    mockSubscriptions[userId].credits = 1000;
    mockSubscriptions[userId].robotsLimit = 50;
    mockSubscriptions[userId].features = ['50 Active Robots', '1000 Monthly Credits', 'Advanced Analytics', '100 GB Data Storage', 'Priority 24/7 Support'];
  } else {
    mockSubscriptions[userId].credits = 100;
    mockSubscriptions[userId].robotsLimit = 10;
    mockSubscriptions[userId].features = ['Basic monitoring', 'Task scheduling', '1 GB storage'];
  }
};

const findUserIdByCustomerId = async (customerId) => {
  if (db) {
    try {
      const userQuery = await db.collection('users').where('stripeCustomerId', '==', customerId).get();
      if (!userQuery.empty) {
        return userQuery.docs[0].id;
      }
    } catch (e) {
      console.error('Error looking up customer ID in DB:', e);
    }
  }
  for (const userId in mockSubscriptions) {
    if (mockSubscriptions[userId].stripeCustomerId === customerId) {
      return userId;
    }
  }
  return 'global-user';
};

// Billing Routes
router.get('/subscription', async (req, res) => {
  try {
    const userId = req.query.userId || 'global-user';
    const sub = await getUserSubscription(userId);
    res.json(sub);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/create-checkout-session', async (req, res) => {
  try {
    const userId = req.body.userId || 'global-user';
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';

    if (!stripe) {
      // Mock checkout redirection - simulates upgrading immediately
      console.log(`[Stripe Mock] Upgrading user ${userId} to pro plan`);
      await updateUserSubscription(userId, 'pro');
      return res.json({ url: `${frontendUrl}/billing?session_id=mock_checkout_completed` });
    }

    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!priceId) {
      return res.status(400).json({ error: 'STRIPE_PRO_PRICE_ID environment variable is missing.' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: userId,
      metadata: {
        userId: userId
      },
      success_url: `${frontendUrl}/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/billing?cancelled=true`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout Session Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/create-portal-session', async (req, res) => {
  try {
    const userId = req.body.userId || 'global-user';
    const sub = await getUserSubscription(userId);
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';

    if (!stripe) {
      // Mock portal redirection - simulates cancellation/downgrade immediately
      console.log(`[Stripe Mock] Downgrading user ${userId} to free plan`);
      await updateUserSubscription(userId, 'free');
      return res.json({ url: `${frontendUrl}/billing?mock_action=cancel` });
    }

    if (!sub.stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer ID associated with this subscription.' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${frontendUrl}/billing`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Portal Session Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('Stripe or Webhook Secret not configured. Accepting simulation event.');
    event = req.body;
  } else {
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.client_reference_id || (session.metadata && session.metadata.userId) || 'global-user';
      console.log(`[Webhook] Payment succeeded for session ${session.id}, upgrading user ${userId} to pro`);
      await updateUserSubscription(userId, 'pro', session.customer);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const userId = await findUserIdByCustomerId(subscription.customer);
      console.log(`[Webhook] Subscription deleted: ${subscription.id}, downgrading user ${userId} to free`);
      await updateUserSubscription(userId, 'free');
      break;
    }
    default:
      console.log(`[Webhook] Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;
