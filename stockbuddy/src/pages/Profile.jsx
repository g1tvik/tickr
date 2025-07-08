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
  color: var(--accent-green, #00c805);
  display: flex;
  align-items: center;
  gap: 0.7rem;
  text-shadow: 0 0 12px #00c80544;
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

const ProfileCard = styled.div`
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
  color: var(--accent-green, #00c805);
  text-shadow: 0 0 8px #00c80533;
`;

const SectionDesc = styled.p`
  margin-bottom: 2.2rem;
  color: var(--text-main, #f5f6fa);
  font-size: 1.18rem;
`;

export default function Profile() {
  return (
    <PageWrapper>
      <Header>
        <Title>👤 Profile</Title>
        <Subtitle>Your StockBuddy stats and achievements</Subtitle>
      </Header>
      <CardsContainer>
        <ProfileCard>
          <SectionTitle>XP Stats</SectionTitle>
          <SectionDesc>[XP stats will appear here]</SectionDesc>
        </ProfileCard>
        <ProfileCard>
          <SectionTitle>Badge Wall</SectionTitle>
          <SectionDesc>[Badge wall will appear here]</SectionDesc>
        </ProfileCard>
        <ProfileCard>
          <SectionTitle>Trading History</SectionTitle>
          <SectionDesc>[Trading history will appear here]</SectionDesc>
        </ProfileCard>
      </CardsContainer>
    </PageWrapper>
  );
} 