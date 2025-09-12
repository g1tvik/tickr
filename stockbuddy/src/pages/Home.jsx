import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Typewriter from "../components/Typewriter";
import StockTicker from "../components/StockTicker";
import FadeInSection from "../components/FadeInSection";
import CascadeText from "../components/CascadeText";
import { fetchStockData } from "../utils/stockCache";
import { useNavbarBackground } from "../hooks/useNavbarBackground";

// Helper function to get formatted timestamp
const getTimestamp = () => {
  return new Date().toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
};

function Home({ isLoggedIn }) {
  const [preloadedStocks, setPreloadedStocks] = useState([]);
  const location = useLocation();
  const { setNavbarBackground, resetNavbarBackground } = useNavbarBackground();

  // Preload stock data immediately when component mounts
  useEffect(() => {
    const preloadStockData = async () => {
      const coreStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'SPY'];
      
      console.log(`[${getTimestamp()}] 🏠 Home: Starting to preload stock data`);
      
      try {
        // Use shared cache utility
        const stockData = await fetchStockData(coreStocks);
        
        if (stockData && stockData.length > 0) {
          setPreloadedStocks(stockData);
          console.log(`[${getTimestamp()}] 🏠 Home: Successfully preloaded ${stockData.length} stocks`);
        } else {
          console.warn(`[${getTimestamp()}] 🏠 Home: No stock data available for preloading`);
        }
      } catch (error) {
        console.warn(`[${getTimestamp()}] 🏠 Home: Preload failed:`, error);
      }
    };

    // Start preloading immediately with no delay
    preloadStockData();
  }, []);

  useEffect(() => {
    console.log(`Home: useEffect triggered for route ${location.pathname}`);
    // Only run this effect when on Home page
    if (location.pathname !== '/') {
      console.log('Home: Not on Home page, skipping effect');
      return;
    }
    console.log('Home: On Home page, setting up scroll listeners');

    let isBottomHalf = false; // Use local variable instead of state
    
    const updateBackground = (useBottomColor) => {
      console.log(`Home: updateBackground called with useBottomColor = ${useBottomColor}`);
      const pageTransition = document.querySelector('.page-transition');
      const mainContent = document.querySelector('.main-content');
      const appContainer = document.querySelector('.app-container');
      const body = document.body;
      const html = document.documentElement;
      
      const backgroundColor = useBottomColor ? '#E5E5E5' : '#F4F1E9';
      const cssVar = useBottomColor ? 'var(--marbleLightGray)' : '#F4F1E9';
      
      if (pageTransition) {
        pageTransition.style.backgroundColor = backgroundColor;
      }
      if (mainContent) {
        mainContent.style.backgroundColor = cssVar;
      }
      if (appContainer) {
        appContainer.style.backgroundColor = cssVar;
      }
      // Update navbar background using the centralized system
      if (useBottomColor) {
        setNavbarBackground('#E5E5E5'); // marbleLightGray
        console.log('Navbar: Setting to marbleLightGray (#E5E5E5)');
      } else {
        setNavbarBackground('#F4F1E9'); // marbleWhite
        console.log('Navbar: Setting to marbleWhite (#F4F1E9)');
      }
      if (body) {
        body.style.backgroundColor = backgroundColor;
      }
      if (html) {
        html.style.backgroundColor = backgroundColor;
      }
      // Update scrollbar to match the background
      body.style.setProperty('--scrollbar-track-bg', backgroundColor, 'important');
    };
    
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollPercentage = scrollPosition / (documentHeight - windowHeight);
      
      // More aggressive detection for bottom area
      const isAtBottom = scrollPosition + windowHeight >= documentHeight - 10; // 10px threshold
      const isInBottomHalf = scrollPercentage > 0.4; // Lowered threshold
      
      // Change background when we're in the bottom area
      if (isInBottomHalf || isAtBottom) {
        if (!isBottomHalf) {
          isBottomHalf = true;
          console.log('Switching to bottom background (marbleLightGray)');
          updateBackground(true);
        }
      } else {
        if (isBottomHalf) {
          isBottomHalf = false;
          console.log('Switching to top background (marbleWhite)');
          updateBackground(false);
        }
      }
    };
    
    // Handle touch events for mobile overscroll
    const handleTouchMove = (e) => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Check if we're at the bottom and trying to scroll further
      if (scrollPosition + windowHeight >= documentHeight - 5) {
        if (!isBottomHalf) {
          isBottomHalf = true;
          console.log('Touch: Switching to bottom background (marbleLightGray)');
          updateBackground(true);
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
    
    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('touchmove', handleTouchMove);
      // Only reset page background, don't touch navbar (let App handle it)
      const pageTransition = document.querySelector('.page-transition');
      const mainContent = document.querySelector('.main-content');
      const appContainer = document.querySelector('.app-container');
      const body = document.body;
      const html = document.documentElement;
      
      if (pageTransition) {
        pageTransition.style.backgroundColor = '#F4F1E9';
      }
      if (mainContent) {
        mainContent.style.backgroundColor = '#F4F1E9';
      }
      if (appContainer) {
        appContainer.style.backgroundColor = '#F4F1E9';
      }
      if (body) {
        body.style.backgroundColor = '#F4F1E9';
      }
      if (html) {
        html.style.backgroundColor = '#F4F1E9';
      }
      body.style.setProperty('--scrollbar-track-bg', '#F4F1E9', 'important');
      
      console.log('Home page cleanup: Page background reset, navbar left for App to handle');
    };
  }, [location.pathname, setNavbarBackground, resetNavbarBackground]); // Include dependencies


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
          <StockTicker stocks={preloadedStocks} />
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