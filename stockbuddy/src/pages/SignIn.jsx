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
      <div className="signin-card">
        <div className="signin-header">
          <h1 className="signin-title">
            Welcome Back
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
            <input
              id="signin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
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
            Or
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
  );
}

export default SignIn;
