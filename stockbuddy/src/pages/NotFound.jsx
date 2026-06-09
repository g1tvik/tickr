/**
 * 404 Not Found page
 */
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { white, gray, marbleDarkGray, marbleBlack, marbleGold, primary } from '../marblePalette';
import { fontHeading } from '../fontPalette';
import { useSEO } from '../lib/seo';

const Container = styled.main`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-gray-100, #F4F1E9);
  padding: 80px 24px;

  @media (max-width: 768px) {
    padding: 64px 20px;
  }
`;

const Card = styled.div`
  background: ${white};
  border: 1px solid rgba(42, 69, 128, 0.08);
  border-radius: 24px;
  padding: 56px 48px;
  max-width: 560px;
  width: 100%;
  text-align: center;
  box-shadow: 0 24px 60px -28px rgba(44, 44, 44, 0.45);

  @media (max-width: 768px) {
    padding: 40px 24px;
  }
`;

const ErrorCode = styled.p`
  font-family: ${fontHeading};
  font-size: clamp(4.5rem, 18vw, 7rem);
  font-weight: 700;
  line-height: 1;
  margin: 0;
  color: ${primary};
  letter-spacing: 0.02em;
`;

const Title = styled.h1`
  font-family: ${fontHeading};
  color: ${marbleDarkGray};
  font-size: clamp(1.4rem, 4vw, 1.75rem);
  font-weight: 700;
  margin: 12px 0 12px;
`;

const Message = styled.p`
  color: ${gray};
  font-size: 1.05rem;
  line-height: 1.6;
  margin: 0 auto 32px;
  max-width: 42ch;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
`;

const PrimaryButton = styled(Link)`
  display: inline-block;
  padding: 13px 28px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  text-decoration: none;
  background: ${marbleGold};
  color: ${marbleBlack};
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    color: ${marbleBlack};
    transform: translateY(-2px);
    box-shadow: 0 12px 24px -10px rgba(182, 156, 96, 0.7);
  }
`;

const SecondaryButton = styled(Link)`
  display: inline-block;
  padding: 13px 28px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  background: transparent;
  color: ${marbleDarkGray};
  border: 1px solid rgba(44, 44, 44, 0.2);
  transition: background 0.2s, border-color 0.2s;

  &:hover {
    color: ${marbleDarkGray};
    background: var(--color-gray-200, #EDE9DF);
    border-color: rgba(44, 44, 44, 0.35);
  }
`;

export default function NotFound() {
  useSEO({ title: 'Page not found' });

  return (
    <Container>
      <Card>
        <ErrorCode aria-hidden="true">404</ErrorCode>
        <Title>We couldn&apos;t find that page</Title>
        <Message>
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
          Let&apos;s get you back on track.
        </Message>
        <ButtonRow>
          <PrimaryButton to="/">Back to home</PrimaryButton>
          <SecondaryButton to="/dashboard">Go to dashboard</SecondaryButton>
          <SecondaryButton to="/learn">Browse lessons</SecondaryButton>
        </ButtonRow>
      </Card>
    </Container>
  );
}
