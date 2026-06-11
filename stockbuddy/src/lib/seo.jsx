/**
 * SEO helper for setting per-route titles and meta tags
 */
import { useEffect } from 'react';

const DEFAULT_TITLE = 'Tickr — Learn, Simulate & Trade Smarter';
const DEFAULT_DESCRIPTION = 'Tickr helps you learn the markets, paper-trade with confidence, and level up with an AI coach.';
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://tickr.app';

/**
 * Set document title with optional suffix
 * @param {string} title - Page title
 * @param {boolean} [includeSuffix=true] - Whether to append " | Tickr"
 */
export function setPageTitle(title, includeSuffix = true) {
  document.title = includeSuffix && title !== DEFAULT_TITLE
    ? `${title} | Tickr`
    : title;
}

/**
 * Set meta description
 * @param {string} description - Page description
 */
export function setMetaDescription(description) {
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'description';
    document.head.appendChild(meta);
  }
  meta.content = description;
}

/**
 * Set Open Graph tags
 * @param {Object} params
 * @param {string} params.title
 * @param {string} [params.description]
 * @param {string} [params.image]
 * @param {string} [params.url]
 */
export function setOGTags({ title, description, image, url }) {
  // Scrapers don't resolve relative paths — make the image URL absolute,
  // without double-prefixing an already-absolute URL.
  const absolutize = (u) =>
    /^https?:\/\//i.test(u) ? u : `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`;
  const tags = {
    'og:title': title,
    'og:description': description || DEFAULT_DESCRIPTION,
    'og:image': image ? absolutize(image) : `${SITE_URL}/og.png`,
    'og:url': url || window.location.href
  };

  Object.entries(tags).forEach(([property, content]) => {
    let meta = document.querySelector(`meta[property="${property}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', property);
      document.head.appendChild(meta);
    }
    meta.content = content;
  });
}

/**
 * Set canonical URL
 * @param {string} [url] - Canonical URL (defaults to current URL without query params)
 */
export function setCanonicalUrl(url) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = url || window.location.origin + window.location.pathname;
}

/**
 * React hook for setting page SEO
 * @param {Object} params
 * @param {string} params.title - Page title
 * @param {string} [params.description] - Page description
 * @param {string} [params.image] - OG image URL
 * @param {string} [params.canonicalUrl] - Canonical URL
 */
export function useSEO({ title, description, image, canonicalUrl }) {
  useEffect(() => {
    const originalTitle = document.title;
    
    setPageTitle(title);
    
    if (description) {
      setMetaDescription(description);
    }
    
    setOGTags({ title, description, image });
    setCanonicalUrl(canonicalUrl);
    
    // Cleanup - restore original title on unmount
    return () => {
      document.title = originalTitle;
    };
  }, [title, description, image, canonicalUrl]);
}

/**
 * SEO configuration for common routes
 */
export const SEO_CONFIG = {
  home: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION
  },
  dashboard: {
    title: 'Dashboard',
    description: 'Track your portfolio performance and learning progress on Tickr.'
  },
  trade: {
    title: 'Paper Trading',
    description: 'Practice trading with virtual money. No risk, all the learning.'
  },
  learn: {
    title: 'Learn',
    description: 'Interactive lessons to master stock trading and investing fundamentals.'
  },
  aiCoach: {
    title: 'AI Coach',
    description: 'Get personalized trading guidance from your AI-powered coach.'
  },
  shop: {
    title: 'Shop',
    description: 'Spend your earned coins on power-ups and learning boosters.'
  },
  waitlist: {
    title: 'Join the Waitlist',
    description: 'Join the Tickr waitlist for early access to our trading education platform.'
  },
  signin: {
    title: 'Sign In',
    description: 'Sign in to your Tickr account.'
  },
  signup: {
    title: 'Sign Up',
    description: 'Create your free Tickr account and start your trading journey.'
  }
};

export default useSEO;

