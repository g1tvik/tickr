import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/learn', label: 'Learn' },
  { to: '/trade', label: 'Trade' },
  { to: '/profile', label: 'Profile' },
];

const Nav = styled.nav`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  width: 100vw;
`;

const fadeCss = css`
  pointer-events: ${props => (props.opacity > 0.05 ? 'auto' : 'none')};
  transition: opacity 0.4s cubic-bezier(0.4,0,0.2,1),
    pointer-events 0.4s cubic-bezier(0.4,0,0.2,1);
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent-green, #FFF8E7);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 0;
  opacity: ${props => props.opacity};
  transition: opacity 0.4s cubic-bezier(0.4,0,0.2,1);
`;

const CenterNav = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2.5rem;
  flex: 1 1 0;
`;

const RightNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 2rem;
`;

const LogoutButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-muted, #b0b3b8);
  padding: 0.6rem 1.2rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
  opacity: ${props => props.opacity};
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: var(--text-main, #f5f6fa);
    transform: translateY(-1px);
  }
`;

const NavLink = styled(Link)`
  font-weight: 500;
  padding: 0.8rem 2.5rem;
  border-radius: 2.5rem;
  background: #fff;
  color: #181a1b;
  font-size: 1.15rem;
  text-decoration: none;
  margin: 0 1rem;
  box-shadow: 0 1px 4px 0 #0001;
  border: none;
  min-width: 130px;
  text-align: center;
  display: inline-block;
  opacity: ${props => props.opacity};
  transition: background 0.18s, color 0.18s, box-shadow 0.18s, opacity 0.4s cubic-bezier(0.4,0,0.2,1), pointer-events 0.4s cubic-bezier(0.4,0,0.2,1);
  pointer-events: ${props => (props.opacity > 0.05 ? 'auto' : 'none')};
  &:hover {
    background: #f5f6fa;
    color: #FFF8E7;
    box-shadow: 0 2px 8px 0 #0002;
  }
  &.active {
    background: linear-gradient(90deg, #FFF8E7 0%, #FFF8E7 100%);
    color: #fff;
    box-shadow: 0 4px 16px 0 #FFF8E744;
  }
`;

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

const NavBarWrapper = styled.nav`
  width: 100vw;
  height: 4.5rem;
  background: rgba(30, 32, 34);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2.5rem;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 300;
  box-shadow: 0 2px 16px 0 #0002;
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 2.5rem;
`;

const AuthButton = styled.button`
  background: #FFF8E7;
  color: #181a1b;
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1.3rem;
  font-size: 1.08rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  margin-left: 2rem;
  &:hover {
    background: #FFF8E7;
    color: #0a0a0a;
  }
`;

const NavBar = ({ onLogout, isLoggedIn }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleAuthClick = () => {
    if (isLoggedIn) {
      onLogout();
    } else {
      navigate('/login');
    }
  };

  const handleNavClick = (path) => {
    navigate(path);
  };

  return (
    <NavBarWrapper>
      <Link to="/" style={{ color: '#FFF8E7', fontWeight: 900, fontSize: '1.5rem', textDecoration: 'none', letterSpacing: '0.03em' }}>
        tickr
      </Link>
      <NavLinks>
        {isLoggedIn && (
          <>
            <button 
              onClick={() => handleNavClick('/dashboard')} 
              style={{ 
                color: location.pathname === '/dashboard' ? '#FFF8E7' : '#fff', 
                fontWeight: 600, 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Dashboard
            </button>
            <button 
              onClick={() => handleNavClick('/learn')} 
              style={{ 
                color: location.pathname === '/learn' ? '#FFF8E7' : '#fff', 
                fontWeight: 600, 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Learn
            </button>
            <button 
              onClick={() => handleNavClick('/trade')} 
              style={{ 
                color: location.pathname === '/trade' ? '#FFF8E7' : '#fff', 
                fontWeight: 600, 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Trade
            </button>
            <button 
              onClick={() => handleNavClick('/profile')} 
              style={{ 
                color: location.pathname === '/profile' ? '#FFF8E7' : '#fff', 
                fontWeight: 600, 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Profile
            </button>
          </>
        )}
        <AuthButton onClick={handleAuthClick}>
          {isLoggedIn ? 'Logout' : 'Login'}
        </AuthButton>
      </NavLinks>
    </NavBarWrapper>
  );
};

export default NavBar; 