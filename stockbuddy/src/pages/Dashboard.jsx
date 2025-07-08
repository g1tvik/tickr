import React from 'react';
import styled from 'styled-components';
import Card from '../components/Card';

const lessons = [
  {
    title: 'What is a stock?',
    description: 'Learn the basics of what a stock is and why companies issue them.'
  },
  {
    title: 'How do you buy/sell?',
    description: 'Understand the process of buying and selling stocks in the market.'
  },
  {
    title: 'What is diversification?',
    description: 'Discover why spreading your investments can reduce risk.'
  }
];

const AAPL_PRICE = 190;

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  width: 100%;
`;

const Header = styled.header`
  margin-bottom: 3.5rem;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 3.5rem;
  font-weight: 900;
  margin-bottom: 1.2rem;
  letter-spacing: -1px;
  color: var(--accent-green, #00c805);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-shadow: 0 0 8px #00c80544;
  justify-content: center;
  text-align: center;
`;

const Subtitle = styled.p`
  color: var(--text-muted, #b0b3b8);
  font-size: 1.7rem;
  font-weight: 500;
  text-align: center;
`;

const CardsContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 4rem;
  align-items: center;
`;

const DashboardCard = styled.div`
  background: #181a1b;
  border-radius: 2.5rem;
  box-shadow: 0 4px 24px 0 #0002;
  padding: 3rem 2.5rem 2.5rem 2.5rem;
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
`;

const ChartCard = styled(DashboardCard)`
  height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 1.5rem;
`;

const ChartTitle = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--accent-green, #00c805);
  margin-bottom: 1.2rem;
  text-align: center;
`;

const ChartPlaceholder = styled.div`
  width: 90%;
  max-width: 520px;
  height: 140px;
  background: linear-gradient(90deg, #23272a 0%, #23272a 100%);
  border-radius: 1.2rem;
  position: relative;
  overflow: hidden;
  margin-bottom: 0.5rem;
  margin-left: auto;
  margin-right: auto;
  border: 2px solid #222;
  box-shadow: 0 2px 16px 0 #0004;

  &::after {
    content: '';
    display: block;
    position: absolute;
    left: 20px;
    right: 20px;
    top: 50%;
    height: 3px;
    background: linear-gradient(90deg, #00c805 0%, #f7e600 100%);
    box-shadow: 0 0 16px 2px #00c80544;
    border-radius: 2px;
    transform: translateY(-50%) rotate(-7deg);
  }
`;

const LessonTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--accent-green, #00c805);
  text-shadow: 0 0 6px #00c80533;
`;

const LessonDesc = styled.p`
  margin-bottom: 1.5rem;
  color: var(--text-main, #f5f6fa);
`;

const Button = styled.button`
  background: var(--accent-green, #00c805);
  color: #181a1b;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 700;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  box-shadow: 0 0 8px 0 var(--accent-green, #00c80544);
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  &:hover:enabled {
    background: #00e805;
    color: #0a0a0a;
    box-shadow: 0 0 16px 2px var(--accent-green, #00c805);
  }
  &:disabled {
    background: #23272a;
    color: #64748b;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #f7e600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-shadow: 0 0 6px #f7e60033;
`;

const Cash = styled.div`
  margin-bottom: 0.5rem;
  color: var(--text-main, #f5f6fa);
  font-size: 1.1rem;
`;

const PortfolioList = styled.ul`
  margin: 0.5rem 0 0 0;
  padding-left: 1.2rem;
  color: var(--text-muted, #b0b3b8);
`;

export default function Home() {
  return (
    <>
      <PageWrapper>
        <Header>
          <Title>📈 StockBuddy</Title>
          <Subtitle>Learn stocks the fun way</Subtitle>
        </Header>
        <CardsContainer>
          <ChartCard>
            <ChartTitle>Portfolio Value (Placeholder)</ChartTitle>
            <ChartPlaceholder />
          </ChartCard>
          {/* Lesson Card */}
          <DashboardCard>
            <LessonTitle>Lesson: {lessons[0].title}</LessonTitle>
            <LessonDesc>{lessons[0].description}</LessonDesc>
            <Button>Complete Lesson</Button>
          </DashboardCard>
          {/* Paper Trading Card */}
          <DashboardCard>
            <SectionTitle>💼 Paper Trading</SectionTitle>
            <Cash>Cash Balance: <span style={{ fontWeight: 700, color: 'var(--accent-green, #00c805)' }}>${(10000).toLocaleString()}</span></Cash>
            <Button disabled>Buy 1 AAPL at ${AAPL_PRICE}</Button>
            <div style={{ marginTop: '1rem', width: '100%' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-main, #f5f6fa)', marginBottom: '0.25rem' }}>Your Portfolio:</div>
              <PortfolioList>
                <li>No stocks owned yet.</li>
              </PortfolioList>
            </div>
          </DashboardCard>
        </CardsContainer>
      </PageWrapper>
      <div style={{ height: '2000px', background: 'rgba(255,0,0,0.1)' }}></div>
    </>
  );
} 