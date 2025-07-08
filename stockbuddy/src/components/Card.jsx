import React from 'react';
import styled from 'styled-components';

const CardWrapper = styled.div`
  background: var(--card-bg, #181a1b);
  border-radius: 1.25rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.18);
  border: 1.5px solid var(--border, #23272a);
  padding: 2rem;
  margin-bottom: 2rem;
  width: 100%;
  color: var(--text-main, #f5f6fa);
  transition: box-shadow 0.2s, border 0.2s;
  &:hover {
    border: 1.5px solid var(--accent-green, #00c805);
    box-shadow: 0 0 16px 2px var(--accent-green, #00c805), 0 2px 12px rgba(0,0,0,0.18);
  }
`;

const Card = ({ children, className }) => (
  <CardWrapper className={className}>{children}</CardWrapper>
);

export default Card; 