import React from "react";

const SignUp = () => (
  <div className="container py-5">
    <div className="row justify-content-center">
      <div className="col-12 col-md-6 col-lg-4">
        <div className="card p-4 shadow">
          <h2 className="mb-4 text-center">Sign Up</h2>
          <form>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email address</label>
              <input type="email" className="form-control" id="email" />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input type="password" className="form-control" id="password" />
            </div>
            <button type="submit" className="btn btn-dark w-100 fw-bold">Sign Up</button>
          </form>
        </div>
      </div>
    </div>
  </div>
);

export default SignUp; 