import React, { createContext, useContext } from 'react';
import { useNavbarBackground } from '../hooks/useNavbarBackground';

const NavbarContext = createContext(null);

export function NavbarProvider({ children }) {
  const value = useNavbarBackground();
  return (
    <NavbarContext.Provider value={value}>
      {children}
    </NavbarContext.Provider>
  );
}

/* eslint-disable-next-line react-refresh/only-export-components */
export function useNavbar() {
  const ctx = useContext(NavbarContext);
  if (!ctx) throw new Error('useNavbar must be used within NavbarProvider');
  return ctx;
}
