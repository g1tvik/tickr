import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { marbleWhite, marbleDarkGray, marbleGold } from "../marblePalette";
import { useNavbar } from "../context/NavbarContext";
import { api } from "../services/api";
import AppImage from "../components/AppImage";
import useReducedMotion from "../hooks/useReducedMotion";
import { useSEO, SEO_CONFIG } from "../lib/seo";
import tk, { label, mono } from "../theme/terminal";
import Icon from "../components/Icon";

// ============ ANIMATIONS ============
const pulse = keyframes`
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.05); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(60px); }
  to { opacity: 1; transform: translateY(0); }
`;

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
`;

const dotBlinkGlow = keyframes`
  0%, 100% { opacity: 1; box-shadow: 0 0 10px rgba(214, 26, 60, 0.7); }
  50% { opacity: 0.25; box-shadow: 0 0 4px rgba(214, 26, 60, 0.35); }
`;

// Starfield texture: small varied stars for a night-sky feel
const polkaDotPatternSvg = (() => {
  const w = 220, h = 220;
  const starColor = '238, 230, 208'; // warm lunar white
  const stars = [
    [18, 26, 1.2, 0.38], [52, 44, 1.6, 0.55], [88, 22, 1.1, 0.32],
    [130, 36, 1.7, 0.62], [176, 18, 1.3, 0.41], [208, 42, 1.0, 0.28],
    [30, 102, 1.5, 0.48], [72, 84, 1.1, 0.33], [116, 112, 1.8, 0.66],
    [162, 96, 1.2, 0.4], [198, 118, 1.4, 0.5], [42, 168, 1.0, 0.27],
    [96, 182, 1.6, 0.58], [148, 172, 1.2, 0.36], [188, 196, 1.7, 0.63],
    [214, 162, 1.1, 0.31],
  ];
  const circles = stars.map(([cx, cy, r, a]) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(${starColor}, ${a})"/>`
  ).join('');
  const raw = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${circles}</svg>`;
  const encoded = encodeURIComponent(raw).replace(/'/g, '%27');
  return `url("data:image/svg+xml,${encoded}")`;
})();

const PolkaDotOverlay = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image: ${polkaDotPatternSvg};
  background-repeat: repeat;
  background-position: 0 0;
  filter: blur(0.65px);
  transition: opacity 0.25s ease-out;
  opacity: ${props => props.$opacity};
`;

// Mask reveal for hero text words
const maskReveal = keyframes`
  from {
    transform: translateY(110%);
  }
  to {
    transform: translateY(0%);
  }
`;

// Film grain overlay
const grainShift = keyframes`
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-5%, -10%); }
  20% { transform: translate(-15%, 5%); }
  30% { transform: translate(7%, -25%); }
  40% { transform: translate(-5%, 25%); }
  50% { transform: translate(-15%, 10%); }
  60% { transform: translate(15%, 0%); }
  70% { transform: translate(0%, 15%); }
  80% { transform: translate(3%, 35%); }
  90% { transform: translate(-10%, 10%); }
`;

const FilmGrain = styled.div`
  position: fixed;
  top: -50%;
  left: -50%;
  right: -50%;
  bottom: -50%;
  width: 200%;
  height: 200%;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.012;
  animation: ${grainShift} 8s steps(10) infinite;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
`;

// Custom cursor
const CursorDot = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 12px;
  height: 12px;
  background: ${marbleGold};
  border-radius: 50%;
  pointer-events: none;
  z-index: 99999;
  mix-blend-mode: difference;
  transition: width 0.25s ease, height 0.25s ease, opacity 0.25s ease;

  &.hovering {
    width: 40px;
    height: 40px;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const CursorRing = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 40px;
  height: 40px;
  border: 1.5px solid ${marbleGold};
  border-radius: 50%;
  pointer-events: none;
  z-index: 99998;
  opacity: 0.5;
  transition: width 0.3s ease, height 0.3s ease, opacity 0.3s ease, border-color 0.3s ease;

  &.hovering {
    width: 60px;
    height: 60px;
    opacity: 0.3;
    border-color: ${marbleWhite};
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

// ============ MAGNETIC BUTTON WRAPPER ============
function MagneticButton({ children }) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();

  const handleMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'translate(0px, 0px)';
  }, []);

  // Respect reduced motion: render the child untouched (no magnetic transform).
  if (reduceMotion) {
    return children;
  }

  return React.cloneElement(children, {
    ref,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    style: { ...children.props.style, transition: 'transform 0.35s cubic-bezier(0.23, 1, 0.32, 1)' },
  });
}

// Hero text mask reveal wrapper
const MaskWord = styled.span`
  display: inline-block;
  overflow: hidden;
  vertical-align: bottom;
  padding-bottom: 4px;

  & > span {
    display: inline-block;
    transform: translateY(110%);
    animation: ${maskReveal} 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    animation-delay: ${props => props.$delay || '0s'};
  }
`;

const StatValue = styled.h2`
  font-family: ${tk.fontMono};
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  font-size: clamp(2.4rem, 5vw, 3.2rem);
  font-weight: 500;
  line-height: 1;
  margin: 0 0 10px;
  color: ${props => (props.$isGold ? tk.goldBright : tk.text)};
`;

// Monospace tabular number — the data signature across the page.
const Num = styled.span`
  font-family: ${tk.fontMono};
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
`;

// Floating accent elements
const FloatingAccent = styled.div`
  position: absolute;
  pointer-events: none;
  transition: transform 0.1s ease-out;
  z-index: 1;
`;

const GoldDot = styled(FloatingAccent)`
  width: ${props => props.$size || '8px'};
  height: ${props => props.$size || '8px'};
  border-radius: 50%;
  background: ${marbleGold};
  opacity: ${props => props.$opacity || 0.6};
`;

const GoldLine = styled(FloatingAccent)`
  width: ${props => props.$width || '60px'};
  height: 2px;
  background: linear-gradient(90deg, transparent, ${marbleGold}, transparent);
  opacity: ${props => props.$opacity || 0.4};
`;

const GoldRing = styled(FloatingAccent)`
  width: ${props => props.$size || '40px'};
  height: ${props => props.$size || '40px'};
  border-radius: 50%;
  border: 2px solid ${marbleGold};
  opacity: ${props => props.$opacity || 0.3};
`;

const SubtleCross = styled(FloatingAccent)`
  width: 20px;
  height: 20px;
  opacity: ${props => props.$opacity || 0.25};
  
  &::before, &::after {
    content: '';
    position: absolute;
    background: ${marbleGold};
  }
  
  &::before {
    width: 100%;
    height: 2px;
    top: 50%;
    transform: translateY(-50%);
  }
  
  &::after {
    width: 2px;
    height: 100%;
    left: 50%;
    transform: translateX(-50%);
  }
`;

// Cascading elements container - fixed position overlay
const CascadeContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 5;
  overflow: hidden;
