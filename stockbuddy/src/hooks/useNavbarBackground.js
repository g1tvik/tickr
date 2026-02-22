import { useState, useCallback, useEffect } from 'react';

// Global navbar background management
let navbarBackgroundListeners = [];
let currentNavbarBackground = null;

const DARK_BGS = ['#222222', '#2c2c2c', '#2a4580', '#1e3260', '#111111'];

export const useNavbarBackground = () => {
  const [navbarTheme, setNavbarTheme] = useState('light'); // 'light' | 'dark'

  const setNavbarBackground = useCallback((backgroundColor, options = {}) => {
    const isImportant = options.isImportant !== false;
    const theme = options.theme ?? (typeof backgroundColor === 'string' && DARK_BGS.includes(backgroundColor.toLowerCase()) ? 'dark' : 'light');
    const navbar = document.querySelector('.navbar-color');
    if (navbar) {
      if (isImportant) {
        navbar.style.setProperty('background-color', backgroundColor, 'important');
      } else {
        navbar.style.backgroundColor = backgroundColor;
      }
      currentNavbarBackground = backgroundColor;
      setNavbarTheme(theme);
      navbarBackgroundListeners.forEach(listener => listener(backgroundColor));
    }
  }, []);

  return {
    setNavbarBackground,
    navbarTheme,
    resetNavbarBackground: useCallback(() => {
      const navbar = document.querySelector('.navbar-color');
      if (navbar) {
        navbar.style.removeProperty('background-color');
        navbar.style.removeProperty('--navbar-bg-override');
        currentNavbarBackground = null;
        setNavbarTheme('light');
        navbarBackgroundListeners.forEach(listener => listener(null));
      }
    }, []),
    getCurrentNavbarBackground: useCallback(() => currentNavbarBackground, []),
  };
};

// Hook for components that need to listen to navbar background changes
export const useNavbarBackgroundListener = (callback) => {
  useEffect(() => {
    navbarBackgroundListeners.push(callback);
    
    return () => {
      navbarBackgroundListeners = navbarBackgroundListeners.filter(listener => listener !== callback);
    };
  }, [callback]);
};
