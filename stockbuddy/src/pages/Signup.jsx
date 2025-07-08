import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
`;
const Form = styled.form`
  background: #181a1b;
  padding: 3rem 2.5rem;
  border-radius: 24px;
  box-shadow: 0 4px 32px rgba(0,0,0,0.12);
  display: flex;
  flex-direction: column;
  min-width: 340px;
`;
const Title = styled.h2`
  color: #f5f6fa;
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: 600;
  text-align: center;
`;
const Input = styled.input`
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid #23272a;
  border-radius: 12px;
  background: #23272a;
  color: #f5f6fa;
  font-size: 1rem;
  outline: none;
`;
const Button = styled.button`
  padding: 1rem;
  background: #00c805;
  color: #181a1b;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 1rem;
  transition: background 0.2s;
  &:hover { background: #00a604; }
`;
const Error = styled.div`
  color: #f7e600;
  margin-bottom: 1rem;
  text-align: center;
`;
const Switch = styled.div`
  color: #b0b3b8;
  text-align: center;
  margin-top: 1rem;
`;

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      const res = await axios.post('/api/auth/register', { email, password });
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <Title>Create Account</Title>
        {error && <Error>{error}</Error>}
        <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <Input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
        <Button type="submit">Sign Up</Button>
        <Switch>
          Already have an account? <Link to="/login">Sign in</Link>
        </Switch>
      </Form>
    </Container>
  );
};

export default Signup; 