/**
 * 404 Not Found page — marble dark theme with a trading-flavored twist.
 */
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import tk from '../theme/terminal';
import Icon from '../components/Icon';
import { useSEO } from '../lib/seo';

const Container = styled.main`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  background: ${tk.bg};

  @media (max-width: 768px) {
    padding: 64px 20px;
  }
`;

const Card = styled.div`
  position: relative;
  overflow: hidden;
  background: ${tk.surface};
  border: 1px solid ${tk.hair};
  border-top: 2px solid ${tk.goldHair};
  border-radius: ${tk.r}px;
  padding: 52px 48px;
  max-width: 560px;
  width: 100%;
  text-align: center;

  @media (max-width: 768px) {
    padding: 40px 24px;
  }
`;

/* Mock "delisted quote" ticker row — leans into the trading theme */
const TickerRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: ${tk.fontMono};
  font-variant-numeric: tabular-nums;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${tk.down};
  background: ${tk.downBg};
  border: 1px solid rgba(224, 96, 90, 0.30);
  padding: 5px 12px;
  border-radius: ${tk.rXs}px;
  margin-bottom: 8px;

  .sym {
    color: ${tk.muted};
  }
`;

const ErrorCode = styled.p`
  font-family: ${tk.fontMono};
  font-variant-numeric: tabular-nums;
  font-size: clamp(4.5rem, 18vw, 7rem);
  font-weight: 500;
  line-height: 1;
  margin: 6px 0 0;
  letter-spacing: -0.02em;
  color: ${tk.goldBright};
`;

const Title = styled.h1`
  font-family: ${tk.fontHeading};
  color: ${tk.text};
  font-size: clamp(1.4rem, 4vw, 1.75rem);
  font-weight: 500;
  letter-spacing: -0.01em;
  margin: 14px 0 12px;
`;

const Message = styled.p`
  color: ${tk.muted};
  font-family: ${tk.fontBody};
  font-size: 1rem;
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
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 11px 20px;
  border-radius: ${tk.rSm}px;
  font-family: ${tk.fontBody};
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-decoration: none;
  background: ${tk.gold};
  color: ${tk.bg};
  transition: background 0.15s, color 0.15s;

  &:hover {
    color: ${tk.bg};
    background: ${tk.goldBright};
  }
`;

const SecondaryButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 11px 20px;
  border-radius: ${tk.rSm}px;
  font-family: ${tk.fontBody};
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-decoration: none;
  background: transparent;
  color: ${tk.text};
  border: 1px solid ${tk.hairStrong};
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    color: ${tk.text};
    background: rgba(244, 241, 233, 0.05);
    border-color: ${tk.goldHair};
  }
`;

export default function NotFound() {
  useSEO({ title: 'Page not found' });

  return (
    <Container>
      <Card>
        <TickerRow aria-hidden="true">
          <span className="sym">$404</span>
          <Icon name="tri-down" size={10} />
          page not found
        </TickerRow>
        <ErrorCode aria-hidden="true">404</ErrorCode>
        <Title>We couldn&apos;t find that page</Title>
        <Message>
          This ticker isn&apos;t listed — the page you&apos;re looking for doesn&apos;t
          exist or may have moved. Let&apos;s get you back on track.
        </Message>
        <ButtonRow>
          <PrimaryButton to="/">
            <Icon name="home" size={15} /> Back to home
          </PrimaryButton>
          <SecondaryButton to="/dashboard">
            <Icon name="chart" size={15} /> Go to dashboard
          </SecondaryButton>
          <SecondaryButton to="/learn">
            <Icon name="book" size={15} /> Browse lessons
          </SecondaryButton>
        </ButtonRow>
      </Card>
    </Container>
  );
}
