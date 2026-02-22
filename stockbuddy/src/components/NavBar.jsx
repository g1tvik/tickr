import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../services/api';
import './NavBar.css';

const WHITE = '#FFFFFF';

function NavBar({ isLoggedIn, setIsLoggedIn, navbarTheme = 'light' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

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
    
    // Set scrollbar background to match page theme

  useEffect(() => {
    const body = document.body;
    if (isOnTradePage) {
      body.style.setProperty('--scrollbar-track-bg', 'transparent', 'important');
      body.style.setProperty('--scrollbar-thumb-bg', '#6B7280', 'important');
      body.style.setProperty('--scrollbar-thumb-hover-bg', '#B69C60', 'important');
    } else {
      body.style.setProperty('--scrollbar-track-bg', 'transparent', 'important');
      body.style.setProperty('--scrollbar-thumb-bg', '#9CA3AF', 'important');
      body.style.setProperty('--scrollbar-thumb-hover-bg', '#B69C60', 'important');
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
            alt="Tickr" 
            style={{ 
              height: '50px', 
              transition: 'opacity 0.3s ease',
              width: 'auto', 
              display: 'block',
            }} 
          />
        </Link>
      </div>
      <div className="collapse navbar-collapse">
        <ul className="navbar-nav ms-auto">
          {isLoggedIn ? (
            <>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`} to="/dashboard">Dashboard</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/trade') ? 'active' : ''}`} to="/trade">Trade</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/learn') ? 'active' : ''}`} to="/learn">Learn</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/ai-coach') ? 'active' : ''}`} to="/ai-coach">AI Coach</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/shop') ? 'active' : ''}`} to="/shop">Shop</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/inventory') ? 'active' : ''}`} to="/inventory">Inventory</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/settings') ? 'active' : ''}`} to="/settings">Settings</Link>
              </li>
              <li className="nav-item">
                <button className="btn btn-tertiary" onClick={handleSignOut}>Sign out</button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/signin">Sign in</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default NavBar; 