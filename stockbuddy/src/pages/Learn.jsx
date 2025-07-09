import React from 'react';
import styled from 'styled-components';
import Card from '../components/Card';

const lessons = [
  {
    title: 'How do you buy/sell?',
    description: 'Understand the process of buying and selling stocks in the market.'
  },
  {
    title: 'What is diversification?',
    description: 'Discover why spreading your investments can reduce risk.'
  }
];

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  width: 100%;
`;

const Header = styled.header`
  margin-bottom: 5.5rem;
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
  gap: 2.7rem;
  align-items: center;
  margin-top: 1.5rem;
`;

const LessonTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.1rem;
  color: var(--accent-green, #FFF8E7);
  text-shadow: 0 0 8px #FFF8E733;
`;

const LessonDesc = styled.p`
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

export default function Learn() {
  const lesson = lessons[0];
  return (
    <PageWrapper>
      <Header>
        <Title>📚 Learn</Title>
        <Subtitle>Interactive lessons to boost your investing knowledge</Subtitle>
      </Header>
      <CardsContainer>
        <Card>
          <LessonTitle>{lesson.title}</LessonTitle>
          <LessonDesc>{lesson.description}</LessonDesc>
          <Button>Start Lesson</Button>
        </Card>
        <Card>
          <LessonTitle>Quiz</LessonTitle>
          <LessonDesc>[Quiz will appear here after each lesson]</LessonDesc>
        </Card>
      </CardsContainer>
    </PageWrapper>
  );
} 