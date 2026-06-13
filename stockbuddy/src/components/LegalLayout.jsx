/**
 * LegalLayout — shared Terminal Editorial scaffold for legal/policy pages
 * (Privacy, Terms, Disclaimer). Pages import these styled primitives and supply
 * only their prose, so every legal surface shares one identity.
 *
 * Editorial print feel: hairline-ruled eyebrow, Creato Display title, generous
 * measure (≤68ch), mono for dates/defined-terms. No card-soup, no emoji.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import tk from '../theme/terminal';
import Icon from './Icon';

const Wrapper = styled.div`
  min-height: 100vh;
  background: ${tk.bg};
  color: ${tk.text};
`;

const Inner = styled.main`
  max-width: 820px;
  margin: 0 auto;
  padding: 120px 24px 96px;

  @media (max-width: 768px) {
    padding: 96px 20px 72px;
  }
`;

const Eyebrow = styled.p`
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: ${tk.fontBody};
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 10.5px;
  font-weight: 600;
  color: ${tk.gold};
  margin: 0 0 18px;

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${tk.hair};
  }
`;

const Title = styled.h1`
  font-family: ${tk.fontHeading};
  font-size: clamp(2rem, 5vw, 2.9rem);
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.1;
  margin: 0 0 14px;
  color: ${tk.text};
`;

const Meta = styled.p`
  font-family: ${tk.fontMono};
  font-variant-numeric: tabular-nums;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  color: ${tk.muted};
  margin: 0 0 8px;
`;

const Lead = styled.p`
  font-size: clamp(1.02rem, 2.2vw, 1.2rem);
  color: ${tk.muted};
  line-height: 1.6;
  margin: 22px 0 0;
  max-width: 68ch;
`;

const Rule = styled.hr`
  border: 0;
  height: 1px;
  background: ${tk.hair};
  margin: 40px 0 0;
`;

/** A numbered top-level clause: small-caps index + heading on a hairline. */
const Section = styled.section`
  margin-top: 44px;
  max-width: 68ch;
`;

const H2 = styled.h2`
  font-family: ${tk.fontHeading};
  font-size: clamp(1.2rem, 3vw, 1.55rem);
  font-weight: 500;
  letter-spacing: -0.005em;
  line-height: 1.2;
  margin: 0 0 16px;
  color: ${tk.text};
  display: flex;
  align-items: baseline;
  gap: 12px;

  .idx {
    font-family: ${tk.fontMono};
    font-variant-numeric: tabular-nums;
    font-size: 0.9rem;
    font-weight: 600;
    color: ${tk.gold};
  }
`;

const P = styled.p`
  font-size: 1rem;
  line-height: 1.75;
  color: ${tk.text};
  margin: 0 0 16px;

  a {
    color: ${tk.goldBright};
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`;

const UL = styled.ul`
  margin: 0 0 16px;
  padding-left: 0;
  list-style: none;

  li {
    position: relative;
    padding-left: 22px;
    margin-bottom: 10px;
    font-size: 1rem;
    line-height: 1.7;
    color: ${tk.text};
  }

  li::before {
    content: '';
    position: absolute;
    left: 2px;
    top: 0.62em;
    width: 6px;
    height: 6px;
    border-radius: 1px;
    background: ${tk.goldHair};
  }
`;

/** Inline defined term / proper noun rendered in mono (e.g. "Paper Trading"). */
const Term = styled.span`
  font-family: ${tk.fontMono};
  font-variant-numeric: tabular-nums;
  color: ${tk.text};
`;

/** Cross-link footer to the sibling legal docs. */
const SeeAlso = styled.nav`
  margin-top: 56px;
  padding-top: 24px;
  border-top: 1px solid ${tk.hair};
  display: flex;
  flex-wrap: wrap;
  gap: 20px;

  a {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-family: ${tk.fontBody};
    font-size: 0.82rem;
    letter-spacing: 0.02em;
    color: ${tk.muted};
    text-decoration: none;
    transition: color 0.15s ease;
  }
  a:hover { color: ${tk.text}; }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-family: ${tk.fontBody};
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${tk.muted};
  text-decoration: none;
  margin-bottom: 26px;
  transition: color 0.15s ease;

  &:hover { color: ${tk.gold}; }
`;

/**
 * Page shell. Pass eyebrow/title/updated/lead and children (Section blocks).
 * `current` ('privacy' | 'terms' | 'disclaimer') hides the current page from
 * the See-also nav.
 */
export default function LegalLayout({ eyebrow, title, updated, lead, current, children }) {
  const siblings = [
    { key: 'privacy', to: '/privacy', label: 'Privacy Policy', icon: 'lock' },
    { key: 'terms', to: '/terms', label: 'Terms of Service', icon: 'edit' },
    { key: 'disclaimer', to: '/disclaimer', label: 'Risk Disclaimer', icon: 'alert' },
  ].filter((s) => s.key !== current);

  return (
    <Wrapper>
      <Inner>
        <BackLink to="/">
          <Icon name="arrow-left" size={13} /> Back to home
        </BackLink>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Title>{title}</Title>
        {updated && <Meta>Last updated · {updated}</Meta>}
        {lead && <Lead>{lead}</Lead>}
        <Rule />
        {children}
        <SeeAlso aria-label="Related legal documents">
          {siblings.map((s) => (
            <Link key={s.key} to={s.to}>
              <Icon name={s.icon} size={13} /> {s.label}
            </Link>
          ))}
        </SeeAlso>
      </Inner>
    </Wrapper>
  );
}

export { Section, H2, P, UL, Term };
