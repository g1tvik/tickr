import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../services/api';
import './NavBar.css';

const MARBLE_WHITE = '#F4F1E9';

function NavBar({ isLoggedIn, setIsLoggedIn, navbarTheme = 'light' }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication status on mount and route changes
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      if (isLoggedIn !== authenticated) {
        setIsLoggedIn(authenticated);
      }
    };
    
    checkAuth();
  }, [location.pathname, isLoggedIn, setIsLoggedIn]);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/');
  };

  const isOnTradePage = location.pathname === '/trade' || location.pathname === '/ai-coach';
  const isNavbarDark = navbarTheme === 'dark' || isOnTradePage;

  useEffect(() => {
    const body = document.body;
    
    // Set scrollbar background to match page theme
    if (isOnTradePage) {
      // Dark theme scrollbar for Trade and AI Coach pages
      body.style.setProperty('--scrollbar-track-bg', '#222222', 'important');
      body.style.setProperty('--scrollbar-thumb-bg', '#B0B0B0', 'important');
      body.style.setProperty('--scrollbar-thumb-hover-bg', '#E6C87A', 'important');
    } else {
      // Light theme scrollbar for all other pages
      body.style.setProperty('--scrollbar-track-bg', '#F4F1E9', 'important');
      body.style.setProperty('--scrollbar-thumb-bg', '#B0B0B0', 'important');
      body.style.setProperty('--scrollbar-thumb-hover-bg', '#E6C87A', 'important');
    }
  }, [isOnTradePage]);



  return (
    <nav 
      className="navbar navbar-expand-lg navbar-color px-3"
    >
      <div className="navbar-left" style={{ display: 'flex', alignItems: 'center' }}>
        <Link className="navbar-brand" to="/">
          <img 
            src={isNavbarDark ? "/marbleWhitelogo.png" : "/logo.png"} 
            alt="Tickr Logo" 
            style={{ 
              height: '50px', 
              width: 'auto', 
              display: 'block',
              transition: 'opacity 0.3s ease'
            }} 
          />
        </Link>
      </div>
      <div className="collapse navbar-collapse">
        <ul className="navbar-nav ms-auto">
          {isLoggedIn ? (
            <>
              <li className="nav-item">
                <Link 
                  className="nav-link" 
                  to="/dashboard"
                  style={{ color: isNavbarDark ? MARBLE_WHITE : '#2C2C2C', transition: 'color 0.35s ease' }}
                >
                  DASHBOARD
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className="nav-link" 
                  to="/trade"
                  style={{ color: isNavbarDark ? MARBLE_WHITE : '#2C2C2C', transition: 'color 0.35s ease' }}
                >
                  TRADE
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className="nav-link" 
                  to="/learn"
                  style={{ color: isNavbarDark ? MARBLE_WHITE : '#2C2C2C', transition: 'color 0.35s ease' }}
                >
                  LEARN
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className="nav-link" 
                  to="/ai-coach"
                  style={{ color: isNavbarDark ? MARBLE_WHITE : '#2C2C2C', transition: 'color 0.35s ease' }}
                >
                  AI COACH
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className="nav-link" 
                  to="/shop"
                  style={{ color: isNavbarDark ? MARBLE_WHITE : '#2C2C2C', transition: 'color 0.35s ease' }}
                >
                  SHOP
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className="nav-link" 
                  to="/inventory"
                  style={{ color: isNavbarDark ? MARBLE_WHITE : '#2C2C2C', transition: 'color 0.35s ease' }}
                >
                  INVENTORY
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className="nav-link" 
                  to="/settings"
                  style={{ color: isNavbarDark ? MARBLE_WHITE : '#2C2C2C', transition: 'color 0.35s ease' }}
                >
                  SETTINGS
                </Link>
              </li>
              <li className="nav-item">
                <button 
                  className="btn btn-outline-light ms-2" 
                  onClick={handleSignOut}
                  style={{
                    backgroundColor: isNavbarDark ? undefined : '#2C2C2C',
                    color: isNavbarDark ? undefined : '#F4F1E9',
                    borderColor: isNavbarDark ? undefined : '#2C2C2C',
                    transition: 'color 0.35s ease, border-color 0.35s ease, background-color 0.35s ease'
                  }}
                >
                  SIGN OUT
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link 
                  className="nav-link" 
                  to="/signin"
                  style={{ color: isNavbarDark ? MARBLE_WHITE : '#2C2C2C', transition: 'color 0.35s ease' }}
                >
                  Sign In
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default NavBar; 