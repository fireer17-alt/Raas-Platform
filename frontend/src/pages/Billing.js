import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CreditCard, Check, Award } from 'lucide-react';

// On Vercel, use the serverless API routes directly.
// Falls back to the local backend when running locally.
const BILLING_API = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api/billing`
  : '/api/billing';

const defaultSubscription = {
  plan: 'free',
  credits: 100,
  creditsUsed: 0,
  robots: 0,
  robotsLimit: 10,
  stripeCustomerId: null,
  features: ['5 Active Robots', '100 Monthly Credits', 'Basic Monitoring', '1 GB Data Storage']
};

const Billing = () => {
  const [subscription, setSubscription] = useState(defaultSubscription);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('session_id')) {
      setNotification({
        type: 'success',
        message: 'PRO PROTOCOL ACTIVATED: Payment authorization complete and subscription status synchronized.'
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('mock_action') === 'cancel') {
      setNotification({
        type: 'warning',
        message: 'SUBSCRIPTION TERMINATED: Returned to Free tier operations.'
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('cancelled') === 'true') {
      setNotification({
        type: 'info',
        message: 'TRANSACTION CANCELLED: Stripe Checkout process aborted by operator.'
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const fetchBilling = async () => {
      try {
        const res = await axios.get(`${BILLING_API}/subscription`);
        setSubscription(res.data || defaultSubscription);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching billing:', error);
        setSubscription(defaultSubscription);
        setLoading(false);
      }
    };

    fetchBilling();
  }, []);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${BILLING_API}/create-checkout-session`, {
        userId: 'global-user'
      });
      if (res.data && res.data.url) {
        window.location.href = res.data.url;
      } else {
        throw new Error('No redirection URL returned from server.');
      }
    } catch (error) {
      console.error('Redirection error:', error);
      alert('Failed to initiate checkout process. Please check server logs.');
      setLoading(false);
    }
  };

  const handleManagePortal = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${BILLING_API}/create-portal-session`, {
        userId: 'global-user',
        stripeCustomerId: subscription.stripeCustomerId
      });
      if (res.data && res.data.url) {
        window.location.href = res.data.url;
      } else {
        throw new Error('No portal URL returned from server.');
      }
    } catch (error) {
      console.error('Portal error:', error);
      alert('Failed to access subscription portal: ' + (error.response?.data?.error || error.message));
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
        [VERIFYING_BILLING_METRICS...]
      </div>
    );
  }

  const creditsPercentage = subscription 
    ? ((subscription.credits - subscription.creditsUsed) / subscription.credits) * 100 
    : 0;

  const robotsPercentage = subscription 
    ? (subscription.robots / subscription.robotsLimit) * 100 
    : 0;

  const plans = [
    {
      tier: 'TIER 01',
      name: 'Free',
      price: '$0',
      period: '/month',
      accent: '#6e6e73',
      borderColor: '#d2d2d7',
      features: ['5 Active Robots', '100 Monthly Credits', 'Basic Monitoring', '1 GB Data Storage']
    },
    {
      tier: 'TIER 02',
      name: 'Pro',
      price: '$29',
      period: '/month',
      accent: 'var(--accent-cyan)',
      borderColor: 'var(--accent-cyan)',
      recommended: true,
      features: ['50 Active Robots', '1000 Monthly Credits', 'Advanced Analytics', '100 GB Data Storage', 'Priority 24/7 Support']
    },
    {
      tier: 'TIER 03',
      name: 'Business',
      price: '$50',
      period: '/month',
      accent: '#af52de',
      borderColor: '#af52de',
      features: ['150 Active Robots', '3000 Monthly Credits', 'Team Workspace & RBAC', '500 GB Data Storage', '24/7 Priority SLA & Support']
    },
    {
      tier: 'TIER 04',
      name: 'Enterprise',
      price: 'CUSTOM',
      period: '',
      accent: 'var(--accent-gold)',
      borderColor: 'var(--accent-gold)',
      features: ['Unlimited Robots', 'Unlimited Monthly Credits', 'Full REST/Websocket API', 'Dedicated Systems Engineer', 'Custom SLA & Integrations']
    }
  ];

  return (
    <div className="billing-page">
      <div className="page-header">
        <h1>Billing & Subscription</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--accent-cyan)' }}>
          BILLING PROTOCOL: ENCRYPTED
        </div>
      </div>

      {notification && (
        <div style={{
          padding: '16px',
          borderRadius: '6px',
          background: notification.type === 'success' ? 'rgba(0, 240, 255, 0.1)' : notification.type === 'warning' ? 'rgba(255, 170, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${notification.type === 'success' ? 'var(--accent-cyan)' : notification.type === 'warning' ? 'var(--accent-gold)' : 'var(--text-muted)'}`,
          color: notification.type === 'success' ? 'var(--accent-cyan)' : notification.type === 'warning' ? 'var(--accent-gold)' : 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          fontSize: '14px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>{notification.message}</div>
          <button 
            onClick={() => setNotification(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 'bold'
            }}
          >
            [DISMISS]
          </button>
        </div>
      )}

      {subscription && (
        <div className="cyber-panel" style={{ marginBottom: '28px', padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '20px', marginBottom: '24px' }}>
            <div>
              <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>CURRENT ACTIVE SUBSCRIPTION</span>
              <h2 style={{ fontSize: '26px', fontWeight: 'bold', fontFamily: 'var(--font-heading)', color: '#1d1d1f', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Plan: <span style={{ color: subscription.plan === 'pro' ? 'var(--accent-cyan)' : subscription.plan === 'enterprise' ? 'var(--accent-gold)' : '#1d1d1f' }}>{subscription.plan}</span>
              </h2>
            </div>
            
            <div style={{ background: 'rgba(0, 113, 227, 0.08)', border: '1px solid var(--panel-border-hover)', borderRadius: '6px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 'bold' }}>
              <Award size={18} />
              SYSTEM PROTOCOL STATUS: ACTIVE
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h3 style={{ fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#424245', fontWeight: 'bold' }}>Resource Quotas</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: '#424245', fontWeight: '600' }}>Credits Remaining</span>
                  <span style={{ color: '#1d1d1f', fontWeight: 'bold' }}>{subscription.credits - subscription.creditsUsed} / {subscription.credits} CR</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${creditsPercentage}%`, height: '100%', background: 'var(--accent-cyan)', borderRadius: '4px' }}></div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: '#424245', fontWeight: '600' }}>Nodes Active</span>
                  <span style={{ color: '#1d1d1f', fontWeight: 'bold' }}>{subscription.robots} / {subscription.robotsLimit} Units</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${robotsPercentage}%`, height: '100%', background: 'var(--accent-green)', borderRadius: '4px' }}></div>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#424245', marginBottom: '15px', fontWeight: 'bold' }}>Included Core Access Features</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                {subscription.features.map((feature, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1d1d1f', fontWeight: '500' }}>
                    <Check size={16} style={{ color: 'var(--accent-green)' }} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <h2 className="cyber-title" style={{ marginBottom: '16px' }}>
        <CreditCard size={20} style={{ color: 'var(--accent-cyan)' }} />
        Subscription Catalog
      </h2>

      <div className="catalog-row" style={{ gap: '20px' }}>
        {plans.map((plan) => (
          <div 
            key={plan.name}
            className="cyber-panel" 
            style={{ 
              flex: '0 0 300px',
              display: 'flex', 
              flexDirection: 'column', 
              gap: '18px', 
              borderTop: `4px solid ${plan.borderColor}`,
              position: 'relative',
              ...(plan.recommended ? {
                border: '1px solid var(--accent-cyan)',
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.15)'
              } : {})
            }}
          >
            {plan.recommended && (
              <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0, 240, 255, 0.15)', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)', borderRadius: '4px', fontSize: '11px', padding: '2px 8px', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>RECOMMENDED</div>
            )}
            <div>
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: plan.accent, fontWeight: 'bold' }}>{plan.tier}</span>
              <h3 style={{ fontSize: '22px', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', fontWeight: 'bold', color: '#1d1d1f', marginTop: '4px' }}>{plan.name}</h3>
              <p style={{ fontSize: '26px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', margin: '12px 0', color: plan.accent }}>{plan.price}<span style={{ fontSize: '14px', color: '#6e6e73' }}>{plan.period}</span></p>
            </div>
            
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '14px', flex: 1 }}>
              {plan.features.map((feat, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1d1d1f', fontWeight: '500' }}>
                  <Check size={16} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                  {feat}
                </li>
              ))}
            </ul>
            
            <button 
              className="cyber-button" 
              onClick={() => {
                const currentPlan = subscription?.plan || 'free';
                if (plan.name === 'Enterprise') {
                  window.location.href = 'mailto:support@smaratara.com?subject=Enterprise%20Plan%20Inquiry';
                } else if (plan.name === 'Pro' || plan.name === 'Business') {
                  if (currentPlan === plan.name.toLowerCase()) {
                    handleManagePortal();
                  } else {
                    handleUpgrade();
                  }
                } else if (plan.name === 'Free') {
                  if (currentPlan !== 'free') {
                    handleManagePortal();
                  }
                }
              }}
              disabled={plan.name === 'Free' && (subscription?.plan || 'free') === 'free'}
              style={{ 
                marginTop: 'auto', 
                width: '100%', 
                height: '42px',
                cursor: (plan.name === 'Free' && (subscription?.plan || 'free') === 'free') ? 'not-allowed' : 'pointer',
                opacity: (plan.name === 'Free' && (subscription?.plan || 'free') === 'free') ? 0.6 : 1,
                ...(plan.name === 'Business' ? {
                  background: 'linear-gradient(135deg, #af52de 0%, #7c3aed 100%)',
                  boxShadow: '0 0 12px rgba(175, 82, 222, 0.3)',
                  color: '#ffffff'
                } : {}),
                ...(plan.name === 'Enterprise' ? {
                  background: 'linear-gradient(135deg, var(--accent-gold) 0%, rgba(255, 170, 68, 0.5) 100%)',
                  boxShadow: '0 0 10px rgba(255, 170, 68, 0.3)',
                  color: '#1d1d1f'
                } : {}),
                ...(plan.name === 'Free' && (subscription?.plan || 'free') === 'free' ? {
                  background: 'rgba(0, 0, 0, 0.04)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  color: '#6e6e73'
                } : {})
              }}
            >
              {plan.name === 'Enterprise' 
                ? 'Establish Contact' 
                : (subscription?.plan || 'free') === plan.name.toLowerCase()
                  ? (plan.name === 'Free' ? 'Active Protocol' : 'Manage Subscription')
                  : `Activate ${plan.name} Protocol`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Billing;
