import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleBlack, marbleGold } from "../marblePalette";
import { fontHeading } from "../fontPalette";
import { useNavbar } from "../context/NavbarContext";

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

const shimmerSweep = keyframes`
  0% {
    background-position: 100% 100%;
  }
  100% {
    background-position: 0% 0%;
  }
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
  opacity: 0.035;
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
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 8px;
  display: inline-block;
  position: relative;
  
  ${props => props.$isGold ? css`
    /* Top layer: thin bright tracer line; Bottom layer: base gold shimmer */
    background:
      linear-gradient(
        -45deg,
        transparent 49%,
        rgba(255, 255, 255, 1) 50%,
        transparent 51%
      ),
      linear-gradient(
        -45deg,
        transparent 48%,
        rgba(255, 255, 255, 0.95) 50%,
        transparent 52%
      ),
      linear-gradient(
        -45deg,
        #E6C87A 0%,
        #F0D586 35%,
        #FFFFFF 50%,
        #F0D586 65%,
        #E6C87A 100%
      );
    background-size: 400% 400%, 400% 400%, 400% 400%;
    background-position: 100% 100%, 100% 100%, 100% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    will-change: background-position;
  ` : css`
    color: #F4F1E9;
  `}
  
  ${props => props.$isGold && props.$animate && css`
    animation: ${shimmerSweep} 2.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  `}
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
// Polka dots: ~3x bigger, scattered, less frequent (large tile, fewer dots)
const polkaDotPatternSvg = (() => {
  const w = 220, h = 220;
  const r = 5;
  const dots = [
    [30, 45, marbleBlack], [120, 25, marbleGray], [180, 90, marbleGold],
    [55, 150, marbleGold], [200, 60, marbleBlack], [15, 110, marbleGray],
    [160, 180, marbleBlack], [85, 15, marbleGold], [140, 140, marbleGray],
    [10, 75, marbleGold], [95, 195, marbleBlack],
  ];
  const circles = dots.map(([cx, cy, fill]) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`
  ).join('');
  const raw = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${circles}</svg>`;
  const encoded = encodeURIComponent(raw).replace(/'/g, '%27');
  return `url("data:image/svg+xml,${encoded}")`;
})();

const PageWrapper = styled.div`
  min-height: 100vh;
  background-color: ${marbleWhite};
  overflow-x: hidden;
  color: ${marbleDarkGray};
`;

const PolkaDotOverlay = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image: ${polkaDotPatternSvg};
  background-repeat: repeat;
  background-position: 0 0;
  transition: opacity 0.25s ease-out;
  opacity: ${props => props.$opacity};
`;

const HeroSection = styled.section`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  perspective: 1000px;
  overflow: hidden;
  background-color: ${marbleWhite};
  z-index: 1;
`;

const HeroContent = styled.div`
  text-align: center;
  z-index: 10;
  max-width: 900px;
  padding: 0 20px;
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
  background: ${marbleGold};
  flex-shrink: 0;
  vertical-align: middle;
  margin: 0 4px;
  transform: translateY(-0.5px);
`;

const BadgeText = styled.span`
  color: ${marbleDarkGray};
  font-weight: 600;
  ${props => props.$blink && css`animation: ${blink} 0.5s ease-in-out infinite;`}
`;

const Badge = styled.div`
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  text-transform: lowercase;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: ${marbleLightGray};
  border: 1px solid ${marbleGray};
  padding: 8px 15px;
  border-radius: 50px;
  font-size: 0.8rem;
  margin-bottom: 23px;
  opacity: 0;
  animation: ${slideUp} 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0s forwards;
  transform: scale(1.05);
`;

const HeroTitle = styled.h1`
  font-family: 'Creato Display', Helvetica, Arial, sans-serif;
  font-size: clamp(2rem, 6vw, 3rem);
  font-weight: 400;
  line-height: 1.1;
  margin-bottom: 24px;
  color: ${marbleDarkGray};
  -webkit-text-stroke: 0.025em ${marbleWhite};
  paint-order: stroke fill;
`;

