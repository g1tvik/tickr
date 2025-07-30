import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Typewriter from "../components/Typewriter";
import StockTicker from "../components/StockTicker";
import FadeInSection from "../components/FadeInSection";
import CascadeText from "../components/CascadeText";

function Home({ isLoggedIn }) {
  useEffect(() => {
    let isBottomHalf = false; // Use local variable instead of state
    
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollPercentage = scrollPosition / (documentHeight - windowHeight);
      
      // Change background when we're in the bottom half of the page
      if (scrollPercentage > 0.5) {
        if (!isBottomHalf) {
          isBottomHalf = true;
          // Try multiple selectors to find the right element
          const pageTransition = document.querySelector('.page-transition');
          const mainContent = document.querySelector('.main-content');
          const appContainer = document.querySelector('.app-container');
          const navbar = document.querySelector('.navbar-color');
          const body = document.body;
          
          if (pageTransition) {
            pageTransition.style.backgroundColor = '#E5E5E5'; // marbleLightGray
          }
          if (mainContent) {
            mainContent.style.backgroundColor = 'var(--marbleLightGray)'; // marbleLightGray
          }
          if (appContainer) {
            appContainer.style.backgroundColor = 'var(--marbleLightGray)'; // marbleLightGray
          }
          if (navbar) {
            navbar.style.backgroundColor = 'var(--marbleLightGray)'; // marbleLightGray
          }
          // Update scrollbar to match the new background
          body.style.setProperty('--scrollbar-track-bg', '#E5E5E5', 'important');
        }
      } else {
        if (isBottomHalf) {
          isBottomHalf = false;
          // Try multiple selectors to find the right element
          const pageTransition = document.querySelector('.page-transition');
          const mainContent = document.querySelector('.main-content');
          const appContainer = document.querySelector('.app-container');
          const navbar = document.querySelector('.navbar-color');
          const body = document.body;
          
          if (pageTransition) {
            pageTransition.style.backgroundColor = '#F4F1E9';
          }
          if (mainContent) {
            mainContent.style.backgroundColor = '#F4F1E9';
          }
          if (appContainer) {
            appContainer.style.backgroundColor = '#F4F1E9';
          }
          if (navbar) {
            navbar.style.backgroundColor = '#F4F1E9';
          }
          // Update scrollbar to match the original background
          body.style.setProperty('--scrollbar-track-bg', '#F4F1E9', 'important');
        }
      }
    };

    // Add smooth transition to multiple elements
    const elements = ['.page-transition', '.main-content', '.app-container', '.navbar-color'];
    elements.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        element.style.transition = 'background-color 0.5s ease';
      }
    });
    
    window.addEventListener('scroll', handleScroll);
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      // Reset background color when component unmounts
      const elements = ['.page-transition', '.main-content', '.app-container', '.navbar-color'];
      const body = document.body;
      elements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
          element.style.backgroundColor = '#F4F1E9';
        }
      });
      // Reset scrollbar to default
      body.style.setProperty('--scrollbar-track-bg', '#F4F1E9', 'important');
    };
  }, []); // Remove isBottomHalf dependency

  return (
    <div>
      {/* HERO SECTION */}
      <div className="pt-cum">
        <div className="text-center">
          <h1 className="fw-bold mb-3 hero-title">
            <Typewriter 
              text="Invest smarter. Learn faster." 
              speed={85}
              className="fw-bold"
            />
          </h1>
          <StockTicker />
          <div className="d-flex gap-3 mt-4 justify-content-center">
            <Link 
              to={isLoggedIn ? "/dashboard" : "/signup"}
              className="btn btn-light fw-bold px-4 py-2 shadow"
            >
              Get Started Free
            </Link>
            <Link
              to={isLoggedIn ? "/dashboard" : "/signin"}
              className="btn btn-outline-light learn-more-btn"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {/* SCROLL ANIMATED SECTIONS */}
      <div className="container mt-5 pb-5">
        <FadeInSection>
          <div className="row align-items-center mb-5">
            <div className="col-md-6">
              <img src="/dashboard-placeholder.jpg" alt="Track Your Portfolio Dashboard" className="img-fluid rounded shadow" />
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