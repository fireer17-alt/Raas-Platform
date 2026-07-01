import React, { useEffect, useState, useRef } from 'react';
import './LandingPage.css';
import { Cpu, Zap, Shield, BarChart3, Coffee, Globe, ArrowRight } from 'lucide-react';

const LandingPage = ({ onLaunchApp, user, onGoToDashboard }) => {
  const [scrolled, setScrolled] = useState(false);
  const [activeMockTab, setActiveMockTab] = useState('telemetry');
  const [activeNav, setActiveNav] = useState(null);
  const canvasRef   = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ─── Particle Canvas ───
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const PARTICLE_COUNT = 90;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -(Math.random() * 0.4 + 0.1),
      alpha: Math.random() * 0.5 + 0.15,
      hue: Math.random() < 0.55 ? 270 : 190,   // purple or cyan
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(124,58,237,${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach(p => {
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        gradient.addColorStop(0, `hsla(${p.hue},80%,70%,${p.alpha})`);
        gradient.addColorStop(1, `hsla(${p.hue},80%,70%,0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="landing-page">
      <canvas ref={canvasRef} className="particle-canvas" />
      {/* Navigation */}
      <nav className="landing-nav" style={{ background: scrolled ? 'rgba(7,9,14,0.95)' : 'rgba(7,9,14,0.75)' }}>
        <div className="nav-logo">
          <img src="/logo.png" alt="ForaMetric Logo" className="nav-logo-img" />
          <span>ForaMetric</span>
        </div>
        <ul
            className="nav-links"
            onMouseLeave={() => setActiveNav(null)}
          >
            {[
              { id: 'product',   label: 'Product' },
              { id: 'solutions', label: 'Solutions' },
              { id: 'resources', label: 'Resources' },
              { id: 'customers', label: 'Customers' },
              { id: 'pricing',   label: 'Pricing' },
            ].map(item => (
              <li key={item.id} onMouseEnter={() => setActiveNav(item.id)}>
                <button className={`nav-link-btn ${activeNav === item.id ? 'nav-link-btn--active' : ''}`}>
                  {item.label} <span className="nav-chevron">{activeNav === item.id ? '▲' : '▼'}</span>
                </button>
              </li>
            ))}

            {/* ── Unified Mega Dropdown ── */}
            {activeNav && (
              <div className="mega-dropdown">

                {/* ── PRICING TAB ── */}
                {activeNav === 'pricing' && (
                  <>
                    <div className="pcd-header">
                      <span className="pcd-icon">▤</span>
                      <span>Subscription Catalog</span>
                    </div>
                    <div className="pcd-grid">
                      <div className="pcd-card">
                        <div className="pcd-tier">TIER 01</div>
                        <div className="pcd-name">FREE</div>
                        <div className="pcd-price"><span>$0</span><sub>/month</sub></div>
                        <ul className="pcd-features">
                          <li>✓ 5 Active Robots</li>
                          <li>✓ 100 Monthly Credits</li>
                          <li>✓ Basic Monitoring</li>
                          <li>✓ 1 GB Data Storage</li>
                        </ul>
                        <button className="pcd-btn pcd-btn-ghost" onClick={onLaunchApp}>Active Protocol</button>
                      </div>
                      <div className="pcd-card pcd-card-pro">
                        <div className="pcd-recommended">RECOMMENDED</div>
                        <div className="pcd-tier" style={{color:'#06b6d4'}}>TIER 02</div>
                        <div className="pcd-name" style={{color:'#06b6d4'}}>PRO</div>
                        <div className="pcd-price pcd-price-pro"><span>$29</span><sub>/month</sub></div>
                        <ul className="pcd-features">
                          <li>✓ 50 Active Robots</li>
                          <li>✓ 1000 Monthly Credits</li>
                          <li>✓ Advanced Analytics</li>
                          <li>✓ 100 GB Data Storage</li>
                          <li>✓ Priority 24/7 Support</li>
                        </ul>
                        <button className="pcd-btn pcd-btn-pro" onClick={onLaunchApp}>Activate Pro Protocol</button>
                      </div>
                      <div className="pcd-card pcd-card-business">
                        <div className="pcd-tier" style={{color:'#7c3aed'}}>TIER 03</div>
                        <div className="pcd-name" style={{color:'#7c3aed'}}>BUSINESS</div>
                        <div className="pcd-price"><span>$50</span><sub>/month</sub></div>
                        <ul className="pcd-features">
                          <li>✓ 150 Active Robots</li>
                          <li>✓ 3000 Monthly Credits</li>
                          <li>✓ Team Workspace &amp; RBAC</li>
                          <li>✓ 500 GB Data Storage</li>
                          <li>✓ 24/7 Priority SLA &amp; Support</li>
                        </ul>
                        <button className="pcd-btn pcd-btn-business" onClick={onLaunchApp}>Activate Business Protocol</button>
                      </div>
                      <div className="pcd-card pcd-card-enterprise">
                        <div className="pcd-tier" style={{color:'#f59e0b'}}>TIER 04</div>
                        <div className="pcd-name" style={{color:'#f59e0b'}}>ENTERPRISE</div>
                        <div className="pcd-price pcd-price-enterprise"><span>CUSTOM</span></div>
                        <ul className="pcd-features">
                          <li>✓ Unlimited Robots</li>
                          <li>✓ Unlimited Monthly Credits</li>
                          <li>✓ Full REST/Websocket API</li>
                          <li>✓ Dedicated Systems Engineer</li>
                          <li>✓ Custom SLA &amp; Integrations</li>
                        </ul>
                        <button className="pcd-btn pcd-btn-enterprise" onClick={onLaunchApp}>Establish Contact</button>
                      </div>
                    </div>
                  </>
                )}

                {/* ── OTHER TABS (placeholders) ── */}
                {activeNav !== 'pricing' && (
                  <div className="mega-placeholder">
                    <div className="mega-placeholder-icon">🚧</div>
                    <div className="mega-placeholder-title">{activeNav.charAt(0).toUpperCase() + activeNav.slice(1)}</div>
                    <div className="mega-placeholder-sub">Content coming soon. Check back later.</div>
                  </div>
                )}

              </div>
            )}
          </ul>
        <div className="nav-actions">
          {user ? (
            // ── Logged-in state ──
            <>
              <div className="nav-user-chip">
                <div className="nav-user-avatar">
                  {user.photoURL
                    ? <img src={user.photoURL} alt="avatar" className="nav-user-photo" />
                    : <span className="nav-user-initial">
                        {(user.displayName || user.email || 'U')[0].toUpperCase()}
                      </span>
                  }
                </div>
                <span className="nav-user-name">
                  {user.displayName || user.email?.split('@')[0] || 'User'}
                </span>
              </div>
              <button className="nav-cta" onClick={onGoToDashboard}>
                Go to Dashboard
              </button>
            </>
          ) : (
            // ── Logged-out state ──
            <>
              <button className="nav-signin" onClick={onLaunchApp}>Sign in</button>
              <button className="nav-cta" onClick={onLaunchApp}>
                Get started for free
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content animate-fade-in-up">
          <div className="hero-label">PHYSICAL AI OBSERVABILITY PLATFORM</div>
          <h1>
            Scale <span>Physical AI</span><br />
            from prototype to production.
          </h1>
          <p className="hero-desc">
            ForaMetric is the multimodal data platform for robotics and autonomy. Capture and visualize data 
            from your fleet, search across every log, and curate datasets to train your next model.
          </p>
          <div className="hero-buttons">
            <button className="hero-btn-primary" onClick={onLaunchApp}>
              Get started for free <ArrowRight size={18} />
            </button>
            <button className="hero-btn-secondary" onClick={onLaunchApp}>
              Book a demo
            </button>
          </div>
        </div>

        {/* Video Frame */}
        <div className="hero-video-container">
          <video 
            className="hero-video" 
            loop 
            autoPlay 
            muted 
            playsInline 
            preload="metadata"
          >
            <source src="https://assets.foxglove.dev/website/Home_hero_2024.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </section>

      {/* Customer Logos Bar */}
      <section className="logos-section">
        <h2>Leading Physical AI companies build with ForaMetric</h2>
        <div className="logos-track">
          <div className="logo-item">AESCAPE</div>
          <div className="logo-item">DEXORY</div>
          <div className="logo-item">WAYVE</div>
          <div className="logo-item">DEXTERITY</div>
          <div className="logo-item">COBOT</div>
          <div className="logo-item"><span>NVIDIA</span></div>
        </div>
      </section>

      {/* Observability Showcase Tab Workspace */}
      <section className="showcase-section">
        <div className="section-label">Workspace Preview</div>
        <h2 className="section-title">Observe, debug, and improve your robots.</h2>
        <p className="section-desc">
          Inspect timelines, view active metrics channels, and examine topic lists via the interactive console panel.
        </p>
        <div className="showcase-visual">
          <div className="showcase-device">
            <div className="showcase-device-inner">
              <div className="tech-mockup">
                <div className="tech-sidebar">
                  <div 
                    className={`tech-nav-item ${activeMockTab === 'telemetry' ? 'active' : ''}`}
                    onClick={() => setActiveMockTab('telemetry')}
                  >
                    📈 Telemetry Channels
                  </div>
                  <div 
                    className={`tech-nav-item ${activeMockTab === 'diagnostics' ? 'active' : ''}`}
                    onClick={() => setActiveMockTab('diagnostics')}
                  >
                    📋 Live Diagnostics Logs
                  </div>
                  <div 
                    className={`tech-nav-item ${activeMockTab === 'config' ? 'active' : ''}`}
                    onClick={() => setActiveMockTab('config')}
                  >
                    ⚙️ ROS Config Node
                  </div>
                </div>
                <div className="tech-content">
                  {activeMockTab === 'telemetry' && (
                    <div>
                      <div className="mockup-graphs">
                        <div className="mockup-card">
                          <div className="mockup-label">Scan rate</div>
                          <div className="mockup-value">120 Hz</div>
                          <div className="mockup-sub">Nominal</div>
                        </div>
                        <div className="mockup-card">
                          <div className="mockup-label">Bandwidth</div>
                          <div className="mockup-value">14.8 MB/s</div>
                          <div className="mockup-sub">Standard throughput</div>
                        </div>
                        <div className="mockup-card">
                          <div className="mockup-label">Latency</div>
                          <div className="mockup-value">22 ms</div>
                          <div className="mockup-sub">Low jitter</div>
                        </div>
                      </div>
                      <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Active Observer State</h4>
                      <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: 1.5 }}>
                        Visualization telemetry parameters connected via local ROS bridges. Inspect active sensor updates automatically.
                      </p>
                    </div>
                  )}

                  {activeMockTab === 'diagnostics' && (
                    <div style={{ fontFamily: 'monospace', fontSize: '12px', background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '4px', border: '1px solid var(--border-subtle)', height: '200px', overflowY: 'auto' }}>
                      <p style={{ color: '#10b981', margin: '4px 0' }}>[INFO] [rosbridge_websocket]: Client connection authenticated successfully.</p>
                      <p style={{ color: '#f59e0b', margin: '4px 0' }}>[WARN] [battery_node]: Voltage cell 4 drop detected. Threshold nominal.</p>
                      <p style={{ color: '#63b3ed', margin: '4px 0' }}>[DEBUG] [telemetry_publisher]: Publishing topic odom coordinate.</p>
                      <p style={{ color: '#10b981', margin: '4px 0' }}>[INFO] [action_server]: Waypoint navigation goal accomplished.</p>
                      <p style={{ color: '#9ca3af', margin: '4px 0' }}>[TRACE] [telemetry_publisher]: Packet payload: 412 bytes.</p>
                    </div>
                  )}

                  {activeMockTab === 'config' && (
                    <div style={{ fontFamily: 'monospace', fontSize: '12px', background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '4px', border: '1px solid var(--border-subtle)', height: '200px', overflowY: 'auto' }}>
                      <pre style={{ color: '#06b6d4', margin: 0 }}>{JSON.stringify({
  "node_name": "raas_telemetry_bridge",
  "version": "2.4.1",
  "parameters": {
    "rosbridge_url": "ws://localhost:9090",
    "reconnect_timeout_ms": 5000,
    "topics": {
      "telemetry": "/robot/telemetry",
      "command": "/robot/command",
      "laser_scan": "/robot/scan"
    },
    "enable_compression": true,
    "max_queue_size": 100
  }
}, null, 2)}</pre>
                    </div>
                  )}

                  <div style={{ marginTop: '24px' }}>
                    <button className="hero-btn-primary" onClick={onLaunchApp}>
                      Launch Console Workspace
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Purpose Features Grid */}
      <section className="feature-section feature-section-alt">
        <div className="section-label">Core Capabilities</div>
        <h2 className="section-title">Observe, debug, and improve.</h2>
        <p className="section-desc">
          Custom built for physical AI automation fleets. Track active units from a centralized panel.
        </p>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon blue"><Cpu size={24} /></div>
            <h3>Multimodal Telemetry</h3>
            <p>Inspect multi-topic streams, coordinates, battery limits, and network status indexes live.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon green"><Zap size={24} /></div>
            <h3>Orchestrator Node</h3>
            <p>Coordinate autonomous task routes and robot actions. Automatically handles network lag and failover.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon orange"><BarChart3 size={24} /></div>
            <h3>Diagnostic Analytics</h3>
            <p>Plot custom telemetry streams, inspect timelines, and isolate latency graphs instantly.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon purple"><Shield size={24} /></div>
            <h3>Secure Tunnel</h3>
            <p>Complies with enterprise security: end-to-end payload encryption and token access bounds.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon red"><Coffee size={24} /></div>
            <h3>3D Sim WebGL</h3>
            <p>Live WebGL rendering of a 6-DOF barista arm simulation with direct forward kinematics resolution.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon cyan"><Globe size={24} /></div>
            <h3>Stripe Sandbox Tier</h3>
            <p>Seamless Stripe checkout sandbox integrations. Easily upgrade to access unlimited nodes and telemetry channels.</p>
          </div>
        </div>
      </section>


      {/* Pricing Section */}
      <section className="pricing-section">
        <div className="section-label">Pricing</div>
        <h2 className="section-title">Simple, transparent pricing.</h2>
        <p className="section-desc">
          Start free, scale as your fleet grows. No hidden fees, cancel anytime.
        </p>
        <div className="pricing-grid">

          {/* Free */}
          <div className="pricing-card">
            <div className="pricing-tier-label">Starter</div>
            <div className="pricing-price">
              <span className="pricing-amount">$0</span>
              <span className="pricing-period">/ month</span>
            </div>
            <p className="pricing-tagline">Perfect for individual developers and small projects.</p>
            <ul className="pricing-features">
              <li><span className="check">✓</span> Up to <strong>3 robots</strong></li>
              <li><span className="check">✓</span> 100 telemetry credits / mo</li>
              <li><span className="check">✓</span> Basic Fleet Dashboard</li>
              <li><span className="check">✓</span> Task Manager (10 tasks)</li>
              <li><span className="check">✓</span> Community support</li>
              <li><span className="muted">✗</span> ROS Bridge integration</li>
              <li><span className="muted">✗</span> Priority support</li>
            </ul>
            <button className="pricing-btn pricing-btn-outline" onClick={onLaunchApp}>
              Get started free
            </button>
          </div>

          {/* Pro — highlighted */}
          <div className="pricing-card pricing-card-featured">
            <div className="pricing-badge">Most Popular</div>
            <div className="pricing-tier-label">Pro</div>
            <div className="pricing-price">
              <span className="pricing-amount">$49</span>
              <span className="pricing-period">/ month</span>
            </div>
            <p className="pricing-tagline">For growing teams deploying autonomous fleets.</p>
            <ul className="pricing-features">
              <li><span className="check">✓</span> Up to <strong>25 robots</strong></li>
              <li><span className="check">✓</span> 5,000 telemetry credits / mo</li>
              <li><span className="check">✓</span> Full Fleet Dashboard</li>
              <li><span className="check">✓</span> Unlimited task scheduling</li>
              <li><span className="check">✓</span> ROS Bridge integration</li>
              <li><span className="check">✓</span> Real-time diagnostics logs</li>
              <li><span className="check">✓</span> Email support (24h SLA)</li>
            </ul>
            <button className="pricing-btn pricing-btn-primary" onClick={onLaunchApp}>
              Start Pro trial
            </button>
          </div>

          {/* Enterprise */}
          <div className="pricing-card">
            <div className="pricing-tier-label">Enterprise</div>
            <div className="pricing-price">
              <span className="pricing-amount">Custom</span>
            </div>
            <p className="pricing-tagline">Dedicated infrastructure for large-scale deployments.</p>
            <ul className="pricing-features">
              <li><span className="check">✓</span> <strong>Unlimited robots</strong></li>
              <li><span className="check">✓</span> Unlimited telemetry credits</li>
              <li><span className="check">✓</span> Private cloud / on-premise</li>
              <li><span className="check">✓</span> SSO & advanced RBAC</li>
              <li><span className="check">✓</span> Custom ROS integrations</li>
              <li><span className="check">✓</span> Dedicated account manager</li>
              <li><span className="check">✓</span> 99.9% uptime SLA</li>
            </ul>
            <button className="pricing-btn pricing-btn-outline" onClick={onLaunchApp}>
              Contact sales
            </button>
          </div>

        </div>
      </section>

      {/* CTA Section */}

      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to orchestrate your fleet?</h2>
          <p>Get started with our free tier, connect up to 5 devices, and scale seamlessly.</p>
          <button className="hero-btn-primary" onClick={onLaunchApp}>
            Get started for free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        © 2026 ForaMetric Platform. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
