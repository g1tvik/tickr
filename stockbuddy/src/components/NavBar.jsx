import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../services/api';
import './NavBar.css';

function NavBar({ isLoggedIn, setIsLoggedIn, navbarTheme = 'light' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isActive = (path) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      if (isLoggedIn !== authenticated) setIsLoggedIn(authenticated);
    };
    checkAuth();
  }, [location.pathname, isLoggedIn, setIsLoggedIn]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close dropdown on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/');
  };

  const isOnTradePage =
    location.pathname === '/trade' || location.pathname === '/ai-coach';

  useEffect(() => {
    const body = document.body;
    body.style.setProperty('--scrollbar-track-bg', 'transparent', 'important');
    body.style.setProperty(
      '--scrollbar-thumb-bg',
      isOnTradePage ? '#6B7280' : '#9CA3AF',
      'important'
    );
    body.style.setProperty('--scrollbar-thumb-hover-bg', '#B69C60', 'important');
  }, [isOnTradePage]);

  return (
    <nav className="navbar navbar-expand-lg navbar-color px-3">
      {/* Logo */}
      <div className="navbar-left">
        <Link className="navbar-brand" to="/">
          <img
            src="/marbleWhitelogo.png"
            alt="tickr"
            style={{ height: '44px', width: 'auto', display: 'block' }}
          />
        </Link>
      </div>

      {/* Right group */}
      <div className="navbar-right-group">
        {isLoggedIn ? (
          <>
            {/* Primary navigation links */}
            <ul className="navbar-nav navbar-primary-links">
              <li className="nav-item">
                <Link
                  className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                  to="/dashboard"
                >
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link ${isActive('/trade') ? 'active' : ''}`}
                  to="/trade"
                >
                  Trade
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link ${isActive('/learn') ? 'active' : ''}`}
                  to="/learn"
                >
                  Learn
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link ${isActive('/ai-coach') ? 'active' : ''}`}
                  to="/ai-coach"
                >
                  AI Coach
                </Link>
              </li>
            </ul>

            {/* ⋯ more menu */}
            <div className="navbar-more-menu" ref={menuRef}>
              <button
                className={`navbar-more-btn ${menuOpen ? 'open' : ''}`}
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="More options"
              >
                <span className="navbar-dot" />
                <span className="navbar-dot" />
                <span className="navbar-dot" />
              </button>

              {menuOpen && (
                <div className="navbar-dropdown">
                  <Link className="navbar-dropdown-item" to="/profile">
                    Profile
                  </Link>
                  <Link className="navbar-dropdown-item" to="/shop">
                    Shop
                  </Link>
                  <Link className="navbar-dropdown-item" to="/inventory">
                    Inventory
                  </Link>
                  <Link className="navbar-dropdown-item" to="/settings">
                    Settings
                  </Link>
                  <div className="navbar-dropdown-divider" />
                  <button
                    className="navbar-dropdown-item navbar-dropdown-signout"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="nav-link" to="/signin">
                Sign in
              </Link>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
}

export default NavBar;
