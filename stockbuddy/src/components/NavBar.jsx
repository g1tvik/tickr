import React from 'react';
import './NavBar.css';

function NavBar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3">
      <a className="navbar-brand" href="/">tickr</a>
      <div className="collapse navbar-collapse">
        <ul className="navbar-nav ms-auto">
          {isLoggedIn ? (
            <>
              <li className="nav-item"><a className="nav-link" href="/dashboard">Dashboard</a></li>
              <li className="nav-item"><a className="nav-link" href="/trade">Trade</a></li>
              <li className="nav-item"><a className="nav-link" href="/learn">Learn</a></li>
              <li className="nav-item"><a className="nav-link" href="/profile">Profile</a></li>
              <li className="nav-item">
                <button className="btn btn-outline-light ms-2" onClick={handleSignOut}>Sign Out</button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item"><a className="nav-link" href="/signin">Sign In</a></li>
              {/* Sign Up removed */}
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default NavBar; 