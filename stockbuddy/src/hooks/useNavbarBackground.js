import { useEffect, useCallback } from 'react';

// Global navbar background management
let navbarBackgroundListeners = [];
let currentNavbarBackground = null;

export const useNavbarBackground = () => {
  const setNavbarBackground = useCallback((backgroundColor, isImportant = true) => {
    const navbar = document.querySelector('.navbar-color');
    console.log(`useNavbarBackground: Setting navbar to ${backgroundColor} (important: ${isImportant})`);
    if (navbar) {
      if (isImportant) {
        navbar.style.setProperty('background-color', backgroundColor, 'important');
      } else {
        navbar.style.backgroundColor = backgroundColor;
      }
      currentNavbarBackground = backgroundColor;
      console.log(`useNavbarBackground: Successfully set navbar background to ${backgroundColor}`);
      
      // Notify all listeners
      navbarBackgroundListeners.forEach(listener => listener(backgroundColor));
    } else {
      console.log('useNavbarBackground: Navbar element not found!');
    }
  }, []);

  const resetNavbarBackground = useCallback(() => {
    const navbar = document.querySelector('.navbar-color');
    console.log('useNavbarBackground: Resetting navbar background');
    if (navbar) {
      navbar.style.removeProperty('background-color');
      navbar.style.removeProperty('--navbar-bg-override');
      currentNavbarBackground = null;
      console.log('useNavbarBackground: Successfully reset navbar background');
      
      // Notify all listeners
      navbarBackgroundListeners.forEach(listener => listener(null));
    } else {
      console.log('useNavbarBackground: Navbar element not found during reset!');
    }
  }, []);

  const getCurrentNavbarBackground = useCallback(() => {
    return currentNavbarBackground;
  }, []);

  return {
    setNavbarBackground,
    resetNavbarBackground,
    getCurrentNavbarBackground
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
