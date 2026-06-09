/**
 * Waitlist page for MVP lockdown mode
 * Collects email/name to join the waitlist.
 */
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { useUser } from '../store/user';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 20px;
  margin-top: -60px;
  padding-top: 80px;
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 40px;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const Logo = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  color: #666;
  text-align: center;
  margin-bottom: 32px;
  font-size: 1.1rem;
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
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 14px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &::placeholder {
    color: #aaa;
  }
`;

const Button = styled.button`
  padding: 16px;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin-top: 8px;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Message = styled.div`
  padding: 14px;
  border-radius: 10px;
  text-align: center;
  font-weight: 500;
  
  &.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
  
  &.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
`;

const Footer = styled.div`
  margin-top: 24px;
  text-align: center;
  color: #666;
  font-size: 0.85rem;
  
  a {
    color: #667eea;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const InviteSection = styled.div`
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
`;

const InviteInput = styled.div`
  display: flex;
  gap: 10px;
  
  input {
    flex: 1;
  }
  
  button {
    padding: 14px 20px;
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
        setMessage({ type: 'success', text: "You're on the list! We'll email you when it's your turn. 🎉" });
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
          <Message className={message.type}>{message.text}</Message>
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
            <a href="/terms" target="_blank">Terms</a> and{' '}
            <a href="/privacy" target="_blank">Privacy Policy</a>.
          </p>
          {!user && (
            <p style={{ marginTop: '12px' }}>
              Already have an account?{' '}
              <a href="/signin">Sign in</a>
            </p>
          )}
        </Footer>
      </Card>
    </Container>
  );
}