const HeroSubtitle = styled.p`
  font-family: 'Creato Display', Helvetica, Arial, sans-serif;
  font-size: clamp(1rem, 2.5vw, 1.35rem);
  color: ${marbleGray};
  max-width: 600px;
  margin: 0 auto 40px;
  line-height: 1.6;
  opacity: 0;
  animation: ${slideUp} 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.7s forwards;
`;

const CTAGroup = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  opacity: 0;
  animation: ${slideUp} 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.9s forwards;
`;

const PrimaryButton = styled(Link)`
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background: ${marbleDarkGray};
  color: ${marbleWhite};
  padding: 16px 32px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.1rem;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: none;
    color: ${marbleWhite};
    background: ${marbleBlack};
  }
`;

const SecondaryButton = styled(Link)`
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background: ${marbleLightGray};
  color: ${marbleDarkGray};
  padding: 16px 32px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.1rem;
  text-decoration: none;
  border: 1px solid ${marbleGray};
  transition: all 0.3s ease;
  
  &:hover {
    background: ${marbleGray};
    transform: translateY(-3px);
    color: ${marbleDarkGray};
      }
`;

const GlowOrb = styled.div`
  position: absolute;
  border-radius: 50%;
  background: ${props => props.$color || `radial-gradient(circle, ${marbleGold}33, transparent 70%)`};
  animation: ${pulse} ${props => props.$duration || '4s'} ease-in-out infinite;
  filter: blur(40px);
`;

// Feature Sections
const Section = styled.section`
  padding: 120px 20px;
  position: relative;
  overflow: hidden;
  background: ${marbleLightGray};
`;

const SectionInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 32px;
  margin-top: 60px;
`;

const FeatureCard = styled.div`
  background: ${marbleWhite};
  border: 2px solid ${marbleGold};
  border-radius: 24px;
  padding: 40px;
  transition: all 0.4s ease;
  transform-style: preserve-3d;
  
  &:hover {
    transform: translateY(-10px);
    border-color: ${marbleGold};
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.15);
  }
`;

const FeatureIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: ${marbleDarkGray};
  border: 2px solid ${marbleGold};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 24px;
`;

const FeatureTitle = styled.h3`
  font-family: ${fontHeading};
  font-size: 1.5rem;
  font-weight: 300;
  margin-bottom: 12px;
  color: ${marbleDarkGray};
  -webkit-text-stroke: 0.018em ${marbleWhite};
  paint-order: stroke fill;
`;

const FeatureDesc = styled.p`
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: ${marbleGray};
  line-height: 1.6;
`;

const SectionTitle = styled.h2`
  font-family: ${fontHeading};
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 300;
  text-align: center;
  margin-bottom: 20px;
  color: ${marbleDarkGray};
  -webkit-text-stroke: 0.02em ${marbleWhite};
  paint-order: stroke fill;
`;

const SectionSubtitle = styled.p`
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  text-align: center;
  color: ${marbleGray};
  font-size: 1.2rem;
  max-width: 600px;
  margin: 0 auto;
`;

// 3D Phone Mockup Section
const PhoneSection = styled.section`
  position: relative;
  min-height: 100vh;
  padding: 80px 20px 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${marbleWhite};
  perspective: 2000px;
`;

const PhoneMockup = styled.div`
  width: 300px;
  height: 600px;
  background: ${marbleDarkGray};
  border-radius: 40px;
  border: 3px solid ${marbleGray};
  box-shadow: 
    0 50px 100px rgba(0, 0, 0, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.1);
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.08s ease-out, opacity 0.15s ease-out;
  will-change: transform, opacity;
  
  &::before {
    content: '';
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 24px;
    background: ${marbleBlack};
    border-radius: 12px;
  }
`;

const PhoneScreen = styled.div`
  position: absolute;
  top: 50px;
  left: 12px;
  right: 12px;
  bottom: 50px;
  background: linear-gradient(180deg, ${marbleDarkGray}, ${marbleBlack});
  border-radius: 24px;
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
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: ${marbleWhite} !important;
    font-size: 0.9rem;
    margin-bottom: 8px;
  }
