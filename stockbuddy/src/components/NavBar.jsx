import React from "react";
import { Link } from "react-router-dom"; // or "next/link" if using Next.js

const NavBar = () => (
  <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3">
    <div className="container-fluid">
      <Link className="navbar-brand fw-bold" to="/">StockBuddy</Link>
      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav ms-auto">
          <li className="nav-item">
            <Link className="nav-link" to="/dashboard">Dashboard</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/learn">Learn</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/trade">Trade</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/profile">Profile</Link>
          </li>
        </ul>
      </div>
    </div>
  </nav>
);

export default NavBar; 