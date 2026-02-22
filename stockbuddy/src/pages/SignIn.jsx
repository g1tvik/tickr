import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { white, lightGray, gray, marbleDarkGray, marbleGold } from "../marblePalette";
import { fontHeading, fontBody } from "../fontPalette";
import { api } from "../services/api";
import GoogleOAuth from "../components/GoogleOAuth";
import './SignIn.css';

function SignIn({ setIsLoggedIn }) {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted, preventing default behavior');
    console.log('Form data:', { emailOrUsername, password });
    setIsLoading(true);
    setError("");

    try {
      console.log('Calling API...');
      const response = await api.login({ emailOrUsername, password });
      console.log('API response:', response);
      
      if (response.success) {
        localStorage.setItem('token', response.token);
        setIsLoggedIn(true);
        navigate('/dashboard');
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
    } catch (error) {
      console.error('Login error:', error);
      if (error.message?.includes('400')) {
        setError('Login failed. Please check that all fields are filled correctly.');
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError('Login failed. Please try again.');
      }
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
        name: "Demo User",
        username: "demo_user"
      });
      
      if (response.success) {
        localStorage.setItem('token', response.token);
        setIsLoggedIn(true);
        navigate('/dashboard');
      } else {
        // Try to login if user already exists
        const loginResponse = await api.login({
          emailOrUsername: "demo@stockbuddy.com",
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
              Email or Username
            </label>
            <input
              type="text"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              required
              className="form-input"
              placeholder="Enter your email or username"
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