`;

const CascadeElement = styled.div`
  position: absolute;
  transition: transform 0.05s linear;
`;

const ScreenCascadeWrapper = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 24px;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
`;

// ============ STYLED COMPONENTS ============
const PageWrapper = styled.div`
  min-height: 100vh;
  background: ${tk.bg};
  border-top: 1px solid ${tk.goldHairFaint};
  overflow-x: hidden;
  color: ${tk.text};
`;

const HeroSection = styled.section`
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  align-items: center;
  position: relative;
  perspective: 1000px;
  overflow: hidden;
  background: transparent;
  z-index: 1;
  gap: 40px;
  padding: 0 8vw;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    padding: 80px 24px 60px;
    gap: 60px;
  }
`;

const HeroContent = styled.div`
  text-align: left;
  z-index: 10;
  max-width: 560px;
  justify-self: start;

  @media (max-width: 980px) {
    text-align: center;
    justify-self: center;
  }
`;

const BadgeDot = styled.span`
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #D61A3C;
  flex-shrink: 0;
  align-self: center;
  transform: translateY(-0.2px);
  animation: ${dotBlinkGlow} 1.2s ease-in-out 3 forwards;
`;

const BadgeBullet = styled.span`
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: ${tk.gold};
  flex-shrink: 0;
  vertical-align: middle;
  margin: 0 4px;
  transform: translateY(-0.5px);
`;

const BadgeText = styled.span`
  color: ${tk.text};
  font-weight: 600;
  ${props => props.$blink && css`animation: ${blink} 0.5s ease-in-out infinite;`}
`;

const Badge = styled.div`
  font-family: ${tk.fontBody};
  text-transform: lowercase;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: ${tk.surface};
  border: 1px solid ${tk.hairStrong};
  padding: 7px 14px;
  border-radius: ${tk.rSm}px;
  font-size: 0.78rem;
  margin-bottom: 23px;
  opacity: 0;
  animation: ${slideUp} 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0s forwards;
`;

const HeroTitle = styled.h1`
  font-family: ${tk.fontHeading};
  font-size: clamp(2rem, 6vw, 3rem);
  font-weight: 500;
  line-height: 1.1;
  margin-bottom: 24px;
  color: ${tk.text};
  letter-spacing: -0.01em;
`;

const HeroSubtitle = styled.p`
  font-family: ${tk.fontBody};
  font-size: clamp(1rem, 1.4vw, 1.2rem);
  color: ${tk.muted};
  max-width: 520px;
  margin: 0 0 40px;
  line-height: 1.6;
  opacity: 0;
  animation: ${slideUp} 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.7s forwards;

  @media (max-width: 980px) {
    margin: 0 auto 40px;
  }
`;

const CTAGroup = styled.div`
  display: flex;
  gap: 16px;
  justify-content: flex-start;
  flex-wrap: wrap;
  opacity: 0;
  animation: ${slideUp} 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.9s forwards;

  @media (max-width: 980px) {
    justify-content: center;
  }
`;

const PrimaryButton = styled(Link)`
  font-family: ${tk.fontBody};
  background: ${tk.gold};
  color: #1F1F1F;
  padding: 14px 28px;
  border-radius: ${tk.rSm}px;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.02em;
  text-decoration: none;
  transition: background 0.2s ease;

  &:hover {
    color: #1F1F1F;
    background: ${tk.goldBright};
  }

  span {
    color: ${tk.goldDim};
    font-size: 0.85rem;
  }
`;

const SecondaryButton = styled(Link)`
  font-family: ${tk.fontBody};
  background: transparent;
  color: ${tk.text};
  padding: 14px 28px;
  border-radius: ${tk.rSm}px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  border: 1px solid ${tk.hairStrong};
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: ${tk.surface};
    border-color: ${tk.gold};
    color: ${tk.text};
  }
`;

const GlowOrb = styled.div`
  position: absolute;
  border-radius: 50%;
  background: ${props => props.$color || `radial-gradient(circle, ${marbleGold}33, transparent 70%)`};
  animation: ${pulse} ${props => props.$duration || '4s'} ease-in-out infinite;
  filter: blur(40px);
`;

// ─── HERO PREVIEW (Alpaca-style layered composition) ─────────────────────────
const HeroPreviewWrap = styled.div`
  position: relative;
  width: 100%;
  max-width: 460px;
  justify-self: center;
  opacity: 0;
  animation: ${slideUp} 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;

  @media (max-width: 980px) {
    max-width: 520px;
  }
`;

// One flat hairline-ruled panel — replaces the floating 3D glass-card stack.
const PreviewPanel = styled.div`
  background: ${tk.surface};
  border: 1px solid ${tk.hair};
  border-radius: ${tk.r}px;
  overflow: hidden;
  color: ${tk.text};
`;

const ChartCard = styled.div`
  padding: 18px 20px 16px;
  border-bottom: 1px solid ${tk.hair};
  color: ${tk.text};
`;

const ChartCardHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const SymbolBlock = styled.div`
  display: flex;
  align-items: baseline;
  gap: 10px;

  .ticker {
    font-family: ${tk.fontMono};
    font-variant-numeric: tabular-nums;
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: ${tk.text};
  }
  .name {
    font-family: ${tk.fontBody};
    font-size: 0.7rem;
    color: ${tk.muted};
    letter-spacing: 0.02em;
  }
`;

const PriceBlock = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;

  .price {
    font-family: ${tk.fontMono};
    font-variant-numeric: tabular-nums;
    font-size: 1rem;
    font-weight: 600;
    color: ${tk.text};
  }
  .change {
    font-family: ${tk.fontMono};
    font-variant-numeric: tabular-nums;
    font-size: 0.72rem;
    color: ${tk.up};
    font-weight: 600;
  }
`;

const TimeframeRow = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 12px;

  span {
    font-family: ${tk.fontMono};
    font-variant-numeric: tabular-nums;
    font-size: 0.65rem;
    padding: 3px 8px;
    border-radius: ${tk.rXs}px;
    color: ${tk.muted};
    letter-spacing: 0.04em;
  }
  span.active {
    background: ${tk.raised};
    color: ${tk.text};
    font-weight: 600;
  }
`;

