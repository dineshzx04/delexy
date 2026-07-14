import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export type BreadcrumbItemType = {
  title: React.ReactNode;
  url?: string;
};

type BreadcrumbContextType = {
  customBreadcrumbs: BreadcrumbItemType[] | null;
  setCustomBreadcrumbs: (items: BreadcrumbItemType[] | null) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export const BreadcrumbProvider = ({ children }: { children: ReactNode }) => {
  const [customBreadcrumbs, setCustomBreadcrumbs] = useState<BreadcrumbItemType[] | null>(null);

  return (
    <BreadcrumbContext.Provider value={{ customBreadcrumbs, setCustomBreadcrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  );
};

export const useBreadcrumbContext = () => {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumbContext must be used within a BreadcrumbProvider');
  }
  return context;
};

export const useBreadcrumb = (items: BreadcrumbItemType[] = []) => {
  const { setCustomBreadcrumbs } = useBreadcrumbContext();

  useEffect(() => {
    setCustomBreadcrumbs(items);
    return () => setCustomBreadcrumbs(null);
  }, [items]); // ✅ Safe if you pass a memoized array
};
