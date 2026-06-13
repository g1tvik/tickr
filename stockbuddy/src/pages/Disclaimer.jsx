/**
 * Risk Disclaimer — the most load-bearing legal surface for a paper-trading
 * product. Makes the "education only, not investment advice, simulated money"
 * position unambiguous. Plain-language template; have counsel review before
 * a public launch.
 */
import React from 'react';
import { useSEO } from '../lib/seo';
import LegalLayout, { Section, H2, P, UL } from '../components/LegalLayout';

export default function Disclaimer() {
  useSEO({
    title: 'Risk Disclaimer',
    description:
      'Tickr is an educational paper-trading simulator. It is not investment advice, and no real money is ever traded.',
  });

  return (
    <LegalLayout
      eyebrow="Legal"
      title="Risk disclaimer"
      updated="June 12, 2026"
      current="disclaimer"
      lead="Tickr is a learning tool. Everything you trade here is simulated. Read this before you treat anything on the platform as financial guidance."
    >
      <Section>
        <H2><span className="idx">01</span> Educational purpose only</H2>
        <P>
          Tickr ("the Service") is provided solely for educational and
          informational purposes. Its lessons, articles, AI Coach responses,
          charts, and simulated trading exist to help you learn how markets
          work. Nothing on the Service is, or should be construed as,
          investment, financial, legal, tax, or accounting advice.
        </P>
      </Section>

      <Section>
        <H2><span className="idx">02</span> Paper trading — no real money</H2>
        <P>
          All trading on Tickr is <strong>paper trading</strong>: orders fill
          against market data using a virtual balance. No real funds, securities,
          or assets are ever bought, sold, held, or transferred. Virtual coins,
          balances, levels, and inventory items have no cash value, cannot be
          redeemed, and exist only inside the Service.
        </P>
        <P>
          Simulated results do not reflect real trading. Simulations exclude
          factors that materially affect live outcomes — including but not
          limited to slippage, partial fills, liquidity, financing costs, taxes,
          and the emotional pressure of risking real capital.
        </P>
      </Section>

      <Section>
        <H2><span className="idx">03</span> Not a broker or adviser</H2>
        <P>
          Tickr is not a registered broker-dealer, investment adviser, or
          financial institution, and does not execute real-money transactions on
          your behalf. We are not a member of FINRA, SIPC, or any equivalent
          body, and your activity here is not protected by any such membership.
        </P>
      </Section>

      <Section>
        <H2><span className="idx">04</span> Market data</H2>
        <P>
          Market data may be delayed, sampled, incomplete, or — where live data
          providers are unavailable — clearly-labeled demo data. Do not rely on
          any price, quote, or figure shown on Tickr for a real-world financial
          decision.
        </P>
      </Section>

      <Section>
        <H2><span className="idx">05</span> The AI Coach has limits</H2>
        <P>
          The AI Coach generates responses automatically and can be incomplete,
          outdated, or wrong. Treat it as a study aid, not a professional
          adviser. Always verify anything important with a qualified, licensed
          professional before acting on it.
        </P>
      </Section>

      <Section>
        <H2><span className="idx">06</span> Real investing carries risk</H2>
        <P>If you go on to trade real money elsewhere, understand that:</P>
        <UL>
          <li>The value of investments can fall as well as rise.</li>
          <li>Past performance does not indicate future results.</li>
          <li>You can lose some or all of the capital you invest.</li>
          <li>You are solely responsible for your own financial decisions.</li>
        </UL>
        <P>
          Consult a licensed financial professional before making real
          investment decisions.
        </P>
      </Section>

      <Section>
        <H2><span className="idx">07</span> Questions</H2>
        <P>
          Questions about this disclaimer? Reach us at{' '}
          <a href="mailto:support@tickr.app">support@tickr.app</a>.
        </P>
      </Section>
    </LegalLayout>
  );
}
