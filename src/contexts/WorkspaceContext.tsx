import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type User } from '../data/db';

export type WorkspaceType = 'individual' | 'tenant' | 'platform';

export interface DynamicWorkspace {
  id: string;
  name: string;
  type: WorkspaceType;
  role: string;
}

interface WorkspaceContextProps {
  currentUser?: User;
  currentUserId: string;
  allUsers: User[];
  workspaces: DynamicWorkspace[];
  activeWorkspace: DynamicWorkspace;
  switchWorkspace: (id: string) => void;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchUser: (userId: string) => void;
}

const STORAGE_KEY = 'delexy_current_user_id';

const WorkspaceContext = createContext<WorkspaceContextProps | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Maintain user session ID in state & localStorage
  const [currentUserId, setCurrentUserIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || 'usr-1';
  });

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('personal');

  // Persist session change
  const setCurrentUserId = (userId: string) => {
    setCurrentUserIdState(userId);
    localStorage.setItem(STORAGE_KEY, userId);
  };

  // 2. Query dynamic user data from Dexie
  const currentUser = useLiveQuery(
    async () => (await db.users.get(currentUserId)) || (await db.users.toCollection().first()),
    [currentUserId]
  );

  const allUsers = useLiveQuery(() => db.users.toArray()) || [];

  const memberships = useLiveQuery(
    async () => (currentUser ? await db.businessMemberships.where('user_id').equals(currentUser.id).toArray() : []),
    [currentUser?.id]
  ) || [];

  const businesses = useLiveQuery(() => db.businesses.toArray()) || [];

  // 3. Login method
  const login = async (email: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      // Search email record
      const emailRecord = await db.emails.where('email').equalsIgnoreCase(cleanEmail).first();
      if (!emailRecord) {
        return { success: false, message: 'Email address not found.' };
      }

      // Search user_emails link
      const userEmailRecord = await db.userEmails.where('email_id').equals(emailRecord.id).first();
      if (!userEmailRecord) {
        return { success: false, message: 'No user associated with this email.' };
      }

      const targetUser = await db.users.get(userEmailRecord.user_id);
      if (!targetUser || !targetUser.is_active) {
        return { success: false, message: 'User account is inactive or disabled.' };
      }

      // Update session state & localStorage
      setCurrentUserId(targetUser.id);
      setActiveWorkspaceId('personal');
      return { success: true };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, message: err.message || 'Authentication failed.' };
    }
  };

  // 4. Logout method
  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentUserIdState('usr-1'); // Fallback default
    setActiveWorkspaceId('personal');
  };

  // 5. Quick switch user helper
  const switchUser = (userId: string) => {
    setCurrentUserId(userId);
    setActiveWorkspaceId('personal');
  };

  // 6. Build workspaces array dynamically
  const workspaces: DynamicWorkspace[] = [];

  if (currentUser?.is_platform_active) {
    workspaces.push({
      id: 'platform',
      name: 'Platform Control Center',
      type: 'platform',
      role: 'Platform Admin',
    });
  }

  workspaces.push({
    id: 'personal',
    name: currentUser?.full_name ? `${currentUser.full_name} (Personal)` : 'Personal Account',
    type: 'individual',
    role: 'Owner',
  });

  memberships.forEach((m) => {
    const biz = businesses.find((b) => b.id === m.business_id);
    workspaces.push({
      id: m.business_id,
      name: biz ? biz.name : `Business (${m.business_id})`,
      type: 'tenant',
      role: m.status === 'FROZEN_BY_PLATFORM' ? 'Frozen' : m.membership_type,
    });
  });

  const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId) || workspaces[0];

  const switchWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
  };

  if (!workspaces.length || !activeWorkspace) return null;

  return (
    <WorkspaceContext.Provider
      value={{
        currentUser,
        currentUserId,
        allUsers,
        workspaces,
        activeWorkspace,
        switchWorkspace,
        login,
        logout,
        switchUser,
      }}
    >
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
