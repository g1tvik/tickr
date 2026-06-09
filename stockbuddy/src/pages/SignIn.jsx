import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../services/api";
import { useSEO, SEO_CONFIG } from "../lib/seo";
import GoogleOAuth from "../components/GoogleOAuth";
import './SignIn.css';

// Demo account: email is pre-fillable, but no real password ships in client code.
const DEMO_EMAIL = "demo@tickr.app";

function SignIn({ setIsLoggedIn }) {
  useSEO(SEO_CONFIG.signin);

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Where to send the user after a successful login (from Protected's ?next=)
  const getNextPath = () => {
    const next = new URLSearchParams(location.search).get('next');
    // Only allow internal paths to avoid open-redirect issues.
    if (next && next.startsWith('/') && !next.startsWith('//')) {
      return next;
    }
    return '/dashboard';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await api.login({ emailOrUsername, password });

      if (response.success) {
        localStorage.setItem('token', response.token);
        setIsLoggedIn(true);
        navigate(getNextPath());
      } else {
        // More user-friendly error messages
        if (response.message?.includes('Invalid credentials')) {
          setError('Invalid email/username or password. Please check your credentials and try again.');
        } else if (response.message?.includes('not found')) {
          setError('No account found with this email/username. Please sign up first.');
        } else if (response.message?.includes('required')) {
          setError('Please enter both email/username and password.');
        } else {
          setError(response.message || 'Login failed. Please try again.');
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Login error:', err);
      }
      if (err.message?.includes('400')) {
        setError('Login failed. Please check that all fields are filled correctly.');
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Pre-fill the demo email and let the user proceed with their own demo password.
  // No real credentials are embedded in the client bundle.
  const handleTryDemo = () => {
    setError("");
    setEmailOrUsername(DEMO_EMAIL);
    setPassword("");
  };

  return (
    <div className="signin-container">
      {/* Branded showcase panel (hidden on small screens) */}
      <aside className="signin-showcase">
        <div className="signin-brand">
          <img src="/marbleWhitelogo.png" alt="tickr" />
          <button type="button" className="signin-back" onClick={() => navigate('/')}>
            ← Home
          </button>
        </div>

        <div className="signin-showcase-body">
          <div className="signin-showcase-eyebrow">paper trading, for real learning</div>
          <h2 className="signin-showcase-title">Trade. Learn.<br />Level up.</h2>
          <p className="signin-showcase-sub">
            Practice the market risk-free with virtual cash, get an AI coach in
            your corner, and climb the leaderboard as you go.
          </p>
          <ul className="signin-feature-list">
            <li className="signin-feature">
              <span className="signin-feature-icon" aria-hidden="true">✓</span>
              $100k in virtual cash to practice trading risk-free
            </li>
            <li className="signin-feature">
              <span className="signin-feature-icon" aria-hidden="true">✓</span>
              An AI coach that explains every market move
            </li>
            <li className="signin-feature">
              <span className="signin-feature-icon" aria-hidden="true">✓</span>
              Lessons, XP, and a live community leaderboard
            </li>
          </ul>
        </div>

        <div className="signin-showcase-foot">
          tickr is an educational paper-trading platform. No real money is at risk.
        </div>
      </aside>

      {/* Form panel */}
      <div className="signin-panel">
        <div className="signin-card">
          <div className="signin-card-logo">
            <img src="/marbleWhitelogo.png" alt="tickr" />
          </div>

          <div className="signin-header">
            <h1 className="signin-title">
              Welcome back
            </h1>
            <p className="signin-subtitle">
              Sign in to access your tickr account
            </p>
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="signin-form">
            <div className="form-group">
              <label className="form-label" htmlFor="signin-identifier">
                Email or Username
              </label>
              <input
                id="signin-identifier"
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required
                className="form-input"
                placeholder="Enter your email or username"
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signin-password">
                Password
              </label>
              <div className="password-wrapper">
                <input
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="signin-button"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="demo-section">
            <button
              type="button"
              onClick={handleTryDemo}
              className="demo-button"
              disabled={isLoading}
            >
              Try demo account
            </button>

            <div className="demo-divider">
              or
            </div>

            <GoogleOAuth
              setIsLoggedIn={setIsLoggedIn}
              onError={setError}
            />
          </div>

          <div className="signin-footer">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="signin-link"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
