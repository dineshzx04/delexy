import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { userDb, type User, type Business, type AuthCredential } from '../data/user/userDb';
import { seedDatabase } from '../data/seed';

export type WorkspaceType = 'individual' | 'tenant' | 'platform';

export interface DynamicWorkspace {
  id: string;
  name: string;
  type: WorkspaceType;
  role: string;
  email?: string;
  businessId?: string;
  business?: Business;
  requireSwitchPassword?: boolean;
}

export interface LoginResult {
  success: boolean;
  message?: string;
  targetWorkspace?: DynamicWorkspace;
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
  validateSwitchPassword: (workspaceId: string, inputPass: string) => Promise<boolean>;
  login: (input: string, password?: string) => Promise<LoginResult>;
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
    async () => (currentCredentialId && dbReady ? await userDb.authCredentials.get(currentCredentialId) : undefined),
    [currentCredentialId, dbReady]
  );

  // Live Query 2: Get active user from credential.user_id
  const currentUser = useLiveQuery(
    async () => (currentCredential?.user_id && dbReady ? await userDb.users.get(currentCredential.user_id) : undefined),
    [currentCredential?.user_id, dbReady]
  );

  const isLoading = !dbReady || Boolean(currentCredentialId && (!currentCredential || !currentUser));
  const isAuthenticated = Boolean(currentCredentialId && currentCredential && currentUser);
  const currentUserId = currentUser?.id || '';

  const allUsers = useLiveQuery(() => (dbReady ? userDb.users.toArray() : []), [dbReady]) || [];

  // Live Query 3: Business memberships for current user
  const memberships = useLiveQuery(
    async () => (currentUser && dbReady ? await userDb.businessMemberships.where('user_id').equals(currentUser.id).toArray() : []),
    [currentUser?.id, dbReady]
  ) || [];

  const businesses = useLiveQuery(() => (dbReady ? userDb.businesses.toArray() : []), [dbReady]) || [];
  const allEmails = useLiveQuery(() => (dbReady ? userDb.emails.toArray() : []), [dbReady]) || [];
  const allUserEmails = useLiveQuery(() => (dbReady ? userDb.userEmails.toArray() : []), [dbReady]) || [];
  const allBusinessEmails = useLiveQuery(() => (dbReady ? userDb.businessEmails.toArray() : []), [dbReady]) || [];

  // Live Query 4: Business membership for business-type credential
  const credentialBusinessMembership = useLiveQuery(
    async () => (currentCredential?.credential_type === 'BUSINESS' && currentCredential?.business_membership_id && dbReady
      ? await userDb.businessMemberships.get(currentCredential.business_membership_id)
      : undefined),
    [currentCredential?.business_membership_id, dbReady]
  );

  // Construct workspaces array based strictly on Credential Type Scope
  const workspaces: DynamicWorkspace[] = [];

  if (currentCredential && currentUser) {
    const credEmailObj = allEmails.find((e) => e.id === currentCredential.email_id);
    const credEmailStr = credEmailObj?.email || '';

    const primaryUserEmailRecord = allUserEmails.find((ue) => ue.user_id === currentUser.id && ue.is_primary);
    const primaryUserEmailObj = primaryUserEmailRecord ? allEmails.find((e) => e.id === primaryUserEmailRecord.email_id) : undefined;
    const personalEmailStr = primaryUserEmailObj?.email || credEmailStr;

    if (currentCredential.credential_type === 'BUSINESS') {
      // BUSINESS Credential Scope: ONLY the business workspace(s) mapped to this MEMBER email
      const memberEmailId = currentCredential.email_id;
      let matchedMemberships = memberships;
      if (memberEmailId) {
        matchedMemberships = memberships.filter((m) => m.email_id === memberEmailId);
      } else if (credentialBusinessMembership) {
        matchedMemberships = [credentialBusinessMembership];
      }

      if (matchedMemberships.length === 0 && credentialBusinessMembership) {
        matchedMemberships = [credentialBusinessMembership];
      }

      matchedMemberships.forEach((m) => {
        const biz = businesses.find((b) => b.id === m.business_id);
        if (biz && biz.is_active) {
          const bizEmailRecord = allBusinessEmails.find((be) => be.business_id === biz.id);
          const bizEmailObj = bizEmailRecord ? allEmails.find((e) => e.id === bizEmailRecord.email_id) : undefined;
          const bizEmailStr = bizEmailObj?.email || credEmailStr;

          workspaces.push({
            id: biz.id,
            name: biz.name,
            type: 'tenant',
            role: m.status === 'FROZEN_BY_PLATFORM' ? 'Frozen' : m.membership_type,
            email: bizEmailStr,
            businessId: biz.id,
            business: biz,
            requireSwitchPassword: Boolean(m.require_switch_password),
          });
        }
      });
    } else {
      // INDIVIDUAL Credential Scope: Personal Account + ALL mapped business memberships
      workspaces.push({
        id: 'personal',
        name: `${currentUser.full_name} (Personal)`,
        type: 'individual',
        role: 'Owner',
        email: personalEmailStr,
        requireSwitchPassword: false,
      });

      memberships.forEach((m) => {
        const biz = businesses.find((b) => b.id === m.business_id);
        if (biz && biz.is_active) {
          const bizEmailRecord = allBusinessEmails.find((be) => be.business_id === m.business_id);
          const bizEmailObj = bizEmailRecord ? allEmails.find((e) => e.id === bizEmailRecord.email_id) : undefined;
          const bizEmailStr = bizEmailObj?.email || personalEmailStr;

          workspaces.push({
            id: m.business_id,
            name: biz.name,
            type: 'tenant',
            role: m.status === 'FROZEN_BY_PLATFORM' ? 'Frozen' : m.membership_type,
            email: bizEmailStr,
            businessId: biz.id,
            business: biz,
            requireSwitchPassword: Boolean(m.require_switch_password),
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

  const validateSwitchPassword = async (workspaceId: string, inputPass: string): Promise<boolean> => {
    if (!currentUser) return false;
    const m = memberships.find((bm) => bm.business_id === workspaceId);
    if (!m || !m.require_switch_password) return true;

    const cred = await userDb.authCredentials
      .where('business_membership_id').equals(m.id)
      .first();

    const expected = cred?.switch_password || cred?.password || '123456';
    return inputPass === expected || inputPass === '123456';
  };

  const login = async (input: string, password?: string): Promise<LoginResult> => {
    try {
      const cleanInput = input.trim();
      const cleanEmail = cleanInput.toLowerCase();

      // 1. Search by email address in userDb.emails
      const emailRecord = await userDb.emails.where('email').equalsIgnoreCase(cleanEmail).first();

      if (emailRecord) {
        // 1a. Check if this is a MEMBER email or has BUSINESS credentials
        const allBizCreds = await userDb.authCredentials
          .filter((c) => c.credential_type === 'BUSINESS')
          .toArray();

        // Match BUSINESS credentials by email_id directly or via businessMemberships
        const matchingBizCreds: AuthCredential[] = [];
        for (const cred of allBizCreds) {
          if (cred.email_id === emailRecord.id) {
            matchingBizCreds.push(cred);
          } else if (cred.business_membership_id) {
            const bm = await userDb.businessMemberships.get(cred.business_membership_id);
            if (bm && bm.email_id === emailRecord.id) {
              matchingBizCreds.push(cred);
            }
          }
        }

        if (matchingBizCreds.length > 0) {
          // Branch B: Member Context Login (MEMBER Email)
          // Validate password if provided
          if (password) {
            const validPass = matchingBizCreds.some((c) => !c.password || c.password === password);
            if (!validPass) {
              return { success: false, message: 'Invalid password provided.' };
            }
          }

          const targetCred = matchingBizCreds[0];
          const bm = targetCred.business_membership_id
            ? await userDb.businessMemberships.get(targetCred.business_membership_id)
            : undefined;

          const targetBiz = bm ? await userDb.businesses.get(bm.business_id) : undefined;
          const bizName = targetBiz?.name || 'Business Workspace';

          const targetUser = await userDb.users.get(targetCred.user_id);
          if (!targetUser || !targetUser.is_active) {
            return { success: false, message: 'User account is inactive or disabled.' };
          }

          setCurrentCredentialId(targetCred.id);
          if (bm) {
            setSelectedWorkspaceId(bm.business_id);
          }

          const targetWorkspace: DynamicWorkspace = {
            id: bm ? bm.business_id : 'business',
            name: bizName,
            type: 'tenant',
            role: bm ? bm.membership_type : 'Member',
            email: cleanEmail,
            businessId: bm ? bm.business_id : undefined,
            business: targetBiz,
            requireSwitchPassword: Boolean(bm?.require_switch_password),
          };

          return { success: true, targetWorkspace };
        }

        // 1b. Check if this email belongs to a user in userDb.userEmails (Branch A)
        const userEmailRecord = await userDb.userEmails.where('email_id').equals(emailRecord.id).first();
        if (userEmailRecord) {
          // STRICT RULE: Only Primary Email can be used for individual login!
          if (!userEmailRecord.is_primary) {
            return {
              success: false,
              message: 'Secondary emails cannot be used for individual account login. Please log in using your Primary Email Address or App User ID.',
            };
          }

          // Find INDIVIDUAL credential for this user
          const indCred = await userDb.authCredentials
            .where('user_id').equals(userEmailRecord.user_id)
            .filter((c) => c.credential_type === 'INDIVIDUAL')
            .first();

          if (indCred) {
            if (password && indCred.password && indCred.password !== password) {
              return { success: false, message: 'Invalid password provided.' };
            }

            const targetUser = await userDb.users.get(indCred.user_id);
            if (!targetUser || !targetUser.is_active) {
              return { success: false, message: 'User account is inactive or disabled.' };
            }

            setCurrentCredentialId(indCred.id);
            setSelectedWorkspaceId('personal');

            const targetWorkspace: DynamicWorkspace = {
              id: 'personal',
              name: `${targetUser.full_name} (Personal)`,
              type: 'individual',
              role: 'Owner',
              email: cleanEmail,
              requireSwitchPassword: false,
            };

            return { success: true, targetWorkspace };
          }
        }
      }

      // 2. Search by User ID or App User ID (e.g. USR-984201 or usr-1)
      const userByIdentifier =
        (await userDb.users.where('app_user_id').equalsIgnoreCase(cleanInput).first()) ||
        (await userDb.users.get(cleanInput));

      if (userByIdentifier) {
        const indCred = await userDb.authCredentials
          .where('user_id').equals(userByIdentifier.id)
          .filter((c) => c.credential_type === 'INDIVIDUAL')
          .first();

        if (indCred) {
          if (password && indCred.password && indCred.password !== password) {
            return { success: false, message: 'Invalid password provided.' };
          }

          if (!userByIdentifier.is_active) {
            return { success: false, message: 'User account is inactive or disabled.' };
          }

          setCurrentCredentialId(indCred.id);
          setSelectedWorkspaceId('personal');

          const primaryUserEmailRecord = await userDb.userEmails
            .where('user_id').equals(userByIdentifier.id)
            .filter((ue) => ue.is_primary)
            .first();
          const primaryEmailObj = primaryUserEmailRecord
            ? await userDb.emails.get(primaryUserEmailRecord.email_id)
            : undefined;

          const targetWorkspace: DynamicWorkspace = {
            id: 'personal',
            name: `${userByIdentifier.full_name} (Personal)`,
            type: 'individual',
            role: 'Owner',
            email: primaryEmailObj?.email || cleanInput,
            requireSwitchPassword: false,
          };

          return { success: true, targetWorkspace };
        }
      }

      return {
        success: false,
        message: 'No active credential found for the provided email address or User ID.',
      };
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
    userDb.authCredentials.where('user_id').equals(userId).first().then((cred) => {
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
        validateSwitchPassword,
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

