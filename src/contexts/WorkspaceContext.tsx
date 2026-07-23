import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';

export type WorkspaceType = 'individual' | 'tenant' | 'platform';

export interface DynamicWorkspace {
  id: string;
  name: string;
  type: WorkspaceType;
  role: string;
}

interface WorkspaceContextProps {
  workspaces: DynamicWorkspace[];
  activeWorkspace: DynamicWorkspace;
  switchWorkspace: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextProps | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const currentUser = useLiveQuery(() => db.users.get('user-1'));
  const memberships = useLiveQuery(() => db.businessMemberships.where('user_id').equals('user-1').toArray()) || [];
  const businesses = useLiveQuery(() => db.businesses.toArray()) || [];

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('personal');

  // Build workspaces array dynamically
  const workspaces: DynamicWorkspace[] = [
    {
      id: 'personal',
      name: currentUser?.full_name ? `${currentUser.full_name} (Personal)` : 'Personal Account',
      type: 'individual',
      role: 'Owner',
    },
    ...memberships.map((m) => {
      const biz = businesses.find((b) => b.id === m.business_id);
      return {
        id: m.business_id,
        name: biz ? biz.name : `Business (${m.business_id})`,
        type: 'tenant' as WorkspaceType,
        role: m.status === 'FROZEN_BY_PLATFORM' ? 'Frozen' : 'Member',
      };
    }),
  ];

  const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId) || workspaces[0];

  const switchWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
  };

  if (!workspaces.length || !activeWorkspace) return null;

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

