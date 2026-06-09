import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../services/api';
import './NavBar.css';

// Primary destinations shown to a signed-in user. Reused by the desktop
// link bar and the mobile menu so the two never drift apart.
const PRIMARY_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/trade', label: 'Trade' },
  { to: '/learn', label: 'Learn' },
  { to: '/ai-coach', label: 'AI Coach' },
];

// Secondary destinations (account area) — shown in the "⋯" desktop menu and
// the mobile menu.
const SECONDARY_LINKS = [
  { to: '/profile', label: 'Profile' },
  { to: '/shop', label: 'Shop' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/settings', label: 'Settings' },
];

function NavBar({ isLoggedIn, setIsLoggedIn, navbarTheme = 'light' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);     // desktop "⋯" menu
  const [mobileOpen, setMobileOpen] = useState(false); // small-screen panel
  const menuRef = useRef(null);
  const mobileRef = useRef(null);
  const hamburgerRef = useRef(null);

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
      if (
        mobileRef.current &&
        !mobileRef.current.contains(e.target) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(e.target)
      ) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close both menus on route change
  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  // Close menus on Escape, and return focus to the hamburger when the mobile
  // panel was the thing open.
  useEffect(() => {
    if (!menuOpen && !mobileOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        if (mobileOpen) {
          setMobileOpen(false);
          hamburgerRef.current?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen, mobileOpen]);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setMobileOpen(false);
    navigate('/');
  };

  const closeMobile = () => setMobileOpen(false);

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

  const themeClass =
    navbarTheme === 'light'       ? 'navbar-color--light' :
    navbarTheme === 'transparent' ? 'navbar-color--transparent' :
                                     'navbar-color--dark';

  // Light theme uses the dark logo so it reads on cream
  const logoSrc = navbarTheme === 'light' ? '/logo.png' : '/marbleWhitelogo.png';

  return (
    <nav className={`navbar navbar-expand-lg navbar-color ${themeClass} px-3`}>
      {/* Logo */}
      <div className="navbar-left">
        <Link className="navbar-brand" to="/" onClick={closeMobile}>
          <img
            src={logoSrc}
            alt="tickr — home"
            style={{ height: '44px', width: 'auto', display: 'block', transition: 'opacity 0.3s ease' }}
          />
        </Link>
      </div>

      {/* Right group */}
      <div className="navbar-right-group">
        {isLoggedIn ? (
          <>
            {/* Primary navigation links (desktop) */}
            <ul className="navbar-nav navbar-primary-links">
              {PRIMARY_LINKS.map(({ to, label }) => (
                <li className="nav-item" key={to}>
                  <Link
                    className={`nav-link ${isActive(to) ? 'active' : ''}`}
                    to={to}
                    aria-current={isActive(to) ? 'page' : undefined}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* ⋯ more menu (desktop) */}
            <div className="navbar-more-menu" ref={menuRef}>
              <button
                className={`navbar-more-btn ${menuOpen ? 'open' : ''}`}
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Account menu"
                aria-haspopup="true"
                aria-expanded={menuOpen}
              >
                <span className="navbar-dot" />
                <span className="navbar-dot" />
                <span className="navbar-dot" />
              </button>

              {menuOpen && (
                <div className="navbar-dropdown" role="menu">
                  {SECONDARY_LINKS.map(({ to, label }) => (
                    <Link className="navbar-dropdown-item" to={to} role="menuitem" key={to}>
                      {label}
                    </Link>
                  ))}
                  <div className="navbar-dropdown-divider" />
                  <button
                    className="navbar-dropdown-item navbar-dropdown-signout"
                    onClick={handleSignOut}
                    role="menuitem"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <ul className="navbar-nav navbar-primary-links">
            <li className="nav-item">
              <Link className="nav-link" to="/signin">
                Sign in
              </Link>
            </li>
          </ul>
        )}

        {/* Hamburger (mobile only) */}
        <button
          ref={hamburgerRef}
          type="button"
          className={`navbar-hamburger ${mobileOpen ? 'open' : ''}`}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-haspopup="true"
          aria-expanded={mobileOpen}
          aria-controls="navbar-mobile-menu"
        >
          <span className="navbar-hamburger-bar" />
          <span className="navbar-hamburger-bar" />
          <span className="navbar-hamburger-bar" />
        </button>
      </div>

      {/* Mobile menu panel */}
      <div
        id="navbar-mobile-menu"
        ref={mobileRef}
        className={`navbar-mobile-panel ${mobileOpen ? 'open' : ''}`}
        hidden={!mobileOpen}
      >
        {isLoggedIn ? (
          <>
            <div className="navbar-mobile-section-label" aria-hidden="true">Menu</div>
            <ul className="navbar-mobile-list">
              {PRIMARY_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    className={`navbar-mobile-link ${isActive(to) ? 'active' : ''}`}
                    to={to}
                    onClick={closeMobile}
                    aria-current={isActive(to) ? 'page' : undefined}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="navbar-mobile-divider" />

            <div className="navbar-mobile-section-label" aria-hidden="true">Account</div>
            <ul className="navbar-mobile-list">
              {SECONDARY_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    className={`navbar-mobile-link ${isActive(to) ? 'active' : ''}`}
                    to={to}
                    onClick={closeMobile}
                    aria-current={isActive(to) ? 'page' : undefined}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="navbar-mobile-divider" />

            <button
              type="button"
              className="navbar-mobile-link navbar-mobile-signout"
              onClick={handleSignOut}
            >
              Sign out
            </button>
          </>
        ) : (
          <ul className="navbar-mobile-list">
            <li>
              <Link className="navbar-mobile-link" to="/signin" onClick={closeMobile}>
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
