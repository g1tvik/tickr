/**
 * SiteFooter — slim global footer rendered on every page except Home (which
 * has its own full editorial footer). Gives signed-in users a path to About
 * and the legal pages, which are otherwise only linked from the Home footer.
 *
 * Terminal Editorial: hairline top rule on the page charcoal, small-caps
 * links, mono year. Single row, wraps on small screens.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import tk from '../theme/terminal';

const Bar = styled.footer`
  border-top: 1px solid ${tk.hair};
  background: ${tk.bg};
  padding: 18px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    justify-content: center;
    text-align: center;
  }
`;

const Meta = styled.span`
  font-family: ${tk.fontMono};
  font-variant-numeric: tabular-nums;
  font-size: 11px;
  letter-spacing: 0.04em;
  color: ${tk.faint};
`;

const Links = styled.nav`
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;

  a {
    font-family: ${tk.fontBody};
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: ${tk.muted};
    text-decoration: none;
    transition: color 0.15s ease;
  }

  a:hover {
    color: ${tk.goldBright};
  }
`;

export default function SiteFooter() {
  return (
    <Bar aria-label="Site">
      <Meta>© {new Date().getFullYear()} tickr — paper trading only, not investment advice</Meta>
      <Links aria-label="Company and legal">
        <Link to="/about">About</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <Link to="/disclaimer">Disclaimer</Link>
      </Links>
    </Bar>
  );
}
