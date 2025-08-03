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
    
    if (navbar) {
      // Add a data attribute to track the current page
      navbar.setAttribute('data-current-page', isOnTradePage ? 'trade' : 'other');
      
      if (isOnTradePage) {
        // Use CSS classes instead of inline styles for seamless transitions
        navbar.classList.add('page-dark');
        navbar.classList.remove('page-light');
        
        // Set scrollbar background to match Trade page
        body.style.setProperty('--scrollbar-track-bg', '#222222', 'important');
        body.style.setProperty('--scrollbar-thumb-bg', '#B0B0B0', 'important');
        body.style.setProperty('--scrollbar-thumb-hover-bg', '#E6C87A', 'important');
      } else {
        // Use CSS classes for other pages
        navbar.classList.remove('page-dark');
        navbar.classList.add('page-light');
        
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
          navbar.classList.remove('page-dark');
          navbar.classList.add('page-light');
          body.style.setProperty('--scrollbar-track-bg', '#F4F1E9', 'important');
        }
      }
    };
  }, [isOnTradePage]);



  return (
    <nav 
      className="navbar navbar-expand-lg navbar-color px-3"
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
                  to="/settings"
                  style={{ color: isOnTradePage ? '#F4F1E9' : undefined }}
                >
                  SETTINGS
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