`;

const FloatingStats = styled.div`
  position: absolute;
  background: ${marbleWhite};
  border: 1px solid ${marbleGray};
  border-radius: 32px;
  padding: 16px 24px;
  transform-style: preserve-3d;
  transition: opacity 0.15s ease-out;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  
  ${props => props.$position === 'left' && `
    left: -120px;
    top: 100px;
  `}
  
  ${props => props.$position === 'right' && `
    right: -120px;
    bottom: 150px;
  `}
  
  h5 {
    color: ${marbleDarkGray};
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
  }
  
  span {
    color: ${marbleGray};
    font-size: 0.85rem;
  }
`;

// CTA Section
const CTASection = styled.section`
  padding: 120px 20px;
  text-align: center;
  position: relative;
  background: ${marbleLightGray};
`;

const CTACard = styled.div`
  max-width: 800px;
  margin: 0 auto;
  background: ${marbleWhite};
  border: 1px solid ${marbleGray};
  border-radius: 32px;
  padding: 60px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
`;

// ============ MAGNETIC BUTTON WRAPPER ============
function MagneticButton({ children, className, ...props }) {
  const ref = useRef(null);

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

  return React.cloneElement(children, {
    ref,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    style: { ...children.props.style, transition: 'transform 0.35s cubic-bezier(0.23, 1, 0.32, 1)' },
  });
}

// ============ COMPONENT ============
const NAVBAR_HEIGHT = 80;

function Home({ isLoggedIn }) {
  const containerRef = useRef(null);
  const statsRef = useRef(null);
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const phoneRef = useRef(null);
  const testimonialsRef = useRef(null);
  const ctaRef = useRef(null);
  const footerRef = useRef(null);
  const cursorDotRef = useRef(null);
  const { setNavbarBackground } = useNavbar();
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
      cursorPos.current.x = lerp(cursorPos.current.x, cursorTarget.current.x, 0.15);
      cursorPos.current.y = lerp(cursorPos.current.y, cursorTarget.current.y, 0.15);

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
  }, []);

  // Track scroll for 3D parallax effects
  useEffect(() => {
    let rafId;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
      });
    };

    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    // Initial call
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Navbar background: match the section under the navbar for seamless transition
  const sectionConfig = useRef([
    { ref: heroRef, bg: marbleWhite },
    { ref: featuresRef, bg: marbleLightGray },
    { ref: phoneRef, bg: marbleWhite },
    { ref: statsRef, bg: marbleDarkGray },
    { ref: testimonialsRef, bg: marbleLightGray },
    { ref: ctaRef, bg: marbleLightGray },
    { ref: footerRef, bg: marbleBlack },
  ]).current;

  useEffect(() => {
    const y = NAVBAR_HEIGHT;
    let currentBg = marbleWhite;
    for (const { ref, bg } of sectionConfig) {
      const el = ref.current;
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (rect.top <= y && rect.bottom >= y) {
        currentBg = bg;
        break;
      }
    }
    setNavbarBackground(currentBg, { theme: (currentBg === marbleDarkGray || currentBg === marbleBlack) ? 'dark' : 'light' });
  }, [scrollY, setNavbarBackground]);

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

  // Calculate scroll progress (0 to 1) for different sections
  // Hero fades over first screen
  const scrollProgress = Math.min(scrollY / windowHeight, 1);
  
  // Global scroll progress for continuous animations
  const totalScrollProgress = scrollY / (document.body.scrollHeight - windowHeight || 1);
  
  // Testimonials section fade-in - triggers at 78% scroll (when testimonials are in view)
  const testimonialProgress = Math.max(0, Math.min((totalScrollProgress - 0.68) * 8, 1));

  const smoothStep = (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return t * t * (3 - 2 * t);
  };

  const testimonialCardBaseStyle = {
    background: marbleWhite,
    padding: '32px',
    borderRadius: '20px',
    border: `1px solid ${marbleGray}`,
    transition: 'box-shadow 0.4s ease, transform 0.9s cubic-bezier(0.23, 1, 0.32, 1)',
  };

  const getTestimonialCardStyle = (offset = 0, spread = 0.18) => {
    const raw = (testimonialProgress - offset) / spread;
    const easedProgress = smoothStep(Math.max(0, Math.min(raw, 1)));
    const translateX = (1 - easedProgress) * -110;
    const translateY = (1 - easedProgress) * 35;
    const scale = 0.92 + easedProgress * 0.08;

    return {
      ...testimonialCardBaseStyle,
      opacity: easedProgress,
      transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`,
      boxShadow: easedProgress > 0.85 ? '0 15px 45px rgba(0,0,0,0.08)' : 'none',
    };
  };

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

  const polkaDotOpacity = Math.max(0, 1 - scrollY / 550);

  return (
    <PageWrapper ref={containerRef}>
      {/* Polka dots: scattered, fade out as you scroll so content clears into view */}
      <PolkaDotOverlay $opacity={polkaDotOpacity} />
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

      {/* ============ HERO SECTION ============ */}
      <HeroSection ref={heroRef}>
        {/* Glow Orbs */}
        <GlowOrb 
          style={{ width: 600, height: 600, top: '-200px', left: '-200px' }}
          $color="radial-gradient(circle, rgba(102, 126, 234, 0.2), transparent 70%)"
          $duration="6s"
        />
        <GlowOrb 
          style={{ width: 500, height: 500, bottom: '-150px', right: '-150px' }}
          $color="radial-gradient(circle, rgba(118, 75, 162, 0.2), transparent 70%)"
          $duration="8s"
        />

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

      </HeroSection>

      {/* ============ FEATURES SECTION ============ */}
      <Section ref={featuresRef}>
        <SectionInner>
          <SectionTitle>test</SectionTitle>
          <SectionSubtitle>
            relax, we've got you covered.
          </SectionSubtitle>
          
          <FeatureGrid>
            <FeatureCard>
              <FeatureIcon>📊</FeatureIcon>
              <FeatureTitle>real time charts</FeatureTitle>
              <FeatureDesc>
                Professional-grade charts with technical indicators, drawing tools, 
                and real-time market data powered by Alpaca.
              </FeatureDesc>
            </FeatureCard>
            
            <FeatureCard>
              <FeatureIcon>🎓</FeatureIcon>
              <FeatureTitle>interactive lessons</FeatureTitle>
              <FeatureDesc>
                Learn at your own pace with gamified lessons, quizzes, and 
                hands-on exercises. Earn XP and unlock achievements.
              </FeatureDesc>
            </FeatureCard>
            
            <FeatureCard>
              <FeatureIcon>🤖</FeatureIcon>
              <FeatureTitle>AI trading coach</FeatureTitle>
              <FeatureDesc>
                Get personalized guidance from our AI coach. Ask questions, 
                analyze trades, and improve your strategy.
              </FeatureDesc>
            </FeatureCard>
            
            <FeatureCard>
              <FeatureIcon>💰</FeatureIcon>
              <FeatureTitle>paper trading</FeatureTitle>
              <FeatureDesc>
                Practice with $10,000 in virtual funds. Execute trades in 
                real market conditions with zero risk.
              </FeatureDesc>
            </FeatureCard>
            
            <FeatureCard>
              <FeatureIcon>🏆</FeatureIcon>
              <FeatureTitle>leaderboards</FeatureTitle>
              <FeatureDesc>
                Compete with other traders. Climb the ranks and prove 
                your skills on the global leaderboard.
              </FeatureDesc>
            </FeatureCard>
            
            <FeatureCard>
              <FeatureIcon>🛒</FeatureIcon>
              <FeatureTitle>rewards shop</FeatureTitle>
              <FeatureDesc>
                Earn coins by learning and trading. Spend them on XP boosters, 
                streak freezes, and exclusive items.
              </FeatureDesc>
            </FeatureCard>
          </FeatureGrid>
        </SectionInner>
      </Section>

      {/* ============ 3D PHONE SECTION ============ */}
      <PhoneSection ref={phoneRef} style={{ position: 'relative', zIndex: 10 }}>
        <div style={{ position: 'relative', transformStyle: 'preserve-3d' }}>
          <PhoneMockup 
            style={{ 
              transform: `
                perspective(1200px)
                rotateY(${Math.sin(totalScrollProgress * Math.PI * 4) * 15}deg) 
                rotateX(${Math.cos(totalScrollProgress * Math.PI * 4) * 10}deg)
                rotateZ(${Math.sin(totalScrollProgress * Math.PI * 2) * 5}deg)
              `
            }}
          >
            <PhoneScreen>
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
              <PhoneContent>
                <img src="/marbleWhitelogo.png" alt="tickr" />
                <p style={{ color: marbleWhite }}>your personal trading mentor</p>
                <div style={{ 
                  marginTop: '20px',
                  background: `${marbleGray}33`,
                  borderRadius: '12px',
                  padding: '12px'
                }}>
                  <div style={{ color: marbleGold, fontSize: '1.5rem', fontWeight: '700' }}>
                    +$1,247.32
                  </div>
                  <div style={{ color: marbleWhite, fontSize: '0.8rem' }}>
                    Today's P&L
                  </div>
                </div>
              </PhoneContent>
            </PhoneScreen>
          </PhoneMockup>
          
          <FloatingStats $position="left">
            <h5>10K+</h5>
            <span>Virtual Trades</span>
          </FloatingStats>
          
          <FloatingStats $position="right">
            <h5>20+</h5>
            <span>Lessons</span>
          </FloatingStats>
        </div>
      </PhoneSection>

      {/* ============ STATS SECTION ============ */}
      <Section ref={statsRef} style={{ background: marbleDarkGray, position: 'relative', overflow: 'hidden', padding: '160px 20px' }}>
        {/* Subtle light accents on dark background */}
        <GoldDot 
          $size="10px" 
          $opacity={0.5}
          style={{ 
            top: '20%', 
            left: '15%',
            transform: `translateY(${Math.cos(totalScrollProgress * Math.PI * 2.5) * 25}px)`
          }} 
        />
        <GoldDot 
          $size="8px" 
          $opacity={0.3}
          style={{ 
            bottom: '25%', 
            right: '10%',
            transform: `translateY(${Math.sin(totalScrollProgress * Math.PI * 2.5) * 20}px)`
          }} 
        />
        <GoldLine 
          $width="100px"
          $opacity={0.3}
          style={{ 
            top: '50%', 
            right: '5%',
            transform: `translateY(${Math.sin(totalScrollProgress * Math.PI * 3) * 15}px) rotate(${-30 + totalScrollProgress * 15}deg)`
          }} 
        />
        <SubtleCross 
          $opacity={0.2}
          style={{ 
            top: '30%', 
            left: '6%',
            transform: `rotate(${totalScrollProgress * 45}deg)`
          }} 
        />
        
        <SectionInner>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '40px',
            textAlign: 'center'
          }}>
            <div>
              <StatValue $isGold $animate={statsVisible}>$10K</StatValue>
              <p style={{ color: marbleGray }}>Virtual Trading Balance</p>
            </div>
            <div>
              <StatValue>50+</StatValue>
              <p style={{ color: marbleGray }}>Interactive Lessons</p>
            </div>
            <div>
              <StatValue $isGold $animate={statsVisible}>24/7</StatValue>
              <p style={{ color: marbleGray }}>AI Coach Access</p>
            </div>
            <div>
              <StatValue>$0</StatValue>
              <p style={{ color: marbleGray }}>Risk While Learning</p>
            </div>
          </div>
        </SectionInner>
      </Section>

      {/* ============ TESTIMONIALS SECTION ============ */}
      <Section ref={testimonialsRef} style={{ background: marbleLightGray, position: 'relative', overflow: 'hidden' }}>
        {/* Floating accents */}
        <GoldRing 
          $size="50px"
          $opacity={0.25}
          style={{ 
            top: '10%', 
            right: '10%',
            transform: `rotate(${totalScrollProgress * 120}deg)`
          }} 
        />
        <GoldDot 
          $size="6px" 
          $opacity={0.35}
          style={{ 
            top: '40%', 
            left: '5%',
            transform: `translateX(${Math.cos(totalScrollProgress * Math.PI * 3) * 15}px)`
          }} 
        />
        <GoldLine 
          $width="70px"
          $opacity={0.35}
          style={{ 
            bottom: '30%', 
            right: '6%',
            transform: `rotate(${45 + totalScrollProgress * 25}deg)`
          }} 
        />
        <SubtleCross 
          $opacity={0.2}
          style={{ 
            top: '65%', 
            right: '15%',
            transform: `rotate(${totalScrollProgress * 60}deg)`
          }} 
        />
        
        <SectionInner>
          <SectionTitle>What Our Users Say</SectionTitle>
          <SectionSubtitle>
            Join thousands who've started their trading journey with tickr.
          </SectionSubtitle>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '32px', 
            marginTop: '60px' 
          }}>
            {/* Testimonial 1 - First to fade in */}
            <div style={getTestimonialCardStyle(0.25, 0.35)}>
              <p style={{ color: marbleDarkGray, fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '20px' }}>
                "Finally, a platform that doesn't throw you into the deep end. The paper trading feature let me make mistakes without losing real money."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: marbleGray }} />
                <div>
                  <strong style={{ color: marbleDarkGray }}>Alex M.</strong>
                  <p style={{ color: marbleGray, fontSize: '0.85rem' }}>Computer Science Student</p>
                </div>
              </div>
            </div>
            
            {/* Testimonial 2 - Slight delay */}
            <div style={getTestimonialCardStyle(0.4, 0.35)}>
              <p style={{ color: marbleDarkGray, fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '20px' }}>
                "The AI coach is like having a mentor available 24/7. It explained concepts I'd struggled with for months in just minutes."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: marbleGray }} />
                <div>
                  <strong style={{ color: marbleDarkGray }}>Sarah K.</strong>
                  <p style={{ color: marbleGray, fontSize: '0.85rem' }}>Marketing Professional</p>
                </div>
              </div>
            </div>
            
            {/* Testimonial 3 - Last to fade in */}
            <div style={getTestimonialCardStyle(0.65, 0.35)}>
              <p style={{ color: marbleDarkGray, fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '20px' }}>
                "The gamification keeps me coming back. I've learned more about investing in 2 weeks than I did in 2 years of reading."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: marbleGray }} />
                <div>
                  <strong style={{ color: marbleDarkGray }}>James L.</strong>
                  <p style={{ color: marbleGray, fontSize: '0.85rem' }}>Recent Graduate</p>
                </div>
              </div>
            </div>
          </div>
        </SectionInner>
      </Section>

      {/* ============ CTA SECTION ============ */}
      <CTASection ref={ctaRef} style={{ position: 'relative', overflow: 'hidden' }}>
        <CTACard>
          <SectionTitle style={{ marginBottom: '16px' }}>
            Ready to Start Your Journey?
          </SectionTitle>
          <SectionSubtitle style={{ marginBottom: '32px' }}>
            Join thousands of aspiring traders learning the smart way.
          </SectionSubtitle>
          <CTAGroup>
            <MagneticButton>
              <PrimaryButton to={isLoggedIn ? "/dashboard" : "/signup"}>
                Get Started — It's Free
              </PrimaryButton>
            </MagneticButton>
          </CTAGroup>
        </CTACard>
      </CTASection>

      {/* Footer */}
      <footer ref={footerRef} style={{ 
        padding: '40px 20px', 
        textAlign: 'center', 
        borderTop: `1px solid ${marbleGray}`,
        background: marbleBlack
      }}>
        <p style={{ color: marbleLightGray, fontSize: '0.9rem' }}>
          © {new Date().getFullYear()} tickr. Learn responsibly. Paper trading only.
        </p>
      </footer>

    </PageWrapper>
  );
}

export default Home; 
