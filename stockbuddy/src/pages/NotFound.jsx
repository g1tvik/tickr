/**
 * 404 Not Found page — marble dark theme with a trading-flavored twist.
 */
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { marbleGold } from '../marblePalette';
import { fontHeading } from '../fontPalette';
import { useSEO } from '../lib/seo';

const Container = styled.main`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  background:
    radial-gradient(circle at 82% 12%, rgba(201, 168, 90, 0.30) 0%, rgba(201, 168, 90, 0.08) 26%, transparent 48%),
    linear-gradient(165deg, #313a4e 0%, #2b2b2b 48%, #232323 100%);

  @media (max-width: 768px) {
    padding: 64px 20px;
  }
`;

const Card = styled.div`
  position: relative;
  overflow: hidden;
  background: #343434;
  border: 1px solid rgba(182, 156, 96, 0.22);
  border-radius: 24px;
  padding: 52px 48px;
  max-width: 560px;
  width: 100%;
  text-align: center;
  box-shadow: 0 24px 60px -24px rgba(0, 0, 0, 0.6);

  @media (max-width: 768px) {
    padding: 40px 24px;
  }
`;

/* Mock "delisted quote" ticker row — leans into the trading theme */
const TickerRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #ef8d8d;
  background: rgba(239, 68, 68, 0.10);
  border: 1px solid rgba(239, 68, 68, 0.30);
  padding: 6px 14px;
  border-radius: 999px;
  margin-bottom: 8px;

  .sym {
    color: #b8b4a8;
  }
`;

const ErrorCode = styled.p`
  font-family: ${fontHeading};
  font-size: clamp(4.5rem, 18vw, 7rem);
  font-weight: 400;
  line-height: 1;
  margin: 6px 0 0;
  letter-spacing: 0.01em;
  background: linear-gradient(180deg, #E6C87A 0%, #B69C60 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
`;

const Title = styled.h1`
  font-family: ${fontHeading};
  color: #F4F1E9;
  font-size: clamp(1.4rem, 4vw, 1.75rem);
  font-weight: 400;
  letter-spacing: -0.01em;
  margin: 14px 0 12px;
`;

const Message = styled.p`
  color: #b8b4a8;
  font-size: 1.02rem;
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
  background: linear-gradient(180deg, #E6C87A 0%, ${marbleGold} 100%);
  color: #2C2C2C;
  box-shadow: 0 8px 24px rgba(182, 156, 96, 0.22);
  transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;

  &:hover {
    color: #2C2C2C;
    transform: translateY(-2px);
    filter: brightness(1.05);
    box-shadow: 0 12px 30px rgba(182, 156, 96, 0.34);
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
  color: #F4F1E9;
  border: 1px solid rgba(244, 241, 233, 0.22);
  transition: background 0.2s, border-color 0.2s;

  &:hover {
    color: #F4F1E9;
    background: rgba(244, 241, 233, 0.06);
    border-color: rgba(182, 156, 96, 0.5);
  }
`;

export default function NotFound() {
  useSEO({ title: 'Page not found' });

  return (
    <Container>
      <Card>
        <TickerRow aria-hidden="true">
          <span className="sym">$404</span> ▼ page not found
        </TickerRow>
        <ErrorCode aria-hidden="true">404</ErrorCode>
        <Title>We couldn&apos;t find that page</Title>
        <Message>
          This ticker isn&apos;t listed — the page you&apos;re looking for doesn&apos;t
          exist or may have moved. Let&apos;s get you back on track.
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
