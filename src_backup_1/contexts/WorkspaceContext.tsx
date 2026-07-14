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

const defaultWorkspaces: Workspace[] = [
  {
    id: 'ind-1',
    name: 'John Personal',
    type: 'individual',
    role: 'Individual User',
  },
  {
    id: 'org-1',
    name: 'ABC Engineering Pvt Ltd',
    type: 'tenant',
    role: 'Organization Owner',
  },
  {
    id: 'org-2',
    name: 'XYZ Manufacturing Ltd',
    type: 'tenant',
    role: 'Procurement Manager',
  },
  {
    id: 'plat-1',
    name: 'Platform Workspace',
    type: 'platform',
    role: 'System Administrator',
  },
];

const WorkspaceContext = createContext<WorkspaceContextProps | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [workspaces] = useState<Workspace[]>(defaultWorkspaces);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>(defaultWorkspaces[1]); // Default to ABC Engineering

  const switchWorkspace = (id: string) => {
    const workspace = workspaces.find((ws) => ws.id === id);
    if (workspace) {
      setActiveWorkspace(workspace);
    }
  };

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
