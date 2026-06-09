import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import tk from '../theme/terminal';
import Icon from '../components/Icon';
import { useSEO } from '../lib/seo';
import AppImage from '../components/AppImage';

// ── Terminal Editorial tokens (mapped onto the shared design system) ────────────
const BG      = tk.bg;
const SURFACE = tk.surface;
const TEXT    = tk.text;
const MUTED   = tk.muted;
const BORDER  = tk.hair;

const Wrapper = styled.div`
  min-height: 100vh;
  background: ${BG};
  color: ${TEXT};
`;

const Inner = styled.main`
  max-width: 1080px;
  margin: 0 auto;
  padding: 120px 24px 96px;

  @media (max-width: 768px) {
    padding: 96px 20px 72px;
  }
`;

const Section = styled.section`
  margin-top: 88px;

  @media (max-width: 768px) {
    margin-top: 64px;
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

const Hero = styled.header`
  max-width: 760px;
`;

const Title = styled.h1`
  font-family: ${tk.fontHeading};
  font-size: clamp(2.25rem, 6vw, 3.4rem);
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.08;
  margin: 0 0 20px;
  color: ${TEXT};
`;

const Lead = styled.p`
  font-size: clamp(1.1rem, 2.4vw, 1.35rem);
  color: ${MUTED};
  line-height: 1.6;
  margin: 0 0 16px;
`;

const SectionTitle = styled.h2`
  font-family: ${tk.fontHeading};
  font-size: clamp(1.5rem, 4vw, 2.1rem);
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.15;
  margin: 0 0 16px;
  color: ${TEXT};
`;

const Body = styled.p`
  font-size: 1.05rem;
  line-height: 1.75;
  color: ${TEXT};
  margin: 0 0 18px;
  max-width: 68ch;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 36px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: ${SURFACE};
  border: 1px solid ${BORDER};
  border-radius: ${tk.r}px;
  padding: 26px 24px;
`;

const StepNumber = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: ${tk.rSm}px;
  border: 1px solid ${tk.goldHair};
  background: transparent;
  color: ${tk.gold};
  font-family: ${tk.fontMono};
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 18px;
`;

const CardTitle = styled.h3`
  font-family: ${tk.fontHeading};
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 0 0 10px;
  color: ${TEXT};
`;

const CardBody = styled.p`
  font-size: 0.98rem;
  line-height: 1.65;
  color: ${MUTED};
  margin: 0;
`;

const SplitSection = styled.section`
  margin-top: 88px;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 48px;
  align-items: center;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 32px;
    margin-top: 64px;
  }
`;

const ValuesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 28px 0 0;
  display: grid;
  gap: 0;
`;

const ValueItem = styled.li`
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 18px 0;
  border-top: 1px solid ${tk.hair};
`;

const ValueText = styled.div`
  font-size: 1.02rem;
  line-height: 1.6;
  color: ${TEXT};

  strong {
    display: block;
    font-family: ${tk.fontHeading};
    font-weight: 600;
    margin-bottom: 4px;
  }

  span {
    color: ${MUTED};
  }
`;

const TeamGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
  margin-top: 36px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
    max-width: 360px;
  }
`;

const TeamMember = styled.figure`
  margin: 0;
`;

const TeamName = styled.figcaption`
  font-family: ${tk.fontHeading};
  font-weight: 600;
  font-size: 1.05rem;
  color: ${TEXT};
  margin-top: 14px;
`;

const TeamRole = styled.p`
  font-size: 0.9rem;
  color: ${tk.gold};
  margin: 4px 0 0;
  letter-spacing: 0.01em;
`;

const CTASection = styled.section`
  margin-top: 96px;
  text-align: center;
  background: ${SURFACE};
  border: 1px solid ${tk.goldHair};
  color: ${TEXT};
  border-radius: ${tk.r}px;
  padding: 56px 32px;

  @media (max-width: 768px) {
    margin-top: 72px;
    padding: 44px 24px;
  }
`;

