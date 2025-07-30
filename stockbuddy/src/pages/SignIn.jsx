import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from "../marblePalette";
import { fontHeading, fontBody } from "../fontPalette";
import { api } from "../services/api";
import './SignIn.css';

function SignIn({ setIsLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await api.login({ email, password });
      
      if (response.success) {
        localStorage.setItem('token', response.token);
        setIsLoggedIn(true);
        navigate('/dashboard');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Create a demo user or use existing one
      const response = await api.register({
        email: "demo@stockbuddy.com",
        password: "demo123",
        name: "Demo User"
      });
      
      if (response.success) {
        localStorage.setItem('token', response.token);
        setIsLoggedIn(true);
        navigate('/dashboard');
      } else {
        // Try to login if user already exists
        const loginResponse = await api.login({
          email: "demo@stockbuddy.com",
          password: "demo123"
        });
        
        if (loginResponse.success) {
          localStorage.setItem('token', loginResponse.token);
          setIsLoggedIn(true);
          navigate('/dashboard');
        } else {
          setError('Demo login failed');
        }
      }
    } catch (error) {
      console.error('Demo login error:', error);
      setError('Demo login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        <div className="signin-header">
          <h1 className="signin-title">
            Welcome Back
          </h1>
          <p className="signin-subtitle">
            Sign in to access your StockBuddy account
          </p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="signin-form">
          <div className="form-group">
            <label className="form-label">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
              placeholder="Enter your password"
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
          <div className="demo-divider">
            Or
          </div>
          
          <button
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="demo-button"
          >
            {isLoading ? 'Loading...' : 'Try Demo Account'}
          </button>
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