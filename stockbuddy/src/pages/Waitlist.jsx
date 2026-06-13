/**
 * Waitlist page for MVP lockdown mode
 * Collects email/name to join the waitlist.
 */
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { useUser } from '../store/user';
import { tk } from '../theme/terminal';
import Icon from '../components/Icon';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${tk.bg};
  padding: 20px;
  margin-top: -60px;
  padding-top: 80px;
`;

const Card = styled.div`
  background: ${tk.surface};
  color: ${tk.text};
  border: 1px solid ${tk.hair};
  border-radius: ${tk.r}px;
  padding: 40px;
  max-width: 480px;
  width: 100%;
`;

const Logo = styled.h1`
  font-family: ${tk.fontHeading};
  font-size: 2.2rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: ${tk.gold};
  text-align: center;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-family: ${tk.fontBody};
  color: ${tk.muted};
  text-align: center;
  margin-bottom: 32px;
  font-size: 0.95rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-family: ${tk.fontBody};
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${tk.muted};
`;

const Input = styled.input`
  padding: 11px 14px;
  border: 1px solid ${tk.hair};
  border-radius: ${tk.rSm}px;
  font-size: 14px;
  font-family: ${tk.fontBody};
  background: ${tk.inset};
  color: ${tk.text};
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:focus {
    outline: none;
    border-color: ${tk.gold};
    box-shadow: 0 0 0 2px ${tk.goldHairFaint};
  }

  &::placeholder {
    color: ${tk.faint};
  }
`;

const Button = styled.button`
  padding: 12px 16px;
  border: none;
  border-radius: ${tk.rSm}px;
  font-family: ${tk.fontBody};
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background 0.15s;
  background: ${tk.gold};
  color: #1F1F1F;
  margin-top: 8px;

  &:hover:not(:disabled) {
    background: ${tk.goldBright};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Message = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  border-radius: ${tk.rSm}px;
  font-family: ${tk.fontBody};
  font-size: 13px;
  font-weight: 500;

  &.success {
    background: ${tk.upBg};
    color: ${tk.up};
    border: 1px solid rgba(79, 180, 119, 0.4);
  }

  &.error {
    background: ${tk.downBg};
    color: ${tk.down};
    border: 1px solid rgba(224, 96, 90, 0.4);
  }
`;

const Footer = styled.div`
  margin-top: 24px;
  text-align: center;
  font-family: ${tk.fontBody};
  color: ${tk.muted};
  font-size: 0.8rem;

  a {
    color: ${tk.gold};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const InviteSection = styled.div`
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid ${tk.hair};
`;

const InviteInput = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 8px;

  input {
    flex: 1;
  }

  button {
    padding: 11px 18px;
    margin-top: 0;
  }
`;

export default function Waitlist() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useUser((state) => state.user);
  const fetchUser = useUser((state) => state.fetchUser);
  const nextUrl = searchParams.get('next') || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setMessage({ type: 'success', text: "You're on the list! We'll email you when it's your turn." });
        setEmail('');
        setName('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Something went wrong' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemInvite = async () => {
    if (!inviteCode.trim()) return;
    
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: 'Please sign in first to redeem your invite.' });
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/invites/redeem`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token: inviteCode })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setMessage({ type: 'success', text: 'Invite redeemed! Redirecting...' });
        await fetchUser(); // Refresh user data
        setTimeout(() => navigate(nextUrl), 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Invalid invite code' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Card>
        <Logo>tickr</Logo>
        <Subtitle>Join the waitlist for early access</Subtitle>
        
        {message && (
          <Message className={message.type}>
            <Icon name={message.type === 'success' ? 'check' : 'alert'} size={15} />
            {message.text}
          </Message>
        )}
        
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </InputGroup>
          
          <InputGroup>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </InputGroup>
          
          <Button type="submit" disabled={loading || !email || !name.trim()}>
            {loading ? 'Joining...' : 'Join Waitlist'}
          </Button>
        </Form>
        
        {user && (
          <InviteSection>
            <Label htmlFor="invite">Have an invite code?</Label>
            <InviteInput>
              <Input
                id="invite"
                type="text"
                placeholder="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
              <Button 
                type="button" 
                onClick={handleRedeemInvite}
                disabled={loading || !inviteCode.trim()}
              >
                Redeem
              </Button>
            </InviteInput>
          </InviteSection>
        )}
        
        <Footer>
          <p>
            By joining, you agree to our{' '}
            <Link to="/terms" target="_blank" rel="noopener noreferrer">Terms</Link> and{' '}
            <Link to="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.
          </p>
          {!user && (
            <p style={{ marginTop: '12px' }}>
              Already have an account?{' '}
              <Link to="/signin">Sign in</Link>
            </p>
          )}
        </Footer>
      </Card>
    </Container>
  );
}

