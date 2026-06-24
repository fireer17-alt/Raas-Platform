import React, { useEffect, useState } from 'react';
import './LandingPage.css';
import { Cpu, Zap, Shield, BarChart3, Coffee, Globe, ArrowRight } from 'lucide-react';

const LandingPage = ({ onLaunchApp }) => {
  const [scrolled, setScrolled] = useState(false);
  const [activeMockTab, setActiveMockTab] = useState('telemetry');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav" style={{ background: scrolled ? 'rgba(7,9,14,0.95)' : 'rgba(7,9,14,0.75)' }}>
        <div className="nav-logo">
          <img src="/logo.png" alt="RaaS Logo" className="nav-logo-img" />
          <span>Foxglove</span> RaaS
        </div>
        <ul className="nav-links">
          <li><button className="nav-link-btn">Product</button></li>
          <li><button className="nav-link-btn">Solutions</button></li>
          <li><button className="nav-link-btn">Resources</button></li>
          <li><button className="nav-link-btn">Customers</button></li>
          <li><button className="nav-link-btn">Pricing</button></li>
        </ul>
        <div className="nav-actions">
          <button className="nav-signin" onClick={onLaunchApp}>Sign in</button>
          <button className="nav-cta" onClick={onLaunchApp}>
            Get started for free
          </button>
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
            RaaS is the multimodal data platform for robotics and autonomy. Capture and visualize data 
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
        <h2>Leading Physical AI companies build with RaaS</h2>
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
        © 2026 Foxglove RaaS Platform. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
