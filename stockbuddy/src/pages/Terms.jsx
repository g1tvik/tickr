/**
 * Terms of Service — plain-language template for an educational paper-trading
 * platform. Covers eligibility, accounts, the virtual economy, acceptable use,
 * IP, disclaimers, and liability. Have counsel review before a public launch.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../lib/seo';
import LegalLayout, { Section, H2, P, UL } from '../components/LegalLayout';

export default function Terms() {
  useSEO({
    title: 'Terms of Service',
    description:
      'The terms that govern your use of Tickr, the educational paper-trading platform.',
  });

  return (
    <LegalLayout
      eyebrow="Legal"
      title="Terms of service"
      updated="June 12, 2026"
      current="terms"
      lead="These terms govern your use of Tickr. By creating an account or using the Service, you agree to them."
    >
      <Section>
        <H2><span className="idx">01</span> Acceptance</H2>
        <P>
          These Terms of Service ("Terms") form a binding agreement between you
          and Tickr ("we", "us"). By accessing or using the Service you agree to
          these Terms and to our{' '}
          <Link to="/privacy">Privacy Policy</Link> and{' '}
          <Link to="/disclaimer">Risk Disclaimer</Link>. If you do not agree, do
          not use the Service.
        </P>
      </Section>

      <Section>
        <H2><span className="idx">02</span> Eligibility</H2>
        <P>
          You must be at least 13 years old (or the minimum age of digital
          consent in your jurisdiction) to use Tickr. By using the Service you
          represent that you meet this requirement and that the information you
          provide is accurate.
        </P>
      </Section>

      <Section>
        <H2><span className="idx">03</span> Your account</H2>
        <UL>
          <li>You are responsible for safeguarding your credentials and for all activity under your account.</li>
          <li>Notify us promptly of any unauthorized use at <a href="mailto:support@tickr.app">support@tickr.app</a>.</li>
          <li>You may sign in with a third-party provider (such as Google); their terms also apply to that sign-in.</li>
          <li>One person, one account, unless we agree otherwise in writing.</li>
        </UL>
      </Section>

      <Section>
        <H2><span className="idx">04</span> Educational service — not advice</H2>
        <P>
          Tickr is an educational simulator. All trading is paper trading with a
          virtual balance, and no real money, securities, or assets are ever
          transacted. Nothing on the Service is investment, financial, legal, or
          tax advice. The full terms of this limitation are set out in our{' '}
          <Link to="/disclaimer">Risk Disclaimer</Link>, which is incorporated
          into these Terms.
        </P>
      </Section>

      <Section>
        <H2><span className="idx">05</span> Virtual items & coins</H2>
        <P>
          The Service may grant virtual coins, balances, levels, and inventory
          items. These are a limited, revocable, non-transferable license to use
          features within the Service. They are not your property, have no
          monetary value, cannot be exchanged for cash or anything of value, and
          may be adjusted, reset, or removed at any time — for example to fix
          bugs, prevent abuse, or rebalance the experience.
        </P>
      </Section>

      <Section>
        <H2><span className="idx">06</span> Acceptable use</H2>
        <P>You agree not to:</P>
        <UL>
          <li>Reverse-engineer, scrape, or overload the Service or its APIs.</li>
          <li>Exploit bugs, automate gameplay, or manipulate the virtual economy.</li>
          <li>Use the Service for anything unlawful, or to harass or harm others.</li>
          <li>Circumvent access controls, the waitlist, or account restrictions.</li>
          <li>Resell, sublicense, or commercially exploit the Service without our written consent.</li>
        </UL>
        <P>
          We may suspend or terminate accounts that violate these Terms, with or
          without notice.
        </P>
      </Section>

      <Section>
        <H2><span className="idx">07</span> Intellectual property</H2>
        <P>
          The Service, including its content, design, lessons, and software, is
          owned by us or our licensors and protected by intellectual-property
          laws. We grant you a personal, non-exclusive, non-transferable,
          revocable license to use the Service for your own educational
          purposes. Market data and third-party content remain the property of
          their respective owners.
        </P>
      </Section>

      <Section>
        <H2><span className="idx">08</span> Third-party services</H2>
        <P>
          The Service relies on third parties — including market-data and
          AI providers and authentication services — whose availability and
          accuracy we do not control. We are not responsible for third-party
          content, outages, or changes.
        </P>
      </Section>

      <Section>
        <H2><span className="idx">09</span> Disclaimers</H2>
        <P>
          The Service is provided "as is" and "as available", without warranties
          of any kind, whether express or implied, including merchantability,
          fitness for a particular purpose, and non-infringement. We do not
          warrant that the Service will be uninterrupted, error-free, or that any
          data shown is accurate or current.
        </P>
      </Section>

      <Section>
        <H2><span className="idx">10</span> Limitation of liability</H2>
        <P>
          To the maximum extent permitted by law, we will not be liable for any
          indirect, incidental, special, consequential, or punitive damages, or
          for any loss arising from your use of — or inability to use — the
          Service. Because Tickr involves no real-money trading, you acknowledge
          that you cannot suffer real trading losses through the Service itself.
        </P>
      </Section>

      <Section>
        <H2><span className="idx">11</span> Changes & termination</H2>
        <P>
          We may modify these Terms or the Service at any time. Material changes
          will be reflected by the "Last updated" date above, and continued use
          after a change means you accept it. You may stop using the Service at
          any time; we may suspend or end your access if you breach these Terms.
        </P>
      </Section>

      <Section>
        <H2><span className="idx">12</span> Contact</H2>
        <P>
          Questions about these Terms? Email{' '}
          <a href="mailto:support@tickr.app">support@tickr.app</a>.
        </P>
      </Section>
    </LegalLayout>
  );
}
