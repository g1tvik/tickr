import React from 'react';
import './NavBar.css';

function NavBar() {
  return (
    <nav className="navbar transparent-navbar">
      <div className="navbar-section navbar-left">
        <a className="nav-link" href="#">Products</a>
        <a className="nav-link" href="#">Pricing</a>
        <a className="nav-link" href="#">Blog</a>
      </div>
      <div className="navbar-section navbar-center">
        <a className="navbar-brand" href="/">tickr</a>
      </div>
      <div className="navbar-section navbar-right">
        <a className="btn btn-outline-dark me-2" href="/signin">Sign In</a>
        <a className="btn btn-dark" href="/signup">Get Started</a>
      </div>
    </nav>
  );
}

export default NavBar; 