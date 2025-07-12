import React from "react";
import { Link } from "react-router-dom";
import Typewriter from "../components/Typewriter";
import StockTicker from "../components/StockTicker";
import FadeInSection from "../components/FadeInSection";
import CascadeText from "../components/CascadeText";

function Home({ isLoggedIn }) {
  return (
    <div className="container pb-5">
      {/* HERO SECTION */}
      <div className="d-flex flex-column align-items-center justify-content-center pt-cum">
        <h1 className="fw-bold text-center mb-3 hero-title">
          <Typewriter 
            text="Invest smarter. Learn faster." 
            speed={100}
            className="fw-bold"
          />
        </h1>
        <StockTicker />
        <div className="d-flex gap-3 mt-4">
          <Link 
            to={isLoggedIn ? "/dashboard" : "/signup"}
            className="btn btn-light fw-bold px-4 py-2 shadow"
          >
            Get Started Free
          </Link>
          <Link
            to={isLoggedIn ? "/dashboard" : "/signin"}
            className="btn btn-outline-light"
          >
            Learn More
          </Link>
        </div>
      </div>

      {/* SCROLL ANIMATED SECTIONS - now below hero */}
      <div className="mt-5">
        <FadeInSection>
          <div className="row align-items-center mb-5">
            <div className="col-md-6">
              <img src="https://placehold.co/500x300" alt="Placeholder 1" className="img-fluid rounded shadow" />
            </div>
            <div className="col-md-6">
              <CascadeText
                lines={[
                  <h2 className="fw-bold mb-3">Track Your Portfolio</h2>,
                  <p className="lead mb-1 text-muted-light">Monitor your investments in real time with beautiful charts and analytics.</p>,
                  <p className="lead mb-1">See your gains, losses, and trends at a glance.</p>,
                  <p className="lead mb-1">Stay informed with instant portfolio updates.</p>
                ]}
              />
            </div>
          </div>
        </FadeInSection>
        <FadeInSection delay={150}>
          <div className="row align-items-center flex-md-row-reverse mb-5">
            <div className="col-md-6">
              <img src="https://placehold.co/500x300" alt="Placeholder 2" className="img-fluid rounded shadow" />
            </div>
            <div className="col-md-6">
              <CascadeText
                lines={[
                  <h2 className="fw-bold mb-3">Learn With Interactive Lessons</h2>,
                  <p className="lead mb-1 text-muted-light">Boost your investing knowledge with hands-on, gamified learning modules.</p>,
                  <p className="lead mb-1">Quizzes and challenges keep you engaged.</p>,
                  <p className="lead mb-1">Track your progress and earn badges as you learn.</p>
                ]}
              />
            </div>
          </div>
        </FadeInSection>
        <FadeInSection delay={300}>
          <div className="row align-items-center mb-5">
            <div className="col-md-6">
              <img src="https://placehold.co/500x300" alt="Placeholder 3" className="img-fluid rounded shadow" />
            </div>
            <div className="col-md-6">
              <CascadeText
                lines={[
                  <h2 className="fw-bold mb-3">Simulate Trades</h2>,
                  <p className="lead mb-1 text-muted-light">Practice trading stocks with zero risk using our paper trading platform.</p>,
                  <p className="lead mb-1">Test your strategies in real market conditions.</p>,
                  <p className="lead mb-1">Compete with friends and climb the leaderboard.</p>
                ]}
              />
            </div>
          </div>
        </FadeInSection>
      </div>
    </div>
  );
}

export default Home; 