const OrderCard = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${tk.hair};
  color: ${tk.text};

  .label {
    font-family: ${tk.fontBody};
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: ${tk.muted};
    margin-bottom: 6px;
  }
  .heading {
    font-family: ${tk.fontMono};
    font-variant-numeric: tabular-nums;
    font-size: 0.9rem;
    font-weight: 600;
    color: ${tk.text};
    margin-bottom: 12px;
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 0;
    border-top: 1px solid ${tk.hair};
    font-size: 0.72rem;
  }
  .row span:first-child {
    font-family: ${tk.fontBody};
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.62rem;
    color: ${tk.muted};
  }
  .row span:last-child {
    font-family: ${tk.fontMono};
    font-variant-numeric: tabular-nums;
    color: ${tk.text};
    font-weight: 600;
  }
  .total {
    margin-top: 4px;
    padding-top: 10px;
    border-top: 1px solid ${tk.goldHairFaint};
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .total span:first-child {
    font-family: ${tk.fontBody};
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.62rem;
    color: ${tk.muted};
  }
  .total span:last-child {
    font-family: ${tk.fontMono};
    font-variant-numeric: tabular-nums;
    font-size: 0.95rem;
    color: ${tk.goldBright};
    font-weight: 600;
  }
  .cta {
    margin-top: 14px;
    background: ${tk.gold};
    color: #1F1F1F;
    border: none;
    width: 100%;
    padding: 9px 0;
    border-radius: ${tk.rSm}px;
    font-family: ${tk.fontBody};
    font-weight: 700;
    font-size: 0.74rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    cursor: default;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
`;

const CoachCard = styled.div`
  padding: 14px 20px 18px;
  color: ${tk.text};

  .label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: ${tk.fontBody};
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: ${tk.muted};
    margin-bottom: 8px;
  }
  .label .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${tk.gold};
  }
  .quote {
    font-family: ${tk.fontBody};
    font-size: 0.82rem;
    line-height: 1.5;
    color: ${tk.text};
  }
  .quote .accent {
    color: ${tk.goldBright};
    font-weight: 600;
  }
`;

// Fallback NVDA-like uptrend if the live API is unreachable (e.g. backend down).
// Stored as full OHLC objects to match the live shape.
const PLACEHOLDER_CANDLES = [
  [120, 122], [122, 121], [121, 124], [124, 126], [126, 125],
  [125, 128], [128, 127], [127, 131], [131, 129], [129, 132],
  [132, 134], [134, 133], [133, 136], [136, 135], [135, 138],
  [138, 137], [137, 140], [140, 138], [138, 141], [141, 143],
  [143, 142], [142, 144], [144, 143], [143, 145],
].map(([o, c], i) => ({
  o, c,
  h: Math.max(o, c) + 1.5 + (i % 3) * 0.4,
  l: Math.min(o, c) - 1.5 - ((i + 1) % 3) * 0.4,
}));

function MiniCandleChart({ candles = PLACEHOLDER_CANDLES }) {
  const W = 460;
  const H = 130;
  const padX = 8;
  const padY = 10;
  const slotW = (W - padX * 2) / Math.max(candles.length, 1);
  const bodyW = slotW * 0.6;

  const allValues = candles.flatMap(c => [c.l, c.h]);
  const minV = Math.min(...allValues);
  const maxV = Math.max(...allValues);
  const range = maxV - minV || 1;
  const yScale = (v) => H - padY - ((v - minV) / range) * (H - padY * 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="130" style={{ display: 'block' }}>
      {/* horizontal grid lines */}
      {[0.25, 0.5, 0.75].map((p, i) => (
        <line
          key={i}
          x1={padX}
          x2={W - padX}
          y1={padY + (H - padY * 2) * p}
          y2={padY + (H - padY * 2) * p}
          stroke={tk.hair}
          strokeWidth="1"
        />
      ))}
      {candles.map((cd, i) => {
        const x = padX + i * slotW + (slotW - bodyW) / 2;
        const isUp = cd.c >= cd.o;
        const bodyTop = yScale(Math.max(cd.o, cd.c));
        const bodyBottom = yScale(Math.min(cd.o, cd.c));
        const color = isUp ? tk.up : tk.down;
        return (
          <g key={i}>
            <line
              x1={x + bodyW / 2}
              x2={x + bodyW / 2}
              y1={yScale(cd.h)}
              y2={yScale(cd.l)}
              stroke={color}
              strokeWidth="1.2"
            />
            <rect
              x={x}
              y={bodyTop}
              width={bodyW}
              height={Math.max(bodyBottom - bodyTop, 1.5)}
              fill={color}
              rx="0.5"
            />
          </g>
        );
      })}
    </svg>
  );
}

// Feature Sections
const Section = styled.section`
  padding: 120px 20px;
  position: relative;
  overflow: hidden;
  background: transparent;
`;

const SectionInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

// Small-caps section eyebrow + hairline rule (replaces the centered light title).
const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 16px;
  font-family: ${tk.fontBody};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${tk.gold};
  text-align: left;
  margin: 0 0 20px;

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${tk.goldHairFaint};
  }
`;

const SectionSubtitle = styled.p`
  font-family: ${tk.fontHeading};
  text-align: left;
  color: ${tk.text};
  font-size: clamp(1.5rem, 3vw, 2.1rem);
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.2;
  max-width: 640px;
  margin: 0;
`;

// 3D Phone Mockup Section
const PhoneSection = styled.section`
  position: relative;
  min-height: 100vh;
  padding: 80px 20px 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  perspective: 2000px;
`;

const PhoneMockup = styled.div`
  width: 280px;
  height: 560px;
  background: ${tk.surface};
  border-radius: 28px;
  border: 1px solid ${tk.hairStrong};
  position: relative;
  z-index: 10;
  transform-style: preserve-3d;
  transition: transform 0.2s ease-out, opacity 0.15s ease-out;

  &::before {
    content: '';
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 22px;
    background: ${tk.inset};
    border-radius: 11px;
  }
`;

const PhoneScreen = styled.div`
  position: absolute;
  top: 50px;
  left: 12px;
  right: 12px;
  bottom: 50px;
  background: linear-gradient(180deg, ${tk.surface}, ${tk.inset});
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const PhoneContent = styled.div`
  position: relative;
  z-index: 1;
  text-align: center;
  
  img {
    display: block;
    max-width: 160px;
    max-height: 80px;
    width: auto;
    height: auto;
    object-fit: contain;
    margin: 0 auto 16px;
  }
  
  p {
    font-family: ${tk.fontBody};
    color: ${tk.text} !important;
    font-size: 0.9rem;
    margin-bottom: 8px;
  }
`;

const FloatingStats = styled.div`
  position: absolute;
  z-index: 30;
  background: ${tk.surface};
  border: 1px solid ${tk.hairStrong};
  border-radius: ${tk.r}px;
  padding: 14px 20px;
  transform-style: preserve-3d;
  transform: translateZ(60px);
  transition: opacity 0.15s ease-out;

  ${props => props.$position === 'left' && `
    left: -90px;
    top: 100px;
  `}

  ${props => props.$position === 'right' && `
    right: -90px;
    bottom: 150px;
  `}

  h5 {
    font-family: ${tk.fontMono};
    font-variant-numeric: tabular-nums;
    color: ${tk.goldBright};
    font-size: 1.4rem;
    font-weight: 500;
    margin: 0 0 2px;
  }

  span {
    font-family: ${tk.fontBody};
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: ${tk.muted};
  }
