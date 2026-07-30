# Strict Data Architecture & Multi-Context Rules

1. **User Identity & Multi-Context Versatility**:
   - An individual user (`User`) can own businesses (`BusinessMembership.membership_type = 'OWNER'`), be a business member (`BusinessMembership.membership_type = 'MEMBER'`), and hold a platform role (`PlatformMembership`).
   - A user MUST possess a primary `INDIVIDUAL` credential in `authCredentials` before holding any `BUSINESS` credential.

2. **Email 3-Tier Separation Constraints**:
   - Personal emails (`EmailRecord.type = 'PERSONAL'`) MUST ONLY be referenced in `userEmails.ts` for individual user account logins.
   - Member emails (`EmailRecord.type = 'MEMBER'`) MUST ONLY be referenced in `businessMemberships.ts` and `businessEmails.ts` for single-tenant business logins.
   - Member emails MUST NOT overlap with personal user emails, and personal user emails MUST NOT be used for member business logins.

3. **Super Admin Isolation Constraints**:
   - Super Admin (`usr-1`, `SUPERADMIN-001`) is strictly a Platform Root Owner.
   - Super Admin MUST NOT have any email address in `userEmails` or `emails`.
   - Super Admin MUST NOT have any business memberships in `businessMemberships`.
   - Super Admin MUST NOT have personal user context (`/user/*`) or business workspace context (`/b/*`), and MUST operate exclusively within the Platform Admin Workspace (`/p/*`).

4. **1 Business <-> 1 Claimed Party Rule**:
   - One business entity can claim strictly ONE Party (`owner_type = 'BUSINESS'`).
   - Individual users (`owner_type = 'USER'`) CANNOT own Manufacturer or Brand parties, but CAN operate personal seller trading parties (`pty-6`).
