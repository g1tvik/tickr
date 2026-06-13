/**
 * Error Boundary component
 * Catches React rendering errors and displays a fallback UI styled with the
 * Terminal Editorial system (flat hairline panel on charcoal, gold accents).
 */
import React from 'react';
import styled from 'styled-components';
import tk from '../theme/terminal';
import Icon from './Icon';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${tk.bg};
  padding: 20px;
`;

const Card = styled.div`
  background: ${tk.surface};
  border: 1px solid ${tk.hair};
  border-top: 2px solid ${tk.goldHair};
  border-radius: ${tk.r}px;
  padding: 40px;
  max-width: 500px;
  width: 100%;
  text-align: center;
  color: ${tk.text};
  font-family: ${tk.fontBody};
`;

const IconWell = styled.div`
  width: 48px;
  height: 48px;
  margin: 0 auto 18px;
  border: 1px solid rgba(224, 96, 90, 0.4);
  border-radius: ${tk.rSm}px;
  display: grid;
  place-items: center;
  color: ${tk.down};
`;

const Title = styled.h1`
  font-family: ${tk.fontHeading};
  font-weight: 500;
  letter-spacing: -0.01em;
  color: ${tk.text};
  font-size: 1.6rem;
  margin-bottom: 12px;
`;

const Message = styled.p`
  color: ${tk.muted};
  line-height: 1.6;
  font-size: 0.95rem;
  margin-bottom: 24px;
`;

const Button = styled.button`
  padding: 11px 22px;
  border: 1px solid ${tk.gold};
  border-radius: ${tk.rSm}px;
  font-family: ${tk.fontBody};
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  background: ${tk.gold};
  color: ${tk.inset};
  margin: 0 6px;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: ${tk.goldBright};
    border-color: ${tk.goldBright};
  }
`;

const SecondaryButton = styled(Button)`
  background: transparent;
  border-color: ${tk.hairStrong};
  color: ${tk.text};

  &:hover {
    background: transparent;
    border-color: ${tk.goldHair};
    color: ${tk.goldBright};
  }
`;

const Details = styled.details`
  margin-top: 24px;
  text-align: left;

  summary {
    cursor: pointer;
    color: ${tk.muted};
    font-size: 0.85rem;

    &:hover {
      color: ${tk.text};
    }
  }

  pre {
    background: ${tk.inset};
    border: 1px solid ${tk.hair};
    padding: 16px;
    border-radius: ${tk.rSm}px;
    overflow-x: auto;
    font-family: ${tk.fontMono};
    font-size: 0.72rem;
    color: ${tk.down};
    margin-top: 12px;
  }
`;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Log error to console (could send to error reporting service)
    if (import.meta.env.DEV) console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container>
          <Card>
            <IconWell>
              <Icon name="alert" size={20} />
            </IconWell>
            <Title>Something went wrong</Title>
            <Message>
              We encountered an unexpected error. Don't worry, your data is safe.
              Try refreshing the page or go back to the home page.
            </Message>

            <div>
              <Button onClick={this.handleReload}>
                Refresh Page
              </Button>
              <SecondaryButton onClick={this.handleGoHome}>
                Go Home
              </SecondaryButton>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <Details>
                <summary>Technical details</summary>
                <pre>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </Details>
            )}
          </Card>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
