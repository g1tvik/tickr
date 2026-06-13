/**
 * Privacy Policy — plain-language template describing what Tickr collects and
 * why, reflecting the app's actual data practices (Google OAuth, JWT sessions,
 * email, simulated-trading activity, AI Coach conversations, waitlist).
 * Have counsel review before a public launch.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../lib/seo';
import LegalLayout, { Section, H2, P, UL } from '../components/LegalLayout';

export default function Privacy() {
  useSEO({
    title: 'Privacy Policy',
    description:
      'How Tickr collects, uses, and protects your information on its educational paper-trading platform.',
  });

  return (
    <LegalLayout
      eyebrow="Legal"
      title="Privacy policy"
      updated="June 12, 2026"
      current="privacy"
      lead="This explains what we collect, why we collect it, and the choices you have. Tickr is an educational simulator — we don't handle real money or real brokerage accounts."
    >
      <Section>
        <H2><span className="idx">01</span> Information we collect</H2>
        <P>We collect only what we need to run the Service:</P>
        <UL>
          <li><strong>Account information</strong> — your name, email, and (if you use Google sign-in) your basic Google profile and avatar.</li>
          <li><strong>Authentication data</strong> — session tokens that keep you signed in. We never store third-party passwords.</li>
          <li><strong>Learning &amp; simulation activity</strong> — lesson progress, paper-trading orders and positions, virtual coins, levels, and inventory. All of it is simulated.</li>
          <li><strong>AI Coach conversations</strong> — the messages you send the coach, so it can respond and so you can revisit them.</li>
          <li><strong>Waitlist details</strong> — if you join the waitlist, the email and name you provide.</li>
          <li><strong>Technical data</strong> — basic device, browser, and usage information needed to operate and secure the Service.</li>
        </UL>
      </Section>

      <Section>
        <H2><span className="idx">02</span> How we use it</H2>
        <UL>
          <li>To provide and personalize the Service — your portfolio, progress, and coach.</li>
          <li>To authenticate you and keep your account secure.</li>
          <li>To send service email you ask for, such as reminders and waitlist updates.</li>
          <li>To improve lessons, features, and reliability.</li>
          <li>To detect, prevent, and respond to fraud, abuse, and security issues.</li>
        </UL>
        <P>
          We do not sell your personal information, and we do not use it for
          third-party advertising.
        </P>
      </Section>

      <Section>
        <H2><span className="idx">03</span> Third-party services</H2>
        <P>
          We share data with service providers only as needed to operate the
          Service:
        </P>
        <UL>
          <li><strong>Google</strong> — optional sign-in (OAuth).</li>
          <li><strong>Market-data provider</strong> — to supply quotes and charts that drive the simulation. We send symbols, not your identity.</li>
          <li><strong>AI provider</strong> — to generate AI Coach responses from the messages you send.</li>
          <li><strong>Email provider</strong> — to deliver the service email described above.</li>
        </UL>
        <P>
          These providers process data under their own terms and privacy
          policies.
        </P>
      </Section>

      <Section>
        <H2><span className="idx">04</span> Cookies &amp; local storage</H2>
        <P>
          We use cookies and browser storage to keep you signed in and to
          remember preferences (such as your motion settings). We do not use
          third-party advertising trackers. You can clear this storage in your
          browser, though doing so will sign you out.
        </P>
      </Section>

      <Section>
        <H2><span className="idx">05</span> Data retention</H2>
        <P>
          We keep your information while your account is active and as needed to
          provide the Service. When you delete your account, we delete or
          anonymize your personal data within a reasonable period, except where
          we must retain it to meet legal obligations or resolve disputes.
        </P>
      </Section>

      <Section>
        <H2><span className="idx">06</span> Your choices &amp; rights</H2>
        <UL>
          <li><strong>Access &amp; export</strong> — you can export your data from <Link to="/settings">Settings</Link>.</li>
          <li><strong>Correction</strong> — update your profile information at any time.</li>
          <li><strong>Deletion</strong> — request account deletion from Settings or by emailing us.</li>
          <li><strong>Email</strong> — opt out of non-essential email via the unsubscribe link or your preferences.</li>
        </UL>
        <P>
          Depending on where you live, you may have additional rights under laws
          such as the GDPR or CCPA. To exercise them, contact us below.
        </P>
      </Section>

      <Section>
        <H2><span className="idx">07</span> Security</H2>
        <P>
          We protect your information with measures such as encrypted transport
          (HTTPS), hashed credentials, and access controls. No method of storage
          or transmission is perfectly secure, but we work to safeguard your data
          and to respond quickly to any incident.
        </P>
      </Section>

      <Section>
        <H2><span className="idx">08</span> Children</H2>
        <P>
          Tickr is not directed to children under 13, and we do not knowingly
          collect their personal information. If you believe a child has provided
          us data, contact us and we will delete it.
        </P>
      </Section>

      <Section>
        <H2><span className="idx">09</span> Changes</H2>
        <P>
          We may update this policy from time to time. Material changes will be
          reflected by the "Last updated" date above; significant changes may
          also be announced in the app.
        </P>
      </Section>

      <Section>
        <H2><span className="idx">10</span> Contact</H2>
        <P>
          Questions or requests about your privacy? Email{' '}
          <a href="mailto:privacy@tickr.app">privacy@tickr.app</a>.
        </P>
      </Section>
    </LegalLayout>
  );
}
