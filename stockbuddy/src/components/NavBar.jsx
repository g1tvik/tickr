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

  // Check if we're on the Trade page
  const isOnTradePage = location.pathname === '/trade';

  useEffect(() => {
    const navbar = document.querySelector('.navbar-color');
    const body = document.body;
    const html = document.documentElement;
    
    if (navbar) {
      // Add a data attribute to track the current page
      navbar.setAttribute('data-current-page', isOnTradePage ? 'trade' : 'other');
      
      if (isOnTradePage) {
        // Set dark background for Trade page with higher priority
        navbar.style.setProperty('background-color', '#222222', 'important');
        navbar.style.setProperty('transition', 'background-color 0.3s ease', 'important');
        
        // Set scrollbar background to match Trade page
        body.style.setProperty('--scrollbar-track-bg', '#222222', 'important');
        body.style.setProperty('--scrollbar-thumb-bg', '#B0B0B0', 'important');
        body.style.setProperty('--scrollbar-thumb-hover-bg', '#E6C87A', 'important');
      } else {
        // Reset to default background for other pages
        navbar.style.removeProperty('background-color');
        navbar.style.setProperty('transition', 'background-color 0.3s ease', 'important');
        
        // Set scrollbar background to match other pages
        body.style.setProperty('--scrollbar-track-bg', '#F4F1E9', 'important');
        body.style.setProperty('--scrollbar-thumb-bg', '#B0B0B0', 'important');
        body.style.setProperty('--scrollbar-thumb-hover-bg', '#E6C87A', 'important');
      }
    }

    // Cleanup function to reset background when component unmounts
    return () => {
      if (navbar) {
        const currentPage = navbar.getAttribute('data-current-page');
        // Only reset if we're not on the trade page
        if (currentPage !== 'trade') {
          navbar.style.removeProperty('background-color');
          body.style.setProperty('--scrollbar-track-bg', '#F4F1E9', 'important');
        }
      }
    };
  }, [isOnTradePage]);

  // Additional effect to prevent Home page from overriding Trade page styling
  useEffect(() => {
    const navbar = document.querySelector('.navbar-color');
    const body = document.body;
    
    if (navbar && isOnTradePage) {
      // Set up an observer to prevent other scripts from changing the background
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const currentPage = navbar.getAttribute('data-current-page');
            if (currentPage === 'trade') {
              // Re-apply trade page styling if it gets overridden
              const currentBg = navbar.style.backgroundColor;
              if (currentBg !== 'rgb(34, 34, 34)' && currentBg !== '#222222') {
                navbar.style.setProperty('background-color', '#222222', 'important');
                body.style.setProperty('--scrollbar-track-bg', '#222222', 'important');
              }
            }
          }
        });
      });

      observer.observe(navbar, { attributes: true, attributeFilter: ['style'] });

      return () => {
        observer.disconnect();
      };
    }
  }, [isOnTradePage]);

  return (
    <nav 
      className="navbar navbar-expand-lg navbar-color px-3"
      style={{
        backgroundColor: isOnTradePage ? '#222222' : undefined,
        transition: 'background-color 0.3s ease'
      }}
    >
      <div className="navbar-left" style={{ display: 'flex', alignItems: 'center' }}>
        <Link className="navbar-brand" to="/">
          <img src="/logo.png" alt="Tickr Logo" style={{ height: '50px', width: 'auto', display: 'block' }} />
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
                  style={{ color: isOnTradePage ? '#F4F1E9' : undefined }}
                >
                  DASHBOARD
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className="nav-link" 
                  to="/trade"
                  style={{ color: isOnTradePage ? '#F4F1E9' : undefined }}
                >
                  TRADE
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className="nav-link" 
                  to="/learn"
                  style={{ color: isOnTradePage ? '#F4F1E9' : undefined }}
                >
                  LEARN
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className="nav-link" 
                  to="/discover"
                  style={{ color: isOnTradePage ? '#F4F1E9' : undefined }}
                >
                  DISCOVER
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  className="nav-link" 
                  to="/profile"
                  style={{ color: isOnTradePage ? '#F4F1E9' : undefined }}
                >
                  PROFILE
                </Link>
              </li>
              <li className="nav-item">
                <button className="btn btn-outline-light ms-2" onClick={handleSignOut}>SIGN OUT</button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link 
                  className="nav-link" 
                  to="/signin"
                  style={{ color: isOnTradePage ? '#F4F1E9' : undefined }}
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