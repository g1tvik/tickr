import React from 'react';
import styled from 'styled-components';
import Card from '../components/Card';

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  width: 100%;
`;

const Header = styled.header`
  margin-bottom: 4.5rem;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 3.6rem;
  font-weight: 900;
  margin-bottom: 1.7rem;
  letter-spacing: -1px;
  color: var(--accent-green, #FFF8E7);
  display: flex;
  align-items: center;
  gap: 0.7rem;
  text-shadow: 0 0 12px #FFF8E744;
  justify-content: center;
  text-align: center;
`;

const Subtitle = styled.p`
  color: var(--text-muted, #b0b3b8);
  font-size: 1.7rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  text-align: center;
`;

const CardsContainer = styled.div`
  width: 100%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  gap: 3.5rem;
  align-items: center;
`;

const TradeCard = styled.div`
  background: #181a1b;
  border-radius: 3rem;
  box-shadow: 0 6px 32px 0 #0003;
  padding: 3.5rem 2.7rem 2.7rem 2.7rem;
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.1rem;
  color: var(--accent-green, #FFF8E7);
  text-shadow: 0 0 8px #FFF8E733;
`;

const SectionDesc = styled.p`
  margin-bottom: 2.2rem;
  color: var(--text-main, #f5f6fa);
  font-size: 1.18rem;
`;

const Button = styled.button`
  background: var(--accent-green, #FFF8E7);
  color: #181a1b;
  padding: 1.1rem 2.2rem;
  border-radius: 1.1rem;
  font-weight: 700;
  font-size: 1.15rem;
  border: none;
  cursor: pointer;
  box-shadow: 0 0 12px 0 var(--accent-green, #FFF8E744);
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  margin-top: 0.5rem;
  &:hover:enabled {
    background: #FFF8E7;
    color: #0a0a0a;
    box-shadow: 0 0 20px 3px var(--accent-green, #FFF8E7);
  }
  &:disabled {
    background: #23272a;
    color: #64748b;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

export default function Trade() {
  return (
    <PageWrapper>
      <Header>
        <Title>💹 Trade</Title>
        <Subtitle>Simulate buying and selling stocks in real time</Subtitle>
      </Header>
      <CardsContainer>
        <TradeCard>
          <SectionTitle>Paper Trading Simulator</SectionTitle>
          <SectionDesc>[Trading simulator UI will appear here]</SectionDesc>
          <Button>Buy Stock</Button>
        </TradeCard>
        <TradeCard>
          <SectionTitle>Portfolio</SectionTitle>
          <SectionDesc>[Portfolio list will appear here]</SectionDesc>
        </TradeCard>
      </CardsContainer>
    </PageWrapper>
  );
} 