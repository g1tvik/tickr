import React from "react";
import { Link } from "react-router-dom";

const NavBar = () => (
  <nav className="navbar navbar-dark bg-dark px-3">
    <div className="container-fluid">
      <Link className="navbar-brand fw-bold" to="/">tickr</Link>
      <div className="d-flex">
        <Link to="/signin" className="btn btn-light fw-bold">Sign In</Link>
      </div>
    </div>
  </nav>
);

export default NavBar; 