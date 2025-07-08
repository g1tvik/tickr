import React, { useState, useRef } from 'react';
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
  background: rgba(255, 255, 255, 0.10);
  border-radius: 1.5rem;
  padding: 2.5rem;
  border: 2.5px solid rgba(255,255,255,0.32);
  box-shadow: 0 2px 16px 0 rgba(0,0,0,0.13), 0 0 0 2.5px rgba(255,255,255,0.18) inset;
  backdrop-filter: blur(36px) saturate(1.7);
  text-align: center;
  transition: box-shadow 0.3s cubic-bezier(0.4,0,0.2,1), background 0.3s cubic-bezier(0.4,0,0.2,1), transform 0.12s cubic-bezier(0.4,0,0.2,1), border 0.3s cubic-bezier(0.4,0,0.2,1);
  position: relative;
  will-change: transform;
  perspective: 800px;
  overflow: hidden;

  &:hover {
    background: rgba(255, 255, 255, 0.16);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.32), 0 2px 16px 0 rgba(0,0,0,0.13), 0 0 0 2.5px rgba(255,255,255,0.18) inset;
    border: 2.5px solid rgba(255,255,255,0.45);
  }

  & .glass-streak {
    pointer-events: none;
    position: absolute;
    width: 180px;
    height: 8px;
    left: 0;
    top: 0;
    opacity: ${props => props.streakActive ? 0.85 : 0};
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.95) 50%, transparent);
    filter: blur(1.5px);
    border-radius: 8px;
    transition: opacity 0.18s cubic-bezier(0.4,0,0.2,1), left 0.08s, top 0.08s, transform 0.08s;
    z-index: 2;
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

  // Add state for 3D pop-out and glass streak effect
  const [cardTransforms, setCardTransforms] = useState([null, null, null, null]);
  const [streakProps, setStreakProps] = useState([
    { x: 0.5, y: 0.5, angle: 0, active: false },
    { x: 0.5, y: 0.5, angle: 0, active: false },
    { x: 0.5, y: 0.5, angle: 0, active: false },
    { x: 0.5, y: 0.5, angle: 0, active: false }
  ]);

  const handleCardMouseMove = (e, idx) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const maxTilt = 10;
    const rotateX = ((y - centerY) / centerY) * maxTilt;
    const rotateY = ((x - centerX) / centerX) * -maxTilt;
    const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
    const scale = 1.015 + 0.025 * (dist / maxDist);
    setCardTransforms(tfs => {
      const next = [...tfs];
      next[idx] = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
      return next;
    });
    // Calculate angle from center to cursor for streak rotation
    const angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
    setStreakProps(props => {
      const next = [...props];
      next[idx] = {
        x: x - 90, // center streak on cursor (180px wide)
        y: y - 4,  // center streak on cursor (8px tall)
        angle,
        active: true
      };
      return next;
    });
  };

  const handleCardMouseLeave = idx => {
    setCardTransforms(tfs => {
      const next = [...tfs];
      next[idx] = '';
      return next;
    });
    setStreakProps(props => {
      const next = [...props];
      next[idx] = { ...next[idx], active: false };
      return next;
    });
  };

  const handleGetStarted = () => {
    onLogin();
  };

  const handleLearnMore = () => {
    onLogin();
  };

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  // Update tab links to trigger login instead of navigation
  const handleTabLink = () => {
    onLogin();
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
          <FeatureCard
            key={index}
            style={{ transform: cardTransforms[index] || undefined }}
            streakActive={streakProps[index].active}
            onMouseMove={e => handleCardMouseMove(e, index)}
            onMouseLeave={() => handleCardMouseLeave(index)}
          >
            <div
              className="glass-streak"
              style={{
                left: streakProps[index].x,
                top: streakProps[index].y,
                opacity: streakProps[index].active ? 0.85 : 0,
                transform: `rotate(${streakProps[index].angle}deg)`
              }}
            />
            <FeatureIcon>{feature.icon}</FeatureIcon>
            <FeatureTitle>{feature.title}</FeatureTitle>
            <FeatureDescription>{feature.description}</FeatureDescription>
          </FeatureCard>
        ))}
      </FeaturesSection>
    </PageWrapper>
  );
} 