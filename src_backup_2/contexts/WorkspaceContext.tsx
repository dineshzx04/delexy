import React, { createContext, useContext, useState, type ReactNode } from 'react';

export type WorkspaceType = 'individual' | 'tenant' | 'platform';

export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  role: string;
}

interface WorkspaceContextProps {
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  switchWorkspace: (id: string) => void;
}

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';

const WorkspaceContext = createContext<WorkspaceContextProps | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const workspaces = useLiveQuery(() => db.workspaces.toArray()) || [];
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('org-1'); // Default to ABC Engineering

  const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId) || workspaces[0];

  const switchWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
  };

  if (!workspaces.length || !activeWorkspace) return null; // Wait for seed

  return (
    <WorkspaceContext.Provider value={{ workspaces, activeWorkspace, switchWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
