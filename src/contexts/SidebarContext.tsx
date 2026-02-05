import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface SidebarContextType {
  isSidebarVisible: boolean;
  setSidebarVisible: (visible: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const SIDEBAR_BREAKPOINT = 1024;

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const location = useLocation();

  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const checkSidebarVisibility = () => {
      const isLargeScreen = window.innerWidth >= SIDEBAR_BREAKPOINT;
      setIsSidebarVisible(isHomePage && isLargeScreen);
    };

    checkSidebarVisibility();
    window.addEventListener('resize', checkSidebarVisibility);

    return () => {
      window.removeEventListener('resize', checkSidebarVisibility);
    };
  }, [isHomePage]);

  const setSidebarVisible = (visible: boolean) => {
    setIsSidebarVisible(visible);
  };

  return (
    <SidebarContext.Provider value={{ isSidebarVisible, setSidebarVisible }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SIDEBAR_WIDTH = 72;
