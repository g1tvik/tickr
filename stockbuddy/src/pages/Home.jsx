import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  width: 100%;
`;

const HeroSection = styled.section`
  width: 100%;
  max-width: 1200px;
  padding: 8rem 2rem 4rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rem;
`;

const HeroTitle = styled.h1`
  font-size: 4.5rem;
  font-weight: 900;
  margin-bottom: 1.5rem;
  letter-spacing: -2px;
  color: var(--text-main, #f5f6fa);
  text-shadow: 0 0 20px rgba(245, 246, 250, 0.3);
  line-height: 1.1;
`;

const HeroSubtitle = styled.p`
  font-size: 1.8rem;
  color: var(--text-muted, #b0b3b8);
  font-weight: 400;
  max-width: 600px;
  line-height: 1.4;
  margin-bottom: 2rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-bottom: 4rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const PrimaryButton = styled.button`
  background: var(--accent-green, #00c805);
  color: #0a0a0a;
  padding: 1rem 2rem;
  border-radius: 1rem;
  font-weight: 700;
  font-size: 1.1rem;
  border: none;
  cursor: pointer;
  box-shadow: 0 0 16px 0 var(--accent-green, #00c80544);
  transition: all 0.2s ease;
  
  &:hover {
    background: #00e805;
    box-shadow: 0 0 24px 4px var(--accent-green, #00c805);
    transform: translateY(-2px);
  }
`;

const SecondaryButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-main, #f5f6fa);
  padding: 1rem 2rem;
  border-radius: 1rem;
  font-weight: 600;
  font-size: 1.1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
`;

const TabContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const TabList = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const TabButton = styled.button`
  background: ${props => props.active ? 'rgba(0, 200, 5, 0.15)' : 'rgba(255, 255, 255, 0.08)'};
  color: ${props => props.active ? 'var(--accent-green, #00c805)' : 'var(--text-muted, #b0b3b8)'};
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  border: 1px solid ${props => props.active ? 'rgba(0, 200, 5, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: ${props => props.active ? 'rgba(0, 200, 5, 0.2)' : 'rgba(255, 255, 255, 0.12)'};
    transform: translateY(-1px);
  }
`;

const TabPanel = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1.5rem;
  padding: 2.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  text-align: center;
`;

const TabDescription = styled.p`
  font-size: 1.3rem;
  color: var(--text-muted, #b0b3b8);
  margin-bottom: 2rem;
  line-height: 1.5;
`;

const TabLink = styled.button`
  color: var(--accent-green, #00c805);
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  background: none;
  border: none;
  cursor: pointer;
  
  &:hover {
    color: #00e805;
    transform: translateX(4px);
  }
`;

const FeaturesSection = styled.section`
  width: 100%;
  max-width: 1200px;
  padding: 4rem 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
`;

const FeatureCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 1.5rem;
  padding: 2.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
`;

const FeatureIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1.5rem;
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-main, #f5f6fa);
  margin-bottom: 1rem;
`;

const FeatureDescription = styled.p`
  color: var(--text-muted, #b0b3b8);
  line-height: 1.6;
  font-size: 1.1rem;
`;

const tabs = [
  {
    id: 'learn',
    label: 'Learn',
    description: 'Master the fundamentals of stock trading with interactive lessons and real-world examples.',
    link: '/learn'
  },
  {
    id: 'trade',
    label: 'Trade',
    description: 'Practice with paper trading in a risk-free environment to build your confidence.',
    link: '/trade'
  },
  {
    id: 'analyze',
    label: 'Analyze',
    description: 'Use powerful tools to analyze market trends and make informed investment decisions.',
    link: '/dashboard'
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    description: 'Track your investments and monitor your portfolio performance over time.',
    link: '/dashboard'
  },
  {
    id: 'community',
    label: 'Community',
    description: 'Connect with other traders, share insights, and learn from experienced investors.',
    link: '/profile'
  },
  {
    id: 'news',
    label: 'News',
    description: 'Stay updated with the latest market news and financial insights.',
    link: '/dashboard'
  }
];

const features = [
  {
    icon: '📚',
    title: 'Interactive Learning',
    description: 'Learn through hands-on exercises, quizzes, and real market simulations.'
  },
  {
    icon: '💰',
    title: 'Paper Trading',
    description: 'Practice trading with virtual money in a safe, risk-free environment.'
  },
  {
    icon: '📊',
    title: 'Market Analysis',
    description: 'Access powerful tools to analyze stocks, trends, and market data.'
  },
  {
    icon: '🎯',
    title: 'Goal Setting',
    description: 'Set financial goals and track your progress toward achieving them.'
  }
];

export default function Home({ onLogin }) {
  const [activeTab, setActiveTab] = useState('learn');
  const navigate = useNavigate();

  const handleGetStarted = () => {
    // Check if user is logged in by looking for token in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  const handleLearnMore = () => {
    onLogin();
  };

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  // Update tab links to trigger login instead of navigation
  const handleTabLink = () => {
    // Check if user is logged in by looking for token in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      navigate(activeTabData.link);
    } else {
      navigate('/signup');
    }
  };

  return (
    <PageWrapper>
      <HeroSection>
        <HeroTitle>Invest smarter. Learn faster.</HeroTitle>
        <HeroSubtitle>
          StockBuddy helps beginners master stock trading with interactive lessons, 
          paper trading, and real market insights.
        </HeroSubtitle>
        
        <ButtonGroup>
          <PrimaryButton onClick={handleGetStarted}>
            Get Started Free
          </PrimaryButton>
          <SecondaryButton onClick={handleLearnMore}>
            Learn More
          </SecondaryButton>
        </ButtonGroup>

        <TabContainer>
          <TabList>
            {tabs.map(tab => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </TabButton>
            ))}
          </TabList>
          
          <TabPanel>
            <TabDescription>{activeTabData.description}</TabDescription>
            <TabLink onClick={handleTabLink}>
              Explore {activeTabData.label} →
            </TabLink>
          </TabPanel>
        </TabContainer>
      </HeroSection>

      <FeaturesSection>
        {features.map((feature, index) => (
          <FeatureCard key={index}>
            <FeatureIcon>{feature.icon}</FeatureIcon>
            <FeatureTitle>{feature.title}</FeatureTitle>
            <FeatureDescription>{feature.description}</FeatureDescription>
          </FeatureCard>
        ))}
      </FeaturesSection>
    </PageWrapper>
  );
} 