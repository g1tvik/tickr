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
      <div className="signin-card">
        <div className="signin-header">
          <h1 className="signin-title">
            Create Account
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
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
              placeholder="Create a password"
              autoComplete="new-password"
              aria-describedby="password-rules"
            />
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
            Or
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
  );
};

export default SignUp;
