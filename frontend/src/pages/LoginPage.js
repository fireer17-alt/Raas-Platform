import React, { useState, useEffect, useRef } from 'react';
import './LoginPage.css';
import { auth, googleProvider } from '../config/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { Cpu, Mail, Lock, Eye, EyeOff, User, ArrowLeft, Check, AlertCircle } from 'lucide-react';

// ─── Google SVG Icon ─────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// ─── Particle Canvas ──────────────────────────────────────────────────────────
const ParticleCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const COUNT = 70;
    const particles = Array.from({ length: COUNT }, () => ({
      x:     Math.random() * window.innerWidth,
      y:     Math.random() * window.innerHeight,
      r:     Math.random() * 1.6 + 0.3,
      vx:    (Math.random() - 0.5) * 0.3,
      vy:    -(Math.random() * 0.35 + 0.1),
      alpha: Math.random() * 0.45 + 0.1,
      hue:   Math.random() < 0.5 ? 265 : 200,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `hsla(${particles[i].hue}, 80%, 70%, ${0.06 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw dots
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 75%, ${p.alpha})`;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -5)  p.y = canvas.height + 5;
        if (p.x < -5)  p.x = canvas.width + 5;
        if (p.x > canvas.width  + 5) p.x = -5;
        if (p.y > canvas.height + 5) p.y = -5;
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="login-canvas" />;
};

// ─── Main LoginPage Component ─────────────────────────────────────────────────
const LoginPage = ({ onSuccess, onBack }) => {
  const [tab, setTab]               = useState('signin');   // 'signin' | 'signup'
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]           = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [success, setSuccess]       = useState(false);

  const clearError = () => setError('');

  // ── Human-readable Firebase errors ──
  const friendlyError = (code) => {
    const map = {
      'auth/user-not-found':        'No account found with that email.',
      'auth/wrong-password':        'Incorrect password. Please try again.',
      'auth/invalid-email':         'Please enter a valid email address.',
      'auth/email-already-in-use':  'An account already exists with this email.',
      'auth/weak-password':         'Password must be at least 6 characters.',
      'auth/too-many-requests':     'Too many attempts. Please try again later.',
      'auth/popup-closed-by-user':  'Sign-in popup was closed. Please try again.',
      'auth/network-request-failed':'Network error. Check your connection.',
      'auth/invalid-credential':    'Invalid credentials. Please check and try again.',
      'auth/operation-not-allowed': '⚠️ Email/Password sign-in is not enabled. Go to Firebase Console → Authentication → Sign-in method and enable it.',
      'auth/invalid-api-key':       '⚠️ Firebase API key is invalid. Check your .env file.',
      'auth/configuration-not-found': '⚠️ Firebase project not configured. Enable Authentication in Firebase Console.',
    };
    return map[code] || `Error [${code}]: Something went wrong. Please try again.`;
  };

  // ── Email / Password sign-in ──
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccess(true);
      setTimeout(() => onSuccess && onSuccess(auth.currentUser), 1000);
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  // ── Email / Password sign-up ──
  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setError('');
    if (!displayName.trim()) { setError('Please enter your name.'); return; }
    if (!email || !password)  { setError('Please fill in all fields.'); return; }
    if (password !== confirm)  { setError('Passwords do not match.'); return; }
    if (password.length < 6)   { setError('Password must be at least 6 characters.'); return; }
    if (!termsAccepted)        { setError('Please accept the terms to continue.'); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: displayName.trim() });
      setSuccess(true);
      setTimeout(() => onSuccess && onSuccess(cred.user), 1000);
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  // ── Google sign-in ──
  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setSuccess(true);
      setTimeout(() => onSuccess && onSuccess(result.user), 1000);
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Forgot password ──
  const handleForgot = async () => {
    setError('');
    if (!email) { setError('Enter your email above, then click "Forgot password".'); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setForgotSent(true);
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  // ── Tab switch resets form ──
  const switchTab = (t) => {
    setTab(t);
    setError('');
    setForgotSent(false);
    setPassword('');
    setConfirm('');
  };

  return (
    <div className="login-root">
      {/* Ambient orbs */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      {/* Grid */}
      <div className="login-grid" />

      {/* Particles */}
      <ParticleCanvas />

      {/* Back button */}
      {onBack && (
        <button className="login-back" onClick={onBack}>
          <ArrowLeft size={14} />
          Back
        </button>
      )}

      {/* Card */}
      <div className="login-card">
        {/* Brand */}
        <div className="login-brand">
          <div className="login-logo-wrap">
            <Cpu size={30} className="login-logo-icon" />
          </div>
          <span className="login-brand-name">ForaMetric</span>
          <span className="login-brand-sub">
            {tab === 'signin' ? 'Sign in to your RaaS platform' : 'Create your RaaS account'}
          </span>
        </div>

        {/* Success state */}
        {success ? (
          <div className="login-success">
            <div className="login-success-icon">
              <Check size={32} color="#fff" strokeWidth={3} />
            </div>
            <span className="login-success-title">Welcome!</span>
            <span className="login-success-sub">Launching your dashboard…</span>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="login-tabs">
              <button
                id="tab-signin"
                className={`login-tab ${tab === 'signin' ? 'active' : ''}`}
                onClick={() => switchTab('signin')}
              >
                Sign In
              </button>
              <button
                id="tab-signup"
                className={`login-tab ${tab === 'signup' ? 'active' : ''}`}
                onClick={() => switchTab('signup')}
              >
                Sign Up
              </button>
            </div>

            {/* Error banner */}
            {error && (
              <div className="login-error">
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* Forgot-password success */}
            {forgotSent && !error && (
              <div className="login-error" style={{ background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)', color: '#6ee7b7' }}>
                <Check size={16} style={{ flexShrink: 0 }} />
                Reset link sent! Check your email.
              </div>
            )}

            {/* ─── SIGN IN FORM ─── */}
            {tab === 'signin' && (
              <form className="login-form" onSubmit={handleEmailSignIn} noValidate>
                <div className="login-field">
                  <label className="login-label" htmlFor="signin-email">Email</label>
                  <div className="login-input-wrap">
                    <Mail size={16} className="login-input-icon" />
                    <input
                      id="signin-email"
                      className={`login-input ${error ? 'error' : ''}`}
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => { setEmail(e.target.value); clearError(); }}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label className="login-label" htmlFor="signin-password">Password</label>
                  <div className="login-input-wrap">
                    <Lock size={16} className="login-input-icon" />
                    <input
                      id="signin-password"
                      className={`login-input ${error ? 'error' : ''}`}
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => { setPassword(e.target.value); clearError(); }}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="login-input-toggle"
                      onClick={() => setShowPass(v => !v)}
                      tabIndex={-1}
                      aria-label="Toggle password visibility"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="login-forgot">
                  <a href="#forgot" onClick={e => { e.preventDefault(); handleForgot(); }}>
                    Forgot password?
                  </a>
                </div>

                <button id="btn-signin" type="submit" className="login-submit" disabled={loading || googleLoading}>
                  {loading ? <span className="login-spinner" /> : null}
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>
            )}

            {/* ─── SIGN UP FORM ─── */}
            {tab === 'signup' && (
              <form className="login-form" onSubmit={handleEmailSignUp} noValidate>
                <div className="login-field">
                  <label className="login-label" htmlFor="signup-name">Full Name</label>
                  <div className="login-input-wrap">
                    <User size={16} className="login-input-icon" />
                    <input
                      id="signup-name"
                      className="login-input"
                      type="text"
                      placeholder="John Doe"
                      value={displayName}
                      onChange={e => { setDisplayName(e.target.value); clearError(); }}
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label className="login-label" htmlFor="signup-email">Email</label>
                  <div className="login-input-wrap">
                    <Mail size={16} className="login-input-icon" />
                    <input
                      id="signup-email"
                      className="login-input"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => { setEmail(e.target.value); clearError(); }}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label className="login-label" htmlFor="signup-password">Password</label>
                  <div className="login-input-wrap">
                    <Lock size={16} className="login-input-icon" />
                    <input
                      id="signup-password"
                      className="login-input"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={e => { setPassword(e.target.value); clearError(); }}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="login-input-toggle"
                      onClick={() => setShowPass(v => !v)}
                      tabIndex={-1}
                      aria-label="Toggle password visibility"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="login-field">
                  <label className="login-label" htmlFor="signup-confirm">Confirm Password</label>
                  <div className="login-input-wrap">
                    <Lock size={16} className="login-input-icon" />
                    <input
                      id="signup-confirm"
                      className="login-input"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repeat password"
                      value={confirm}
                      onChange={e => { setConfirm(e.target.value); clearError(); }}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="login-input-toggle"
                      onClick={() => setShowConfirm(v => !v)}
                      tabIndex={-1}
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="login-terms-row">
                  <input
                    id="terms-check"
                    type="checkbox"
                    className="login-terms-check"
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                  />
                  <label htmlFor="terms-check" className="login-terms-text">
                    I agree to the <a href="#terms">Terms of Service</a> and{' '}
                    <a href="#privacy">Privacy Policy</a>
                  </label>
                </div>

                <button id="btn-signup" type="submit" className="login-submit" disabled={loading || googleLoading}>
                  {loading ? <span className="login-spinner" /> : null}
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>
            )}

            {/* ─── Divider ─── */}
            <div className="login-divider">
              <div className="login-divider-line" />
              <span className="login-divider-text">or continue with</span>
              <div className="login-divider-line" />
            </div>

            {/* ─── Social ─── */}
            <div className="login-social">
              <button
                id="btn-google"
                className="login-social-btn"
                onClick={handleGoogle}
                disabled={loading || googleLoading}
                type="button"
              >
                {googleLoading ? <span className="login-spinner" style={{ width: 18, height: 18 }} /> : <GoogleIcon />}
                {googleLoading ? 'Signing in…' : 'Continue with Google'}
              </button>
            </div>

            {/* ─── Footer ─── */}
            <div className="login-footer">
              By signing in you agree to ForaMetric's{' '}
              <a href="#terms">Terms</a> &amp; <a href="#privacy">Privacy Policy</a>.
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
