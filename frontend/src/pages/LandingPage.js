import React, { useEffect, useRef, useState } from 'react';
import './LandingPage.css';
import HeroScene from '../components/three/HeroScene';
import { Cpu, Zap, Shield, BarChart3, Coffee, Globe, ArrowRight, ChevronDown } from 'lucide-react';

const LandingPage = ({ onLaunchApp }) => {
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const showcaseRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav" style={{ background: scrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.72)' }}>
        <div className="nav-logo">
          <Cpu size={22} style={{ color: '#0071e3' }} />
          RaaS
        </div>
        <ul className="nav-links">
          <li><button className="nav-link-btn" onClick={() => scrollTo(featuresRef)}>Features</button></li>
          <li><button className="nav-link-btn" onClick={() => scrollTo(showcaseRef)}>Showcase</button></li>
          <li><button className="nav-link-btn" onClick={() => scrollTo(ctaRef)}>Pricing</button></li>
        </ul>
        <button className="nav-cta" onClick={onLaunchApp}>
          Launch App
        </button>
      </nav>

      {/* Hero Section */}
      <section className="hero-section" ref={heroRef}>
        <div className="hero-container">
          <div className="hero-content animate-fade-in-up">
            <div className="hero-label">RaaS Platform</div>
            <h1>
              Robotics.<br />
              <span className="gradient-text">Redefined.</span>
            </h1>
            <p className="hero-subtitle">Robots as a Service</p>
            <p className="hero-desc">
              Deploy, manage, and scale your robot fleet with the most advanced
              cloud-native robotics platform. From warehouse automation to autonomous baristas.
            </p>
            <div className="hero-buttons">
              <button className="hero-btn-primary" onClick={onLaunchApp}>
                Launch App <ArrowRight size={18} />
              </button>
              <button className="hero-btn-secondary" onClick={() => scrollTo(featuresRef)}>
                Learn More
              </button>
            </div>
          </div>
          <div className="hero-scene-container">
            <HeroScene />
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '30px', zIndex: 2, animation: 'bounce 2s infinite' }}>
          <ChevronDown size={24} color="#a3b8b0" style={{ cursor: 'pointer' }} onClick={() => scrollTo(featuresRef)} />
        </div>
      </section>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-number">500+</div>
          <div className="stat-label">Active Robots</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">99.9%</div>
          <div className="stat-label">Uptime</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">&lt;50ms</div>
          <div className="stat-label">Latency</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">24/7</div>
          <div className="stat-label">Monitoring</div>
        </div>
      </div>

      {/* Features Section */}
      <section className="feature-section feature-section-alt" ref={featuresRef}>
        <div className="section-label">Core Features</div>
        <h2 className="section-title">Everything you need to<br />run a robot fleet.</h2>
        <p className="section-desc">
          From real-time telemetry to autonomous task scheduling, RaaS gives you complete control over every robot in your fleet.
        </p>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon blue"><Cpu size={24} /></div>
            <h3>Fleet Management</h3>
            <p>Monitor and control hundreds of robots from a single dashboard. Real-time status, battery levels, and location tracking.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon green"><Zap size={24} /></div>
            <h3>Task Scheduling</h3>
            <p>Intelligent task queue with priority-based routing. Assign missions to the nearest available robot automatically.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon orange"><BarChart3 size={24} /></div>
            <h3>Analytics</h3>
            <p>Deep insights into fleet performance, utilization rates, and operational efficiency with beautiful telemetry graphs.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon purple"><Shield size={24} /></div>
            <h3>Enterprise Security</h3>
            <p>End-to-end encrypted communication, role-based access control, and compliance-ready audit logging.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon red"><Coffee size={24} /></div>
            <h3>Autonomous Barista</h3>
            <p>Full 3D simulation of a 6-DOF robotic arm preparing coffee with real-time physics and customization options.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon cyan"><Globe size={24} /></div>
            <h3>Global Scale</h3>
            <p>Multi-region deployment with automatic failover. Scale from one robot to thousands without infrastructure changes.</p>
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section className="showcase-section" ref={showcaseRef}>
        <div className="section-label">Live Dashboard</div>
        <h2 className="section-title">See your fleet in action.</h2>
        <p className="section-desc">
          A beautiful, intuitive interface designed for operators who need to make decisions fast.
        </p>
        <div className="showcase-visual">
          <div className="showcase-device">
            <div className="showcase-device-inner">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '56px', marginBottom: '16px' }}>🤖</div>
                <h3 style={{ fontSize: '24px', marginBottom: '8px', fontWeight: 600 }}>RaaS Dashboard</h3>
                <p style={{ fontSize: '16px', color: '#86868b' }}>Real-time fleet telemetry, task queues, and billing — all in one place.</p>
                <button 
                  className="hero-btn-primary" 
                  style={{ marginTop: '24px' }}
                  onClick={onLaunchApp}
                >
                  Open Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" ref={ctaRef}>
        <div className="cta-content">
          <h2>Ready to deploy your fleet?</h2>
          <p>Start with our free tier and scale as you grow. No credit card required.</p>
          <button className="hero-btn-primary" onClick={onLaunchApp}>
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        © 2026 RaaS Platform. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
