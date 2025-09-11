import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './NavBar.css';

function NavBar({ isLoggedIn, setIsLoggedIn }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/');
  };

  // Check if we're on the Trade page or AI Coach page (dark theme)
  // Updated to fix isOnLightPage error
  const isOnTradePage = location.pathname === '/trade' || location.pathname === '/ai-coach';

  useEffect(() => {
    const navbar = document.querySelector('.navbar-color');
    const body = document.body;
    
    if (navbar) {
      if (isOnTradePage) {
        // Dark theme for Trade and AI Coach pages
        navbar.classList.add('page-dark');
        navbar.classList.remove('page-light');
        
        // Set scrollbar background to match dark pages
        body.style.setProperty('--scrollbar-track-bg', '#222222', 'important');
        body.style.setProperty('--scrollbar-thumb-bg', '#B0B0B0', 'important');
        body.style.setProperty('--scrollbar-thumb-hover-bg', '#E6C87A', 'important');
      } else {
        // Light theme for all other pages
        navbar.classList.remove('page-dark');
        navbar.classList.add('page-light');
        
        // Set scrollbar background to match light pages
        body.style.setProperty('--scrollbar-track-bg', '#F4F1E9', 'important');
        body.style.setProperty('--scrollbar-thumb-bg', '#B0B0B0', 'important');
        body.style.setProperty('--scrollbar-thumb-hover-bg', '#E6C87A', 'important');
      }
    }
  }, [isOnTradePage]);



  return (
    <nav 
      className="navbar navbar-expand-lg navbar-color px-3"
    >
      <div className="navbar-left" style={{ display: 'flex', alignItems: 'center' }}>
        <Link className="navbar-brand" to="/">
          <img 
            src={isOnTradePage ? "/marbleWhitelogo.png" : "/logo.png"} 
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
                  style={{ color: isOnTradePage ? '#F4F1E9' : '#2C2C2C' }}
                >
                  DASHBOARD
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className="nav-link" 
                  to="/trade"
                  style={{ color: isOnTradePage ? '#F4F1E9' : '#2C2C2C' }}
                >
                  TRADE
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className="nav-link" 
                  to="/learn"
                  style={{ color: isOnTradePage ? '#F4F1E9' : '#2C2C2C' }}
                >
                  LEARN
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className="nav-link" 
                  to="/ai-coach"
                  style={{ color: isOnTradePage ? '#F4F1E9' : '#2C2C2C' }}
                >
                  AI COACH
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className="nav-link" 
                  to="/settings"
                  style={{ color: isOnTradePage ? '#F4F1E9' : '#2C2C2C' }}
                >
                  SETTINGS
                </Link>
              </li>
              <li className="nav-item">
                <button 
                  className="btn btn-outline-light ms-2" 
                  onClick={handleSignOut}
                  style={{
                    backgroundColor: isOnTradePage ? undefined : '#2C2C2C',
                    color: isOnTradePage ? undefined : '#F4F1E9',
                    borderColor: isOnTradePage ? undefined : '#2C2C2C'
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
                  style={{ color: isOnTradePage ? '#F4F1E9' : '#2C2C2C' }}
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