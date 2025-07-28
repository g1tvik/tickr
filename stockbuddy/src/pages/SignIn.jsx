import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from "../marblePalette";
import { fontHeading, fontBody } from "../fontPalette";
import { api } from "../services/api";

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
    <div style={{
      minHeight: '100vh',
      backgroundColor: marbleWhite,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: fontBody
    }}>
      <div style={{
        backgroundColor: marbleLightGray,
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: marbleDarkGray,
            marginBottom: '8px',
            fontFamily: fontHeading
          }}>
            Welcome Back
          </h1>
          <p style={{
            color: marbleGray,
            fontSize: '16px'
          }}>
            Sign in to access your StockBuddy account
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: marbleDarkGray,
              fontWeight: '500'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid transparent',
                fontSize: '16px',
                backgroundColor: marbleWhite,
                color: marbleDarkGray
              }}
              placeholder="Enter your email"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: marbleDarkGray,
              fontWeight: '500'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid transparent',
                fontSize: '16px',
                backgroundColor: marbleWhite,
                color: marbleDarkGray
              }}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: isLoading ? marbleGray : marbleGold,
              color: marbleDarkGray,
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <div style={{
            color: marbleGray,
            fontSize: '14px',
            marginBottom: '16px'
          }}>
            Or
          </div>
          
          <button
            onClick={handleDemoLogin}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '12px',
              border: '2px solid marbleGold',
              backgroundColor: 'transparent',
              color: marbleDarkGray,
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? 'Loading...' : 'Try Demo Account'}
          </button>
        </div>

        <div style={{
          textAlign: 'center',
          color: marbleGray,
          fontSize: '14px'
        }}>
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/signup')}
            style={{
              background: 'none',
              border: 'none',
              color: marbleGold,
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignIn; 