import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";

const SignUp = ({ setIsLoggedIn }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await api.register({ email, password, name: email.split('@')[0] });
      
      if (response.success) {
        // Registration successful, redirect to sign in
        navigate("/signin");
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  // Google OAuth temporarily disabled

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card p-4 shadow bg-dark text-light">
            <h2 className="mb-4 text-center">Sign Up</h2>
            
            {/* Google OAuth temporarily disabled */}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email address</label>
                <input type="email" className="form-control" id="email"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">Password</label>
                <input type="password" className="form-control" id="password"
                  value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              {error && <div className="alert alert-danger py-2">{error}</div>}
              <button type="submit" className="btn btn-light w-100 fw-bold mb-3">Sign Up</button>
              <div className="text-center">
                <small className="text-muted">
                  Already have an account? <Link to="/signin" className="text-light">Sign in</Link>
                </small>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp; 