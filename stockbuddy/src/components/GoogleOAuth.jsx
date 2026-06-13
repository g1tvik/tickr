import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const GoogleOAuth = ({ setIsLoggedIn, onError }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[GoogleOAuth] component mounted');
      console.log('[GoogleOAuth] Client ID from env:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
    }
    
    // Load Google OAuth script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (import.meta.env.DEV) console.log('[GoogleOAuth] Google script loaded successfully');
      if (window.google) {
        if (import.meta.env.DEV) console.log('[GoogleOAuth] Google object available');

        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (import.meta.env.DEV) console.log('[GoogleOAuth] Using client ID:', clientId);

        if (!clientId || clientId === 'your_google_client_id_here') {
          if (import.meta.env.DEV) console.error('[GoogleOAuth] No valid Google Client ID found. Please set VITE_GOOGLE_CLIENT_ID in your .env file');
          onError('Google sign-in not configured. Please contact support.');
          return;
        }

        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (import.meta.env.DEV) console.log('[GoogleOAuth] Google GSI initialized successfully');

          const buttonElement = document.getElementById('google-signin-button');
          if (import.meta.env.DEV) console.log('[GoogleOAuth] Button element found:', !!buttonElement);

          if (buttonElement) {
            window.google.accounts.id.renderButton(
              buttonElement,
              {
                theme: 'outline',
                size: 'large',
                text: 'signin_with',
                shape: 'rectangular',
                width: '100%',
                height: '48px'
              }
            );
            if (import.meta.env.DEV) console.log('[GoogleOAuth] Google sign-in button rendered');
          } else {
            if (import.meta.env.DEV) console.error('[GoogleOAuth] Button element not found');
          }
        } catch (error) {
          if (import.meta.env.DEV) console.error('[GoogleOAuth] Error initializing Google GSI:', error);
          onError('Failed to initialize Google sign-in');
        }
      } else {
        if (import.meta.env.DEV) console.error('[GoogleOAuth] Google object not available after script load');
        onError('Google sign-in not available');
      }
    };

    script.onerror = () => {
      if (import.meta.env.DEV) console.error('[GoogleOAuth] Failed to load Google script');
      onError('Failed to load Google sign-in');
    };

    return () => {
      // Cleanup
      if (window.google && window.google.accounts) {
        window.google.accounts.id.disableAutoSelect();
      }
    };
  }, []);

  const handleCredentialResponse = async (response) => {
    if (import.meta.env.DEV) console.log('[GoogleOAuth] Google credential response received');
    try {
      const result = await api.googleLogin(response.credential);
      
      if (result.success) {
        localStorage.setItem('token', result.token);
        setIsLoggedIn(true);
        navigate('/dashboard');
      } else {
        onError(result.message || 'Google login failed');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('[GoogleOAuth] Google login error:', error);
      onError('Google login failed. Please try again.');
    }
  };

  return (
    <div id="google-signin-button" style={{ marginTop: '16px' }}>
      <div style={{ 
        padding: '12px', 
        textAlign: 'center', 
        color: '#666', 
        fontSize: '14px',
        border: '1px dashed #ccc',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        Loading Google sign-in...
      </div>
    </div>
  );
};

export default GoogleOAuth; 