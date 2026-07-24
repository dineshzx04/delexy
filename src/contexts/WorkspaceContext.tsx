import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type User, type Business, type AuthCredential } from '../data/db';
import { seedDatabase } from '../data/seed';

export type WorkspaceType = 'individual' | 'tenant' | 'platform';

export interface DynamicWorkspace {
  id: string;
  name: string;
  type: WorkspaceType;
  role: string;
  businessId?: string;
  business?: Business;
}

interface WorkspaceContextProps {
  isLoading: boolean;
  isAuthenticated: boolean;
  currentCredential?: AuthCredential;
  currentCredentialId: string;
  currentUser?: User;
  currentUserId: string;
  allUsers: User[];
  workspaces: DynamicWorkspace[];
  activeWorkspace: DynamicWorkspace;
  switchWorkspace: (id: string) => DynamicWorkspace | undefined;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string; targetWorkspace?: DynamicWorkspace }>;
  logout: () => void;
  switchCredential: (credentialId: string) => void;
  switchUser: (userId: string) => void;
}

const STORAGE_CREDENTIAL_KEY = 'delexy_current_credential_id';

const WorkspaceContext = createContext<WorkspaceContextProps | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    seedDatabase().then(() => {
      setDbReady(true);
    });
  }, []);

  const [currentCredentialId, setCurrentCredentialIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_CREDENTIAL_KEY) || '';
  });

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');

  // Track window URL pathname to sync context layout mode (/b vs /user)
  const [currentPathname, setCurrentPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPathname(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    const interval = setInterval(() => {
      if (window.location.pathname !== currentPathname) {
        setCurrentPathname(window.location.pathname);
      }
    }, 150);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      clearInterval(interval);
    };
  }, [currentPathname]);

  const setCurrentCredentialId = (credId: string) => {
    setCurrentCredentialIdState(credId);
    setSelectedWorkspaceId('');
    if (credId) {
      localStorage.setItem(STORAGE_CREDENTIAL_KEY, credId);
    } else {
      localStorage.removeItem(STORAGE_CREDENTIAL_KEY);
    }
  };

  // Live Query 1: Get active auth credential by ID
  const currentCredential = useLiveQuery(
    async () => (currentCredentialId && dbReady ? await db.authCredentials.get(currentCredentialId) : undefined),
    [currentCredentialId, dbReady]
  );

  // Live Query 2: Get active user from credential.user_id
  const currentUser = useLiveQuery(
    async () => (currentCredential?.user_id && dbReady ? await db.users.get(currentCredential.user_id) : undefined),
    [currentCredential?.user_id, dbReady]
  );

  const isLoading = !dbReady || Boolean(currentCredentialId && (!currentCredential || !currentUser));
  const isAuthenticated = Boolean(currentCredentialId && currentCredential && currentUser);
  const currentUserId = currentUser?.id || '';

  const allUsers = useLiveQuery(() => (dbReady ? db.users.toArray() : []), [dbReady]) || [];

  // Live Query 3: Business memberships for current user
  const memberships = useLiveQuery(
    async () => (currentUser && dbReady ? await db.businessMemberships.where('user_id').equals(currentUser.id).toArray() : []),
    [currentUser?.id, dbReady]
  ) || [];

  const businesses = useLiveQuery(() => (dbReady ? db.businesses.toArray() : []), [dbReady]) || [];

  // Live Query 4: Business membership for business-type credential
  const credentialBusinessMembership = useLiveQuery(
    async () => (currentCredential?.credential_type === 'BUSINESS' && currentCredential?.business_membership_id && dbReady
      ? await db.businessMemberships.get(currentCredential.business_membership_id)
      : undefined),
    [currentCredential?.business_membership_id, dbReady]
  );

  // Construct workspaces array based strictly on Credential Type Scope
  const workspaces: DynamicWorkspace[] = [];

  if (currentCredential && currentUser) {
    if (currentCredential.credential_type === 'BUSINESS') {
      // BUSINESS Credential Scope: ONLY the single mapped business workspace
      if (credentialBusinessMembership) {
        const biz = businesses.find((b) => b.id === credentialBusinessMembership.business_id);
        if (biz && biz.is_active) {
          workspaces.push({
            id: biz.id,
            name: biz.name,
            type: 'tenant',
            role: credentialBusinessMembership.status === 'FROZEN_BY_PLATFORM' ? 'Frozen' : credentialBusinessMembership.membership_type,
            businessId: biz.id,
            business: biz,
          });
        }
      }
    } else {
      // INDIVIDUAL Credential Scope: Personal Account + ALL mapped business memberships
      workspaces.push({
        id: 'personal',
        name: `${currentUser.full_name} (Personal)`,
        type: 'individual',
        role: 'Owner',
      });

      memberships.forEach((m) => {
        const biz = businesses.find((b) => b.id === m.business_id);
        if (biz && biz.is_active) {
          workspaces.push({
            id: m.business_id,
            name: biz.name,
            type: 'tenant',
            role: m.status === 'FROZEN_BY_PLATFORM' ? 'Frozen' : m.membership_type,
            businessId: biz.id,
            business: biz,
          });
        }
      });
    }
  }

  // Check route type
  const isBusinessRoute = /^\/(?:b|business)(?:\/|$)/.test(currentPathname);

  // Derive active workspace
  let activeWorkspace: DynamicWorkspace | undefined;

  if (selectedWorkspaceId) {
    activeWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId);
  }

  if (!activeWorkspace) {
    if (isBusinessRoute || currentCredential?.credential_type === 'BUSINESS') {
      // In business route or BUSINESS credential: default to first available business workspace, or workspaces[0]
      activeWorkspace = workspaces.find((w) => w.type === 'tenant') || workspaces[0];
    } else {
      // In user route: default to personal workspace, or workspaces[0]
      activeWorkspace = workspaces.find((w) => w.type === 'individual') || workspaces[0];
    }
  }

  if (!activeWorkspace) {
    if (currentCredential?.credential_type === 'BUSINESS') {
      activeWorkspace = workspaces[0] || {
        id: 'business',
        name: 'Business Account',
        type: 'tenant',
        role: 'Member',
      };
    } else {
      activeWorkspace = {
        id: 'personal',
        name: currentUser?.full_name ? `${currentUser.full_name} (Personal)` : 'Personal Account',
        type: 'individual',
        role: 'Owner',
      };
    }
  }

  const switchWorkspace = (id: string): DynamicWorkspace | undefined => {
    const found = workspaces.find((ws) => ws.id === id);
    if (found) {
      setSelectedWorkspaceId(found.id);
      return found;
    }
    // If workspace ID not found, fallback to first available workspace
    if (workspaces.length > 0) {
      setSelectedWorkspaceId(workspaces[0].id);
      return workspaces[0];
    }
    return undefined;
  };

  const login = async (email: string, password?: string): Promise<{ success: boolean; message?: string; targetWorkspace?: DynamicWorkspace }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const emailRecord = await db.emails.where('email').equalsIgnoreCase(cleanEmail).first();
      if (!emailRecord) {
        return { success: false, message: 'Email address not found in system.' };
      }

      // Find matching credential
      const credential = await db.authCredentials.where('email_id').equals(emailRecord.id).first();
      if (!credential) {
        const userEmailRecord = await db.userEmails.where('email_id').equals(emailRecord.id).first();
        if (userEmailRecord) {
          const userCred = await db.authCredentials.where('user_id').equals(userEmailRecord.user_id).first();
          if (userCred) {
            setCurrentCredentialId(userCred.id);
            return {
              success: true,
              targetWorkspace: {
                id: 'personal',
                name: 'Personal Account',
                type: 'individual',
                role: 'Owner',
              },
            };
          }
        }
        return { success: false, message: 'No active login credential associated with this email.' };
      }

      if (password && credential.password && credential.password !== password) {
        return { success: false, message: 'Invalid password provided.' };
      }

      const targetUser = await db.users.get(credential.user_id);
      if (!targetUser || !targetUser.is_active) {
        return { success: false, message: 'User account is inactive or disabled.' };
      }

      let targetWsId = 'personal';
      let memberRole = 'Owner';
      let targetBiz: Business | undefined;

      if (credential.credential_type === 'BUSINESS' && credential.business_membership_id) {
        const bm = await db.businessMemberships.get(credential.business_membership_id);
        if (bm) {
          targetWsId = bm.business_id;
          memberRole = bm.membership_type;
          targetBiz = await db.businesses.get(bm.business_id);
        }
      }

      setCurrentCredentialId(credential.id);
      setSelectedWorkspaceId(targetWsId);

      const targetWorkspace: DynamicWorkspace = {
        id: targetWsId,
        name: targetWsId === 'personal'
          ? `${targetUser.full_name} (Personal)`
          : (targetBiz ? targetBiz.name : targetWsId),
        type: targetWsId === 'personal' ? 'individual' : 'tenant',
        role: memberRole,
        businessId: targetWsId === 'personal' ? undefined : targetWsId,
        business: targetBiz,
      };

      return { success: true, targetWorkspace };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, message: err.message || 'Authentication failed.' };
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_CREDENTIAL_KEY);
    setCurrentCredentialIdState('');
    setSelectedWorkspaceId('');
  };

  const switchCredential = (credId: string) => {
    setCurrentCredentialId(credId);
  };

  const switchUser = (userId: string) => {
    db.authCredentials.where('user_id').equals(userId).first().then((cred) => {
      if (cred) {
        setCurrentCredentialId(cred.id);
      } else {
        setCurrentCredentialId('');
      }
    });
  };

  return (
    <WorkspaceContext.Provider
      value={{
        isLoading,
        isAuthenticated,
        currentCredential,
        currentCredentialId,
        currentUser,
        currentUserId,
        allUsers,
        workspaces,
        activeWorkspace,
        switchWorkspace,
        login,
        logout,
        switchCredential,
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