const CTATitle = styled.h2`
  font-family: ${tk.fontHeading};
  font-size: clamp(1.5rem, 4vw, 2.1rem);
  font-weight: 500;
  letter-spacing: -0.01em;
  margin: 0 0 14px;
  color: ${TEXT};
`;

const CTABody = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  color: ${MUTED};
  margin: 0 auto 32px;
  max-width: 52ch;
`;

const CTAButtonRow = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
`;

const PrimaryButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 13px 26px;
  background: ${tk.gold};
  color: ${tk.bg};
  text-decoration: none;
  font-weight: 700;
  letter-spacing: 0.02em;
  border-radius: ${tk.rSm}px;
  transition: background 0.15s;

  &:hover {
    color: ${tk.bg};
    background: ${tk.goldBright};
  }
`;

const SecondaryButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 13px 26px;
  background: transparent;
  color: ${TEXT};
  text-decoration: none;
  font-weight: 600;
  border: 1px solid ${tk.hairStrong};
  border-radius: ${tk.rSm}px;
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    color: ${TEXT};
    background: ${tk.raised};
    border-color: ${tk.goldHair};
  }
`;

const FinePrint = styled.p`
  font-size: 0.82rem;
  color: ${tk.faint};
  margin: 24px 0 0;
`;

export default function About() {
  useSEO({ title: 'About' });

  return (
    <Wrapper>
      <Inner>
        <Hero>
          <Eyebrow>About tickr</Eyebrow>
          <Title>Learn to invest by doing — without risking a dollar.</Title>
          <Lead>
            tickr is a hands-on way to learn the markets. Practice with realistic
            paper trades, work through interactive lessons, and check your thinking
            with an AI coach — all before any real money is on the line.
          </Lead>
        </Hero>

        <SplitSection>
          <div>
            <Eyebrow>Our mission</Eyebrow>
            <SectionTitle>Make investing feel approachable and explainable.</SectionTitle>
            <Body>
              Most people are told to "just start investing" with no safe place to
              practice and no one to explain why a trade did or didn't work. tickr
              closes that gap. You can place trades, see the outcome, and build real
              intuition in an environment where mistakes cost lessons, not savings.
            </Body>
            <Body>
              We keep things honest: this is a learning and paper-trading product.
              We're not here to promise overnight returns — we're here to help you
              understand what you're doing and why.
            </Body>
          </div>
          <AppImage
            src="/images/product-shot.jpg"
            alt="A look inside the tickr app, showing a paper-trading dashboard and live chart"
            ratio="4/3"
            rounded={8}
          />
        </SplitSection>

        <Section>
          <Eyebrow>How tickr works</Eyebrow>
          <SectionTitle>Three steps, one feedback loop.</SectionTitle>
          <Body>
            Every part of tickr is built to reinforce the others, so what you learn
            in a lesson is something you can immediately try in a trade.
          </Body>
          <Grid>
            <Card>
              <StepNumber aria-hidden="true">1</StepNumber>
              <CardTitle>Learn the fundamentals</CardTitle>
              <CardBody>
                Short, interactive lessons walk you through how markets, orders, and
                risk actually work — no jargon left unexplained.
              </CardBody>
            </Card>
            <Card>
              <StepNumber aria-hidden="true">2</StepNumber>
              <CardTitle>Practice with paper trades</CardTitle>
              <CardBody>
                Put ideas to work with a simulated portfolio. Place buy and sell
                orders against real market data and watch how your decisions play out.
              </CardBody>
            </Card>
            <Card>
              <StepNumber aria-hidden="true">3</StepNumber>
              <CardTitle>Review with your AI coach</CardTitle>
              <CardBody>
                Ask questions, get plain-language feedback on your trades, and learn
                what to try differently next time.
              </CardBody>
            </Card>
          </Grid>
        </Section>

        <Section>
          <Eyebrow>Who it's for</Eyebrow>
          <SectionTitle>Built for the curious, not the already-expert.</SectionTitle>
          <Grid>
            <Card>
              <CardTitle>First-time investors</CardTitle>
              <CardBody>
                If the markets feel intimidating, tickr is a safe place to get your
                bearings before any real money is involved.
              </CardBody>
            </Card>
            <Card>
              <CardTitle>Students &amp; self-learners</CardTitle>
              <CardBody>
                Pair structured lessons with real practice to make the concepts stick,
                at your own pace.
              </CardBody>
            </Card>
            <Card>
              <CardTitle>Cautious returners</CardTitle>
              <CardBody>
                Coming back to investing after a break? Rebuild your confidence and
                test a strategy without the pressure.
              </CardBody>
            </Card>
          </Grid>
        </Section>

        <Section>
          <Eyebrow>Why we built it this way</Eyebrow>
          <SectionTitle>The principles behind tickr.</SectionTitle>
          <ValuesList>
            <ValueItem>
              <Icon name="diamond" size={11} color={tk.gold} style={{ marginTop: 5, flexShrink: 0 }} />
              <ValueText>
                <strong>Practice before stakes</strong>
                <span>
                  You learn investing the same way you learn anything else — by trying,
                  observing, and adjusting. We let you do that without the financial risk.
                </span>
              </ValueText>
            </ValueItem>
            <ValueItem>
              <Icon name="diamond" size={11} color={tk.gold} style={{ marginTop: 5, flexShrink: 0 }} />
              <ValueText>
                <strong>Honest by default</strong>
                <span>
                  No hype, no guaranteed-returns nonsense. We're a learning tool, and we
                  say so clearly. Where data is simulated, we label it.
                </span>
              </ValueText>
            </ValueItem>
            <ValueItem>
              <Icon name="diamond" size={11} color={tk.gold} style={{ marginTop: 5, flexShrink: 0 }} />
              <ValueText>
                <strong>Understanding over guessing</strong>
                <span>
                  Every feature is designed to explain the "why," so you leave with
                  judgment you can use — not just a result you got lucky with.
                </span>
              </ValueText>
            </ValueItem>
          </ValuesList>
        </Section>

        <Section>
          <Eyebrow>The team</Eyebrow>
          <SectionTitle>A small team that cares about getting this right.</SectionTitle>
          <Body>
            We're a focused group of builders, educators, and market enthusiasts who
            wished a product like this existed when we were starting out — so we made it.
          </Body>
          <TeamGrid>
            <TeamMember>
              <AppImage
                src="/images/team.jpg"
                alt="Portrait of a tickr team member"
                ratio="1"
                rounded={8}
              />
              <TeamName>Product &amp; Design</TeamName>
              <TeamRole>Building the experience</TeamRole>
            </TeamMember>
            <TeamMember>
              <AppImage
                src="/images/team.jpg"
                alt="Portrait of a tickr team member"
                ratio="1"
                rounded={8}
              />
              <TeamName>Engineering</TeamName>
              <TeamRole>Making it fast and reliable</TeamRole>
            </TeamMember>
            <TeamMember>
              <AppImage
                src="/images/team.jpg"
                alt="Portrait of a tickr team member"
                ratio="1"
                rounded={8}
              />
              <TeamName>Learning &amp; Content</TeamName>
              <TeamRole>Keeping lessons clear and honest</TeamRole>
            </TeamMember>
          </TeamGrid>
        </Section>

        <CTASection>
          <CTATitle>Ready to learn by doing?</CTATitle>
          <CTABody>
            Create a free account and start paper trading today. No deposit, no risk —
            just a place to build real investing skills.
          </CTABody>
          <CTAButtonRow>
            <PrimaryButton to="/signup">
              Create your free account
              <Icon name="arrow-right" size={16} />
            </PrimaryButton>
            <SecondaryButton to="/learn">
              <Icon name="book" size={16} />
              Browse the lessons
            </SecondaryButton>
          </CTAButtonRow>
          <FinePrint>
            tickr is an educational paper-trading product. Nothing here is financial advice.
          </FinePrint>
        </CTASection>
      </Inner>
    </Wrapper>
  );
}
