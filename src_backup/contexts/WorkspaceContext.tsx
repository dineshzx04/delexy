import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { ActorContext } from '../routes/sitemap';

type WorkspaceType = 'user' | 'org';

interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  context: ActorContext;
}

interface WorkspaceContextType {
  currentWorkspace: Workspace;
  availableWorkspaces: Workspace[];
  switchWorkspace: (workspaceId: string) => void;
}

const defaultWorkspaces: Workspace[] = [
  { id: 'org-1', name: 'Acme Corp', type: 'org', context: 'org' },
  { id: 'user-1', name: 'John Doe', type: 'user', context: 'user' },
];

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace>(defaultWorkspaces[0]);
  const [availableWorkspaces] = useState<Workspace[]>(defaultWorkspaces);

  const switchWorkspace = (workspaceId: string) => {
    const workspace = availableWorkspaces.find(w => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
    }
  };

  return (
    <WorkspaceContext.Provider value={{ currentWorkspace, availableWorkspaces, switchWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
