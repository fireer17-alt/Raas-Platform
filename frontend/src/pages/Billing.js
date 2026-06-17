import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Billing = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/billing/subscription');
        setSubscription(res.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching billing:', error);
        setLoading(false);
      }
    };

    fetchBilling();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="billing-page">
      <h1>Billing & Subscription</h1>

      {subscription && (
        <div className="subscription-card" style={{ padding: '30px', backgroundColor: 'white', borderRadius: '5px', marginBottom: '20px' }}>
          <h2>Current Plan: <strong>{subscription.plan.toUpperCase()}</strong></h2>
          <div className="plan-details" style={{ marginTop: '20px' }}>
            <p><strong>Credits Available:</strong> {subscription.credits - subscription.creditsUsed} / {subscription.credits}</p>
            <p><strong>Robots Used:</strong> {subscription.robots} / {subscription.robotsLimit}</p>
            <div style={{ marginTop: '20px' }}>
              <h3>Features Included:</h3>
              <ul>
                {subscription.features.map((feature, idx) => (
                  <li key={idx} style={{ marginLeft: '20px', marginTop: '5px' }}>✓ {feature}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <div className="plan-card" style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '2px solid #6c757d' }}>
          <h3>Free</h3>
          <p className="price" style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>$0/month</p>
          <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
            <li style={{ marginTop: '8px' }}>✓ 5 Robots</li>
            <li style={{ marginTop: '8px' }}>✓ 100 Credits</li>
            <li style={{ marginTop: '8px' }}>✓ Basic Monitoring</li>
            <li style={{ marginTop: '8px' }}>✓ 1 GB Storage</li>
          </ul>
        </div>

        <div className="plan-card" style={{ padding: '20px', backgroundColor: '#e7f3ff', borderRadius: '5px', border: '2px solid #007bff' }}>
          <h3>Pro</h3>
          <p className="price" style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0', color: '#007bff' }}>$29/month</p>
          <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
            <li style={{ marginTop: '8px' }}>✓ 50 Robots</li>
            <li style={{ marginTop: '8px' }}>✓ 1000 Credits</li>
            <li style={{ marginTop: '8px' }}>✓ Advanced Analytics</li>
            <li style={{ marginTop: '8px' }}>✓ 100 GB Storage</li>
            <li style={{ marginTop: '8px' }}>✓ Priority Support</li>
          </ul>
          <button style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%' }}>Upgrade to Pro</button>
        </div>

        <div className="plan-card" style={{ padding: '20px', backgroundColor: '#fff3cd', borderRadius: '5px', border: '2px solid #ffc107' }}>
          <h3>Enterprise</h3>
          <p className="price" style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0', color: '#ff9800' }}>Custom</p>
          <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
            <li style={{ marginTop: '8px' }}>✓ Unlimited Robots</li>
            <li style={{ marginTop: '8px' }}>✓ Unlimited Credits</li>
            <li style={{ marginTop: '8px' }}>✓ Full API Access</li>
            <li style={{ marginTop: '8px' }}>✓ Dedicated Support</li>
            <li style={{ marginTop: '8px' }}>✓ Custom Integrations</li>
          </ul>
          <button style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%' }}>Contact Sales</button>
        </div>
      </div>
    </div>
  );
};

export default Billing;
