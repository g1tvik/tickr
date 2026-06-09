import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useSEO, SEO_CONFIG } from "../lib/seo";
import GoogleOAuth from "../components/GoogleOAuth";
import './SignIn.css';

// Mirrors the backend password complexity rules (routes/auth.js):
// min 8 chars + at least one lowercase, uppercase, digit, and symbol.
const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p) => /[a-z]/.test(p), label: 'One lowercase letter' },
  { test: (p) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p) => /[0-9]/.test(p), label: 'One number' },
  { test: (p) => /[^a-zA-Z0-9]/.test(p), label: 'One symbol (e.g. ! ? @ #)' },
];

const isPasswordValid = (password) => PASSWORD_RULES.every((rule) => rule.test(password));

const SignUp = ({ setIsLoggedIn }) => {
  useSEO(SEO_CONFIG.signup);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side password validation matching the backend rules.
    if (!isPasswordValid(password)) {
      setError('Password must be at least 8 characters and include a lowercase letter, an uppercase letter, a number, and a symbol.');
      return;
    }

    const registrationData = {
      email,
      password,
      name: name || email.split('@')[0],
      username
    };
    setError("");
    setIsLoading(true);

    try {
      const response = await api.register(registrationData);

      if (response.success) {
        // Store the JWT token
        localStorage.setItem('token', response.token);

        // Update login state
        setIsLoggedIn(true);

        // Redirect to dashboard
        navigate("/dashboard");
      } else {
        // More user-friendly error messages
        if (response.message?.includes('already registered')) {
          setError('This email is already registered. Please try logging in instead, or use a different email address.');
        } else if (response.message?.includes('username')) {
          setError('Username is already taken. Please choose a different username.');
        } else if (response.message?.includes('required')) {
          setError('Please fill in all required fields.');
        } else if (response.message?.includes('Password')) {
          setError(response.message);
        } else if (response.message?.includes('invalid')) {
          setError('Please check your input and try again.');
        } else {
          setError(response.message || 'Registration failed. Please try again.');
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Signup error:', err);
      }
      if (err.message?.includes('400')) {
        setError('Registration failed. Please check that all fields are filled correctly.');
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
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
          <div className="signin-showcase-eyebrow">join free · no card required</div>
          <h2 className="signin-showcase-title">Start your<br />trading journey.</h2>
          <p className="signin-showcase-sub">
            Create your account and get instant access to virtual cash, guided
            lessons, and an AI coach — all in one place.
          </p>
          <ul className="signin-feature-list">
            <li className="signin-feature">
              <span className="signin-feature-icon" aria-hidden="true">✓</span>
              $100k in virtual cash, ready the moment you sign up
            </li>
            <li className="signin-feature">
              <span className="signin-feature-icon" aria-hidden="true">✓</span>
              Bite-sized lessons that turn into real trading skills
            </li>
            <li className="signin-feature">
              <span className="signin-feature-icon" aria-hidden="true">✓</span>
              Earn XP and coins, then climb the leaderboard
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
              Create account
            </h1>
            <p className="signin-subtitle">
              Join tickr and start your trading journey
            </p>
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="signin-form">
            <div className="form-group">
              <label className="form-label" htmlFor="signup-name">
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="Enter your full name"
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-username">
                Username
              </label>
              <input
                id="signup-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="form-input"
                placeholder="Choose a username (3-20 characters)"
                pattern="[a-zA-Z0-9_]{3,20}"
                title="Username must be 3-20 characters long and contain only letters, numbers, and underscores"
                autoComplete="username"
              />
              <small className="form-hint">
                Only letters, numbers, and underscores allowed
              </small>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-email">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
                placeholder="Enter your email"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-password">
                Password
              </label>
              <div className="password-wrapper">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input"
                  placeholder="Create a password"
                  autoComplete="new-password"
                  aria-describedby="password-rules"
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
              <ul id="password-rules" className="password-rules">
                {PASSWORD_RULES.map((rule) => {
                  const met = password.length > 0 && rule.test(password);
                  return (
                    <li
                      key={rule.label}
                      className={met ? 'password-rule password-rule--met' : 'password-rule'}
                    >
                      <span aria-hidden="true">{met ? '✓' : '•'}</span> {rule.label}
                    </li>
                  );
                })}
              </ul>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="signin-button"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="demo-section">
            <div className="demo-divider">
              or
            </div>

            <GoogleOAuth
              setIsLoggedIn={setIsLoggedIn}
              onError={setError}
            />
          </div>

          <div className="signin-footer">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/signin')}
              className="signin-link"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