`;

// Subtle "Demo data" pill — shown when the preview is running on fallback data
const DemoPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: ${tk.fontBody};
  font-size: 0.55rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: ${tk.gold};
  background: transparent;
  border: 1px solid ${tk.goldHair};
  padding: 2px 7px;
  border-radius: ${tk.rXs}px;
  white-space: nowrap;

  &::before {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: ${tk.gold};
  }
`;

// ─── HOW IT WORKS ────────────────────────────────────────────────────────────
const StepsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  margin-top: 72px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const StepCard = styled.div`
  position: relative;
  background: ${tk.surface};
  border: 1px solid ${tk.hair};
  border-radius: ${tk.r}px;
  padding: 28px 26px;
  text-align: left;

  .num {
    font-family: ${tk.fontMono};
    font-variant-numeric: tabular-nums;
    font-size: 0.9rem;
    font-weight: 600;
    color: #1F1F1F;
    background: ${tk.gold};
    width: 34px;
    height: 34px;
    border-radius: ${tk.rSm}px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
  }
  h3 {
    font-family: ${tk.fontHeading};
    font-size: 1.2rem;
    font-weight: 500;
    color: ${tk.text};
    margin: 0 0 10px;
    letter-spacing: -0.01em;
  }
  p {
    font-family: ${tk.fontBody};
    font-size: 0.95rem;
    line-height: 1.6;
    color: ${tk.muted};
    margin: 0;
  }
`;

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const FaqList = styled.div`
  max-width: 760px;
  margin: 40px auto 0;
`;

const FaqItem = styled.details`
  border-top: 1px solid ${tk.hair};
  padding: 4px 0;

  &:last-child {
    border-bottom: 1px solid ${tk.hair};
  }

  summary {
    list-style: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 4px;
    font-family: ${tk.fontHeading};
    font-size: 1.05rem;
    font-weight: 500;
    color: ${tk.text};
    letter-spacing: -0.005em;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary .chev {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    color: ${tk.gold};
    transition: transform 0.25s ease;
  }
  &[open] summary .chev {
    transform: rotate(45deg);
  }
  .answer {
    font-family: ${tk.fontBody};
    font-size: 0.95rem;
    line-height: 1.65;
    color: ${tk.muted};
    padding: 0 4px 22px;
    margin: 0;
    max-width: 680px;
  }
`;

// ─── FINAL CTA BAND ──────────────────────────────────────────────────────────
const CtaBand = styled.section`
  position: relative;
  z-index: 5;
  padding: 100px 24px;
  text-align: center;
  background: ${tk.bg};
  border-top: 1px solid ${tk.goldHairFaint};

  h2 {
    font-family: ${tk.fontHeading};
    font-size: clamp(1.9rem, 5vw, 2.8rem);
    font-weight: 500;
    color: ${tk.text};
    margin: 0 0 18px;
    letter-spacing: -0.01em;
  }
  p {
    font-family: ${tk.fontBody};
    font-size: 1.05rem;
    color: ${tk.muted};
    max-width: 520px;
    margin: 0 auto 36px;
    line-height: 1.6;
  }
`;

const CtaButton = styled(Link)`
  font-family: ${tk.fontBody};
  display: inline-block;
  background: ${tk.gold};
  color: #1F1F1F;
  padding: 15px 40px;
  border-radius: ${tk.rSm}px;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.02em;
  text-decoration: none;
  transition: background 0.2s ease;

  &:hover {
    color: #1F1F1F;
    background: ${tk.goldBright};
  }
`;

// ─── FOOTER ──────────────────────────────────────────────────────────────────
const Footer = styled.footer`
  background: ${tk.bg};
  border-top: 1px solid ${tk.hair};
  padding: 64px 24px 36px;
`;

const FooterInner = styled.div`
  max-width: 1120px;
  margin: 0 auto;
`;

const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: 1.5fr repeat(3, 1fr);
  gap: 40px;
  padding-bottom: 48px;
  border-bottom: 1px solid ${tk.hair};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 36px;
  }
`;

const FooterBrand = styled.div`
  img {
    height: 28px;
    width: auto;
    display: block;
    margin-bottom: 16px;
  }
  p {
    font-family: ${tk.fontBody};
    font-size: 0.92rem;
    line-height: 1.6;
    color: ${tk.muted};
    max-width: 280px;
    margin: 0;
  }
