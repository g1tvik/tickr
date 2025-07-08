import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  color: var(--accent-green);
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
    color: #00c805;
    box-shadow: 0 2px 8px 0 #0002;
  }
  &.active {
    background: linear-gradient(90deg, #00c805 0%, #00e805 100%);
    color: #fff;
    box-shadow: 0 4px 16px 0 #00c80544;
  }
`;

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

const NavBar = ({ onLogout }) => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.body.scrollTop;
      const scrollHeight = document.body.scrollHeight;
      const clientHeight = document.body.clientHeight;
      const maxScroll = scrollHeight - clientHeight;
      const prog = maxScroll > 0 ? clamp(scrollTop / maxScroll, 0, 1) : 0;
      setProgress(prog);
    };
    document.body.addEventListener('scroll', handleScroll);
    handleScroll(); // set initial
    return () => document.body.removeEventListener('scroll', handleScroll);
  }, []);

  // Staggered fade: each item fades out a bit later as you scroll down
  const total = navItems.length + 1; // logo + links
  const getItemOpacity = idx => {
    // idx: 0 = logo, 1 = Dashboard, 2 = Learn, ...
    if (idx === 0) {
      // Logo: visible for first 20% of scroll (disappears first, appears last)
      const fadeStart = 0;
      const fadeEnd = 0.2;
      return progress < fadeEnd ? 1 : 0;
    }
    if (idx === 1) {
      // Dashboard: visible for first 40% of scroll
      const fadeStart = 0;
      const fadeEnd = 0.4;
      return progress < fadeEnd ? 1 : 0;
    }
    const fadeStart = idx / (total + 1);
    const fadeEnd = (idx + 1) / (total + 1);
    return progress < fadeEnd ? 1 : 0;
  };

  return (
    <Nav className="stockbuddy-navbar">
      <Logo opacity={getItemOpacity(0)}>
        <span role="img" aria-label="StockBuddy">📈</span> StockBuddy
      </Logo>
      <CenterNav>
        {navItems.map((item, idx) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={location.pathname === item.to ? 'active' : ''}
            opacity={getItemOpacity(idx + 1)}
          >
            {item.label}
          </NavLink>
        ))}
      </CenterNav>
      <RightNav>
        <LogoutButton 
          onClick={onLogout}
          opacity={getItemOpacity(0)}
        >
          Logout
        </LogoutButton>
      </RightNav>
    </Nav>
  );
};

export default NavBar; 