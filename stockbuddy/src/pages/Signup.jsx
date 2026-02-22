import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { white, gray, marbleDarkGray, marbleGold } from "../marblePalette";
import { fontHeading, fontBody } from "../fontPalette";
import GoogleOAuth from "../components/GoogleOAuth";
import './SignIn.css';

const SignUp = ({ setIsLoggedIn }) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted, preventing default behavior');
    const registrationData = { 
      email, 
      password, 
      name: name || email.split('@')[0],
      username 
    };
    console.log('Form data:', registrationData);
    setError("");
    setIsLoading(true);

    try {
      console.log('Calling API...');
      const response = await api.register(registrationData);
      console.log('API response:', response);
      
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
        } else if (response.message?.includes('invalid')) {
          setError('Please check your input and try again.');
        } else {
          setError(response.message || 'Registration failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('Signup error:', err);
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
            Join StockBuddy and start your trading journey
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
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="form-input"
              placeholder="Choose a username (3-20 characters)"
              pattern="[a-zA-Z0-9_]{3,20}"
              title="Username must be 3-20 characters long and contain only letters, numbers, and underscores"
            />
            <small style={{ color: gray, fontSize: '12px', marginTop: '4px' }}>
              Only letters, numbers, and underscores allowed
            </small>
          </div>

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
              placeholder="Create a password"
              minLength="6"
            />
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