`;

const FooterCol = styled.nav`
  h4 {
    font-family: ${tk.fontBody};
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: ${tk.gold};
    margin: 0 0 18px;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  a {
    font-family: ${tk.fontBody};
    font-size: 0.95rem;
    color: ${tk.muted};
    text-decoration: none;
    transition: color 0.2s ease;
  }
  a:hover {
    color: ${tk.text};
  }
`;

const FooterBottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 28px;

  p {
    font-family: ${tk.fontBody};
    font-size: 0.85rem;
    color: ${tk.muted};
    margin: 0;
  }
  .disclaimer {
    color: ${tk.faint};
  }
`;

// ============ COMPONENT ============
function Home({ isLoggedIn }) {
  useSEO(SEO_CONFIG.home);
  const reduceMotion = useReducedMotion();
  const { setNavbarBackground } = useNavbar();
  const containerRef = useRef(null);
  const statsRef = useRef(null);
  const heroRef = useRef(null);
  const phoneRef = useRef(null);
  const featuresRef = useRef(null);
  const footerRef = useRef(null);
  const cursorDotRef = useRef(null);
  const cursorRingRef = useRef(null);
  const cursorPos = useRef({ x: 0, y: 0 });
  const cursorTarget = useRef({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [windowHeight, setWindowHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);
  const [statsVisible, setStatsVisible] = useState(false);
  const [cursorHovering, setCursorHovering] = useState(false);
  const BADGE_FULL_TEXT = "now in beta • live paper trading";
  const [badgeText, setBadgeText] = useState("");
  const [badgeTypingDone, setBadgeTypingDone] = useState(false);
  const [badgeBlinking, setBadgeBlinking] = useState(false);

  // ─── Live NVDA preview data (falls back to placeholders if API unreachable) ──
  const [livePrice, setLivePrice] = useState(138.55);
  const [liveChange, setLiveChange] = useState(2.85);
  const [liveCandles, setLiveCandles] = useState(PLACEHOLDER_CANDLES);
  // True while the preview is showing placeholder/demo data (no live market keys).
  const [isDemoData, setIsDemoData] = useState(true);

  // Optional phone-screen artwork. We only mount the image once we've confirmed
  // it actually loads, so the branded fallback content stays visible otherwise.
  const [phoneArtReady, setPhoneArtReady] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setPhoneArtReady(true);
    img.onerror = () => setPhoneArtReady(false);
    img.src = '/images/phone-app.png';
    return () => { img.onload = null; img.onerror = null; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.getChartData('NVDA', '1D', 30)
      .then((res) => {
        if (cancelled || !res?.success || !res?.chartData?.candles?.length) return;
        const candles = res.chartData.candles;
        const last = candles[candles.length - 1];
        const prev = candles[candles.length - 2];
        if (last?.close != null) {
          setLivePrice(last.close);
          if (prev?.close) {
            setLiveChange(((last.close - prev.close) / prev.close) * 100);
          }
        }
        const tail = candles.slice(-24).map(c => ({
          o: c.open, c: c.close, h: c.high, l: c.low,
        }));
        if (tail.length) setLiveCandles(tail);
        // Backend marks synthetic responses with source:'demo' / demo:true when
        // live market keys are missing. Treat real responses as live.
        const demo = res.source === 'demo' || res.demo === true ||
          res.chartData?.source === 'demo' || res.chartData?.demo === true;
        setIsDemoData(Boolean(demo));
      })
      .catch(() => { /* keep placeholders (stays flagged as demo) */ });
    return () => { cancelled = true; };
  }, []);

  const fmtPrice  = (n) => `$${Number(n).toFixed(2)}`;
  const fmtChange = (n) => `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`;
  const changeColor = liveChange >= 0 ? '#22A55C' : '#E04848';

  // ─── AI coach message that fits whatever NVDA is doing right now ──────────
  // Voice: a finance professor explaining the moment. Neutral on direction,
  // proper trading vocabulary, conversational but not slangy.
  const renderCoachMessage = () => {
    const pct = liveChange;
    const abs = Math.abs(pct).toFixed(2);

    if (pct >= 3) {
      return (
        <>
          NVDA is up <span className="accent" style={mono}>{abs}%</span> today. strong sessions raise one of the classic trading questions: <span className="accent">take profits</span>, or let the position run? both have a defensible case.
        </>
      );
    }
    if (pct >= 0.5) {
      return (
        <>
          NVDA is modestly higher today. these small moves rarely make headlines, but <span className="accent">compounding gains</span> of this size are what build long-term portfolios.
        </>
      );
    }
    if (pct > -0.5) {
      return (
        <>
          NVDA is essentially flat today. low-volatility sessions are useful for <span className="accent">technical analysis</span>. patterns and support levels are easier to identify when price action is quiet.
        </>
      );
    }
    if (pct > -3) {
      return (
        <>
          NVDA is down today. down days are where conviction is tested. the question worth asking is whether <span className="accent">the underlying thesis</span> has changed, or only the price.
        </>
      );
    }
    return (
      <>
        NVDA is down <span className="accent" style={mono}>{abs}%</span> today, a significant move. before reacting, it is worth <span className="accent">investigating the cause</span>. most large single-day moves prove to be noise, but the exceptions are the ones that matter.
      </>
    );
  };

  // Badge typing: phase 1 "now in beta • ", pause (with blink), phase 2 "live paper trading"
  useEffect(() => {
    const startDelayMs = 350;
    const full = BADGE_FULL_TEXT;
    const afterBulletIndex = 14; // "now in beta • ".length — pause after the bullet
    const phase1Ms = 400;   // type "now in beta • "
    const pauseMs = 350;   // pause after bullet, text blinks during this
    const phase2Ms = 600;   // type "live paper trading"
    const totalTypingMs = phase1Ms + pauseMs + phase2Ms;

    let timeoutId;
    let rafId;

    timeoutId = setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const elapsed = now - start;
        if (elapsed >= totalTypingMs) {
          setBadgeText(full);
          setBadgeTypingDone(true);
          setBadgeBlinking(false);
          return;
        }
        let len;
        if (elapsed < phase1Ms) {
          setBadgeBlinking(false);
          len = Math.round((elapsed / phase1Ms) * afterBulletIndex);
        } else if (elapsed < phase1Ms + pauseMs) {
          setBadgeBlinking(true);
          len = afterBulletIndex;
        } else {
          setBadgeBlinking(false);
          const phase2Elapsed = elapsed - phase1Ms - pauseMs;
          len = afterBulletIndex + Math.round((phase2Elapsed / phase2Ms) * (full.length - afterBulletIndex));
        }
        len = Math.min(len, full.length);
        setBadgeText(full.slice(0, len));
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }, startDelayMs);
    return () => {
      clearTimeout(timeoutId);
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, []);

  // ---- Lenis smooth scroll ----
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  // ---- Custom cursor ----
  useEffect(() => {
    if (reduceMotion) return;
    const isTouchDevice = 'ontouchstart' in window;
    if (isTouchDevice) return;

    // Hide default cursor
    document.body.style.cursor = 'none';
    const styleTag = document.createElement('style');
    styleTag.textContent = 'a, button, [role="button"], input, select, textarea, label { cursor: none !important; }';
    document.head.appendChild(styleTag);

    const handleMouseMove = (e) => {
      cursorTarget.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseOver = (e) => {
      const el = e.target.closest('a, button, [role="button"], input, select, textarea, label');
      if (el) setCursorHovering(true);
    };

    const handleMouseOut = (e) => {
      const el = e.target.closest('a, button, [role="button"], input, select, textarea, label');
      if (el) setCursorHovering(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    let animId;
    const lerp = (a, b, n) => a + (b - a) * n;

    const animateCursor = () => {
      cursorPos.current.x = lerp(cursorPos.current.x, cursorTarget.current.x, 0.1725);
      cursorPos.current.y = lerp(cursorPos.current.y, cursorTarget.current.y, 0.1725);

      if (cursorDotRef.current) {
        const dotSize = cursorDotRef.current.classList.contains('hovering') ? 40 : 12;
        cursorDotRef.current.style.transform = `translate(${cursorTarget.current.x - dotSize / 2}px, ${cursorTarget.current.y - dotSize / 2}px)`;
      }
      if (cursorRingRef.current) {
        const ringSize = cursorRingRef.current.classList.contains('hovering') ? 60 : 40;
        cursorRingRef.current.style.transform = `translate(${cursorPos.current.x - ringSize / 2}px, ${cursorPos.current.y - ringSize / 2}px)`;
      }

      animId = requestAnimationFrame(animateCursor);
    };
    animId = requestAnimationFrame(animateCursor);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(animId);
      document.body.style.cursor = '';
      styleTag.remove();
    };
  }, [reduceMotion]);

  // Track scroll for 3D parallax effects.
  // When reduced motion is preferred we still track the resize (so layout stays
  // correct) but freeze scrollY at 0 so the page renders static.
  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    if (reduceMotion) {
      setScrollY(0);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }

    let rafId;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial call
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, [reduceMotion]);

  useEffect(() => {
    if (!statsRef.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setStatsVisible(entry.isIntersecting);
      },
      { threshold: 0.0 }
    );
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  // ─── Adaptive navbar: switch theme based on the section directly under it ──
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const sections = [
      { ref: heroRef,     theme: 'dark'  },
      { ref: phoneRef,    theme: 'dark'  },
      { ref: featuresRef, theme: 'light' },
      { ref: statsRef,    theme: 'dark'  },
      { ref: footerRef,   theme: 'dark'  },
    ].filter(s => s.ref.current);

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the section with the largest intersection — that's "under" the navbar
        const top = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!top) return;
        const theme = top.target.dataset.theme;
        if (theme === 'light') {
          setNavbarBackground('rgba(244, 241, 233, 0.92)', { theme: 'light' });
        } else {
          setNavbarBackground('transparent', { theme: 'dark' });
        }
      },
      // Trigger when the section's TOP edge crosses just under the navbar
      { rootMargin: '-64px 0px -60% 0px', threshold: [0, 0.1, 0.5] }
    );

    sections.forEach(s => observer.observe(s.ref.current));
    return () => observer.disconnect();
  }, [setNavbarBackground]);

  // Calculate scroll progress (0 to 1) for different sections
  // Hero fades over first screen
  const scrollProgress = Math.min(scrollY / windowHeight, 1);
  
  // Global scroll progress for continuous animations
  const totalScrollProgress = scrollY / (document.body.scrollHeight - windowHeight || 1);
  

  // Cascading elements data - different sizes, positions, and speeds
  const cascadeElements = [
    { x: 5, size: 8, speed: 0.8, delay: 0 },
    { x: 15, size: 6, speed: 1.2, delay: 0.1 },
    { x: 25, size: 10, speed: 0.6, delay: 0.2 },
    { x: 35, size: 5, speed: 1.4, delay: 0.05 },
    { x: 45, size: 7, speed: 0.9, delay: 0.15 },
    { x: 55, size: 9, speed: 1.1, delay: 0.25 },
    { x: 65, size: 6, speed: 0.7, delay: 0.08 },
    { x: 75, size: 8, speed: 1.3, delay: 0.18 },
    { x: 85, size: 5, speed: 1.0, delay: 0.12 },
    { x: 95, size: 7, speed: 0.85, delay: 0.22 },
    { x: 10, size: 4, speed: 1.5, delay: 0.3 },
    { x: 30, size: 6, speed: 0.75, delay: 0.35 },
    { x: 50, size: 8, speed: 1.15, delay: 0.02 },
    { x: 70, size: 5, speed: 0.95, delay: 0.28 },
    { x: 90, size: 7, speed: 1.25, delay: 0.07 },
  ];

  const polkaDotOpacity = Math.max(0, 0.16 - scrollY / 420);

  return (
    <PageWrapper ref={containerRef}>
      {/* Polka dots: scattered, fade out as you scroll so content clears into view */}
      <PolkaDotOverlay $opacity={polkaDotOpacity} />

      {/* Heavy decorative motion is skipped entirely when reduced motion is preferred */}
      {!reduceMotion && (
        <>
          {/* ============ FILM GRAIN OVERLAY ============ */}
          <FilmGrain />

          {/* ============ CUSTOM CURSOR ============ */}
          <CursorDot ref={cursorDotRef} className={cursorHovering ? 'hovering' : ''} />
          <CursorRing ref={cursorRingRef} className={cursorHovering ? 'hovering' : ''} />

          {/* ============ CASCADING ELEMENTS ============ */}
          <CascadeContainer>
            {cascadeElements.map((el, i) => {
              // Calculate Y position based on scroll - creates falling effect
              const fallDistance = (scrollY * el.speed + el.delay * 1000) % (windowHeight + 200);
              const opacity = fallDistance < 100 ? fallDistance / 100 :
                             fallDistance > windowHeight ? Math.max(0, 1 - (fallDistance - windowHeight) / 200) :
                             0.4;

              return (
                <CascadeElement
                  key={i}
                  style={{
                    left: `${el.x}%`,
                    top: `${fallDistance - 100}px`,
                    width: `${el.size}px`,
                    height: `${el.size}px`,
                    borderRadius: '50%',
                    background: marbleGold,
                    opacity: opacity * 0.5,
                    transform: `rotate(${scrollY * el.speed * 0.5}deg)`
                  }}
                />
              );
            })}
          </CascadeContainer>
        </>
      )}

      {/* ============ HERO SECTION ============ */}
      <HeroSection ref={heroRef} data-theme="dark">
        {/* Glow Orbs — decorative; only render when motion is allowed */}
        {!reduceMotion && (
          <>
            <GlowOrb
              style={{ width: 600, height: 600, top: '-200px', left: '-200px' }}
              $color={`radial-gradient(circle, ${marbleGold}22, transparent 70%)`}
              $duration="6s"
            />
            <GlowOrb
              style={{ width: 500, height: 500, bottom: '-150px', right: '-150px' }}
              $color={`radial-gradient(circle, ${marbleGold}1a, transparent 70%)`}
              $duration="8s"
            />
          </>
        )}

        {/* Hero Content */}
        <HeroContent style={{
          transform: `translateY(${scrollProgress * 100}px)`,
          opacity: Math.max(1 - scrollProgress * 1.5, 0)
        }}>
          <Badge>
            <BadgeText $blink={badgeBlinking}>
              {(() => {
                const parts = badgeText.split('•');
                return parts.length > 1 ? (
                  <>{parts[0]}<BadgeBullet aria-hidden />{parts.slice(1).join('•')}</>
                ) : (
                  badgeText
                );
              })()}
            </BadgeText>
            {badgeTypingDone && <BadgeDot aria-hidden />}
          </Badge>
          
          <HeroTitle>
            <MaskWord $delay="0.1s"><span>investing,</span></MaskWord>{' '}
            <MaskWord $delay="0.2s"><span>explained.</span></MaskWord>
          </HeroTitle>
          
          <HeroSubtitle>
          interactive lessons and AI-guided market simulations
          </HeroSubtitle>
          
          <CTAGroup>
            <MagneticButton>
              <PrimaryButton to={isLoggedIn ? "/dashboard" : "/signup"}>
                start here
              </PrimaryButton>
            </MagneticButton>
            <MagneticButton>
              <SecondaryButton to="/about">
                about us
              </SecondaryButton>
            </MagneticButton>
          </CTAGroup>
        </HeroContent>

        {/* ============ HERO PREVIEW (one flat hairline panel) ============ */}
        <HeroPreviewWrap style={{
          transform: `translateY(${scrollProgress * 60}px)`,
          opacity: Math.max(1 - scrollProgress * 1.4, 0),
        }}>
          <PreviewPanel>
            <ChartCard>
              <ChartCardHeader>
                <SymbolBlock>
                  <span className="ticker">NVDA</span>
                  <span className="name">NVIDIA Corp.</span>
                  {isDemoData && <DemoPill title="Sample data shown while live market keys are unavailable">Demo data</DemoPill>}
                </SymbolBlock>
                <PriceBlock>
                  <span className="price">{fmtPrice(livePrice)}</span>
                  <span className="change" style={{ color: changeColor }}>{fmtChange(liveChange)}</span>
                </PriceBlock>
              </ChartCardHeader>
              <MiniCandleChart candles={liveCandles} />
              <TimeframeRow>
                <span>1D</span>
                <span className="active">1W</span>
                <span>1M</span>
                <span>3M</span>
                <span>1Y</span>
                <span>ALL</span>
              </TimeframeRow>
            </ChartCard>

            <OrderCard>
              <div className="label">paper order</div>
              <div className="heading">buy NVDA</div>
              <div className="row"><span>shares</span><span>10</span></div>
              <div className="row"><span>type</span><span>market</span></div>
              <div className="row"><span>est. price</span><span>{fmtPrice(livePrice)}</span></div>
              <div className="total"><span>total</span><span>{fmtPrice(livePrice * 10)}</span></div>
              <button className="cta">review order <Icon name="arrow-right" size={13} /></button>
            </OrderCard>

            <CoachCard>
              <div className="label"><span className="dot" />ai coach</div>
              <div className="quote">
                {renderCoachMessage()}
              </div>
            </CoachCard>
          </PreviewPanel>
        </HeroPreviewWrap>

      </HeroSection>

      {/* ============ 3D PHONE SECTION ============ */}
      <PhoneSection ref={phoneRef} data-theme="dark" style={{ position: 'relative', zIndex: 10 }}>
        <div style={{ position: 'relative', transformStyle: 'preserve-3d' }}>
          <PhoneMockup
            style={{
              transform: 'perspective(1200px) rotateX(2deg)'
            }}
          >
            <PhoneScreen>
              {!reduceMotion && (
                <ScreenCascadeWrapper>
                  {cascadeElements.map((el, i) => {
                    const screenCycle = 380;
                    const fallDistance = (scrollY * el.speed + el.delay * 1000) % (screenCycle + 120);
                    const top = fallDistance - 60;
                    const opacity = top < 0 ? Math.max(0, 1 + top / 60) * 0.5 : top > screenCycle ? Math.max(0, 1 - (top - screenCycle) / 60) * 0.5 : 0.5;
                    return (
                      <CascadeElement
                        key={`screen-${i}`}
                        style={{
                          left: `${el.x}%`,
                          top: `${top}px`,
                          width: `${el.size}px`,
                          height: `${el.size}px`,
                          borderRadius: '50%',
                          background: marbleGold,
                          opacity: opacity * 0.6,
                          transform: `rotate(${scrollY * el.speed * 0.5}deg)`
                        }}
                      />
                    );
                  })}
                </ScreenCascadeWrapper>
              )}
              {/* Optional real app screenshot — only mounts once it has loaded,
                  so the branded content below is the graceful default. */}
              {phoneArtReady && (
                <AppImage
                  src="/images/phone-app.png"
                  alt="tickr mobile app preview"
                  rounded={0}
                  objectFit="cover"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    aspectRatio: 'auto',
                    borderRadius: 0,
                    background: 'transparent',
                    zIndex: 2,
                  }}
                />
              )}
              <PhoneContent>
                <img src="/marbleWhitelogo.png" alt="tickr logo" />
                <p style={{ color: tk.text }}>your personal trading mentor</p>
                <div style={{
                  marginTop: '20px',
                  background: tk.inset,
                  border: `1px solid ${tk.hair}`,
                  borderRadius: `${tk.rSm}px`,
                  padding: '12px'
                }}>
                  <Num style={{ color: tk.goldBright, fontSize: '1.5rem', fontWeight: 500, display: 'block' }}>
                    $10K
                  </Num>
                  <div style={{ ...label, marginTop: 4, color: tk.muted }}>
                    Starting balance
                  </div>
                </div>
              </PhoneContent>
            </PhoneScreen>
          </PhoneMockup>
          
          <FloatingStats $position="left">
            <h5>$10K</h5>
            <span>Starting balance</span>
          </FloatingStats>

          <FloatingStats $position="right">
            <h5>25+</h5>
            <span>Lessons</span>
          </FloatingStats>
        </div>
      </PhoneSection>

      {/* ============ FEATURES SECTION (light cream — navbar adapts) ============ */}
      <section
        ref={featuresRef}
        data-theme="light"
        style={{
          position: 'relative',
          zIndex: 5,
          background: '#F4F1E9',
          padding: '140px 20px',
          color: marbleDarkGray,
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: '0.75rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(34,34,34,0.5)',
            marginBottom: '20px',
            textAlign: 'center',
          }}>
            why tickr
          </div>
          <h2 style={{
            fontFamily: "'Creato Display', 'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            textAlign: 'center',
            margin: '0 0 18px',
            color: marbleDarkGray,
          }}>
            built for the way you'd actually learn to invest.
          </h2>
          <p style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: '1.05rem',
            lineHeight: 1.65,
            color: 'rgba(34,34,34,0.65)',
            maxWidth: '640px',
            margin: '0 auto 80px',
            textAlign: 'center',
          }}>
            real markets, fake money, real coaching. tickr meets you wherever you are and walks you through the rest.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '36px 48px',
            maxWidth: '880px',
            margin: '0 auto',
          }}>
            {[
              { title: 'real market data', desc: 'live prices and candles powered by Alpaca — same data the pros see.', icon: '/images/feature-data.png' },
              { title: 'paper trading', desc: 'start with $10,000 in virtual money. every win and loss is real, only the dollars aren\'t.', icon: '/images/feature-trade.png' },
              { title: 'guided lessons', desc: 'short, interactive modules build from "what is a stock" to risk management.', icon: '/images/feature-learn.png' },
              { title: 'ai coach', desc: 'a personal tutor that reads your portfolio and suggests the next lesson.', icon: '/images/feature-coach.png' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '14px' }}>
                {/* Gold check is the default; an optional icon image overlays it
                    when present and hides itself (revealing the check) if absent. */}
                <div style={{
                  position: 'relative',
                  flexShrink: 0,
                  width: '24px',
                  height: '24px',
                  borderRadius: `${tk.rSm}px`,
                  background: marbleGold,
                  color: marbleDarkGray,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '2px',
                  overflow: 'hidden',
                }}>
                  <Icon name="check" size={14} />
                  <img
                    src={f.icon}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
                <div>
                  <div style={{
                    fontFamily: "'Creato Display', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                    fontSize: '1.15rem',
                    fontWeight: 500,
                    color: marbleDarkGray,
                    marginBottom: '6px',
                    letterSpacing: '-0.005em',
                  }}>
                    {f.title}
                  </div>
                  <div style={{
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    fontSize: '0.95rem',
                    lineHeight: 1.55,
                    color: 'rgba(34,34,34,0.62)',
                  }}>
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ STATS SECTION ============ */}
      <Section ref={statsRef} data-theme="dark" style={{ background: 'transparent', position: 'relative', overflow: 'hidden', padding: '160px 20px' }}>
        {/* Subtle accents — decorative; only render when motion is allowed */}
        {!reduceMotion && (
          <>
            <GoldDot
              $size="10px"
              $opacity={0.4}
              style={{
                top: '20%',
                left: '15%',
                transform: `translateY(${Math.cos(totalScrollProgress * Math.PI * 2.5) * 25}px)`
              }}
            />
            <GoldDot
              $size="8px"
              $opacity={0.25}
              style={{
                bottom: '25%',
                right: '10%',
                transform: `translateY(${Math.sin(totalScrollProgress * Math.PI * 2.5) * 20}px)`
              }}
            />
            <GoldLine
              $width="100px"
              $opacity={0.25}
              style={{
                top: '50%',
                right: '5%',
                transform: `translateY(${Math.sin(totalScrollProgress * Math.PI * 3) * 15}px) rotate(${-30 + totalScrollProgress * 15}deg)`
              }}
            />
            <SubtleCross
              $opacity={0.18}
              style={{
                top: '30%',
                left: '6%',
                transform: `rotate(${totalScrollProgress * 45}deg)`
              }}
            />
          </>
        )}

        <SectionInner>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
            <span style={label}>by the numbers</span>
            <span style={{ flex: 1, height: 1, background: tk.hair }} />
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '40px',
            textAlign: 'left'
          }}>
            <div>
              <StatValue $isGold $animate={statsVisible}>$10K</StatValue>
              <p style={{ ...label, margin: 0 }}>Virtual Trading Balance</p>
            </div>
            <div>
              <StatValue>25+</StatValue>
              <p style={{ ...label, margin: 0 }}>Interactive Lessons</p>
            </div>
            <div>
              <StatValue $isGold $animate={statsVisible}>24/7</StatValue>
              <p style={{ ...label, margin: 0 }}>AI Coach Access</p>
            </div>
            <div>
              <StatValue>$0</StatValue>
              <p style={{ ...label, margin: 0 }}>Risk While Learning</p>
            </div>
          </div>
        </SectionInner>
      </Section>

      {/* ============ HOW IT WORKS ============ */}
      <Section data-theme="dark" style={{ background: 'transparent', padding: '120px 20px 100px' }}>
        <SectionInner>
          <SectionTitle>how it works</SectionTitle>
          <SectionSubtitle>
            three steps from curious to confident — at your own pace, with zero risk.
          </SectionSubtitle>
          <StepsGrid>
            <StepCard>
              <div className="num" aria-hidden="true">1</div>
              <h3>learn the basics</h3>
              <p>start with short, interactive lessons that build from "what is a stock?" to reading charts and managing risk.</p>
            </StepCard>
            <StepCard>
              <div className="num" aria-hidden="true">2</div>
              <h3>practice with $10K paper money</h3>
              <p>put it into action on real market data with a $10,000 virtual balance. real prices, real lessons, none of the risk.</p>
            </StepCard>
            <StepCard>
              <div className="num" aria-hidden="true">3</div>
              <h3>get AI coaching</h3>
              <p>your AI coach reviews your trades and progress, then points you to the next lesson or habit to work on.</p>
            </StepCard>
          </StepsGrid>
        </SectionInner>
      </Section>

      {/* ============ FAQ ============ */}
      <Section data-theme="dark" style={{ background: 'transparent', padding: '40px 20px 110px' }}>
        <SectionInner>
          <SectionTitle>questions, answered</SectionTitle>
          <SectionSubtitle>
            the short version of what people ask before signing up.
          </SectionSubtitle>
          <FaqList>
            {[
              {
                q: 'is this real money?',
                a: 'no. tickr is paper trading only — you practice with a $10,000 virtual balance, so you can learn and make mistakes without risking a cent of real money.',
              },
              {
                q: 'do I need any experience?',
                a: 'none at all. the lessons start from the very beginning — what a stock is, how prices move, how to read a chart — and build up from there.',
              },
              {
                q: 'is it free?',
                a: 'yes. you can create an account and start learning and paper-trading for free. tickr is currently in beta.',
              },
              {
                q: 'what market data do you use?',
                a: 'live prices and candles come from Alpaca, the same market data used by real brokerages. when live keys are unavailable we clearly label sample data as "demo".',
              },
              {
                q: 'will I lose real money?',
                a: 'never on tickr. everything here is simulated. the goal is to build the skills and confidence to invest for real, on your own terms, when you are ready.',
              },
            ].map((item, i) => (
              <FaqItem key={i}>
                <summary>
                  {item.q}
                  <svg className="chev" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </summary>
                <p className="answer">{item.a}</p>
              </FaqItem>
            ))}
          </FaqList>
        </SectionInner>
      </Section>

      {/* ============ FINAL CTA BAND ============ */}
      <CtaBand data-theme="dark">
        <h2>start learning to invest — free</h2>
        <p>
          join the beta, get your $10,000 paper portfolio, and let an AI coach guide you from your first lesson to your first trade.
        </p>
        <MagneticButton>
          <CtaButton to={isLoggedIn ? "/dashboard" : "/signup"}>
            {isLoggedIn ? "go to dashboard" : "get started free"}
          </CtaButton>
        </MagneticButton>
      </CtaBand>

      {/* ============ FOOTER ============ */}
      <Footer ref={footerRef} data-theme="dark">
        <FooterInner>
          <FooterGrid>
            <FooterBrand>
              <img src="/marbleWhitelogo.png" alt="tickr logo" />
              <p>learn to invest the way you'd actually want to — real markets, virtual money, and an AI coach in your corner.</p>
            </FooterBrand>

            <FooterCol aria-label="Product">
              <h4>Product</h4>
              <ul>
                <li><Link to="/learn">Learn</Link></li>
                <li><Link to="/trade">Trade</Link></li>
                <li><Link to="/ai-coach">AI Coach</Link></li>
                <li><Link to="/dashboard">Dashboard</Link></li>
              </ul>
            </FooterCol>

            <FooterCol aria-label="Company">
              <h4>Company</h4>
              <ul>
                <li><Link to="/about">About</Link></li>
              </ul>
            </FooterCol>

            <FooterCol aria-label="Legal">
              <h4>Legal</h4>
              <ul>
                {/* TODO: link to dedicated /privacy and /terms routes once they exist */}
                <li><Link to="/about">Privacy</Link></li>
                <li><Link to="/about">Terms</Link></li>
              </ul>
            </FooterCol>
          </FooterGrid>

          <FooterBottom>
            <p>© <Num>{new Date().getFullYear()}</Num> tickr. Learn responsibly.</p>
            <p className="disclaimer">Paper trading only — not investment advice.</p>
          </FooterBottom>
        </FooterInner>
      </Footer>

    </PageWrapper>
  );
}

export default Home; 
