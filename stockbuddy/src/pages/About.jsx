import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleBlack, marbleGold } from '../marblePalette';
import { fontHeading } from '../fontPalette';

const Wrapper = styled.div`
  min-height: 100vh;
  background-color: ${marbleWhite};
  color: ${marbleDarkGray};
`;

const Inner = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 120px 24px 80px;
`;

const Title = styled.h1`
  font-family: ${fontHeading};
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  margin: 0 0 24px;
  color: ${marbleDarkGray};
`;

const Lead = styled.p`
  font-size: 1.2rem;
  color: ${marbleGray};
  line-height: 1.6;
  margin-bottom: 32px;
`;

const Body = styled.p`
  font-size: 1rem;
  line-height: 1.7;
  color: ${marbleDarkGray};
  margin-bottom: 20px;
`;

const BackLink = styled(Link)`
  display: inline-block;
  margin-top: 40px;
  padding: 12px 24px;
  background: ${marbleDarkGray};
  color: ${marbleWhite};
  text-decoration: none;
  font-weight: 600;
  border-radius: 12px;
  transition: background 0.2s, transform 0.2s;

  &:hover {
    background: ${marbleBlack};
    color: ${marbleWhite};
    transform: translateY(-1px);
  }
`;

export default function About() {
  return (
    <Wrapper>
      <Inner>
        <Title>About tickr</Title>
        <Lead>
          We're building a place to learn investing by doing—with no real money at risk.
        </Lead>
        <Body>
          tickr is your personal trading mentor. We combine paper trading, interactive lessons, 
          and an AI coach so you can build confidence and skills before risking real capital.
        </Body>
        <Body>
          Whether you're new to the markets or brushing up on strategy, we're here to make 
          investing feel approachable and explainable.
        </Body>
        <BackLink to="/">Back to home</BackLink>
      </Inner>
    </Wrapper>
  );
}
