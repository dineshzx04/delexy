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

--------------- x --------------------- x ------------------ x ------------------ x -------------

# SYSTEM PROMPT: DELEXY MULTI-CONTEXT PLATFORM ARCHITECTURE & DATA RULES

## 1. APPLICATION FLOW & MULTI-CONTEXT AUTHENTICATION

### A. Authentication Modes & Credentials (`src/data/user/authCredentials.ts`)

The application supports three distinct authentication pathways:

1. **Global Individual Account Sign In (`credential_type = 'INDIVIDUAL'`)**:
   - Authenticates an individual user (`User`) using their primary personal email (`userEmails.ts`) or unique `app_user_id`.
   - **Access Scope**: Grants access to Personal User Features (`/user/*`) and provides multi-workspace switching across all companies where the user holds a `BusinessMembership` (`OWNER` or `MEMBER`) or `PlatformMembership`.
2. **Business Member Sign In (`credential_type = 'BUSINESS'`)**:
   - Direct single-tenant authentication for organization staff using a dedicated member email (`businessMemberships.ts`).
   - **Access Scope**: Session is strictly locked to that specific tenant workspace (`/b/*`) without personal profile switching.
3. **Platform Super Admin Sign In (`credential_type = 'INDIVIDUAL'`, `user_id = 'usr-1'`)**:
   - Direct platform root owner authentication using `app_user_id` (`SUPERADMIN-001` or `usr-1`) with no email address.
   - **Access Scope**: Strictly operates within the Platform Administration Workspace (`/p/*`) with zero personal or business context.

---

### B. Security & Workspace Switch Password Gate (`require_switch_password`)

- **Location of Switch Password**: Secondary workspace switch passwords (`switch_password`) are stored directly on the context membership entities (`BusinessMembership` and `PlatformMembership`), **NOT** on `AuthCredential`.
- **Enforcement Flow**:
  - When switching workspace context to a tenant (`/b/*`) or platform (`/p/*`), `WorkspaceContext` inspects `membership.require_switch_password`.
  - If `require_switch_password === true`, a modal dialog (`SwitchPasswordModal`) prompts for the secondary workspace password.
  - Context switching completes only after `validateSwitchPassword()` verifies the input against `membership.switch_password`.

---

### C. Workspace Routing & Layout Conventions

- **User Workspace (`/user/*`)**: Personal account dashboard, profile management, personal addresses, global identification, and brand trading.
- **Business Workspace (`/b/*`)**: Corporate tenant dashboard, corporate locations, team members, RBAC roles, corporate emails, settings, RFQs, and seller product catalog.
- **Platform Admin Workspace (`/p/*`)**: Global platform overview, taxonomy managers (Attributes, Groups, Mappings), business & user registries, and governance.

---

## 2. STRICT DATA REPRESENTATION RULES (`src/data`)

### A. User & Identity Schema (`src/data/user/`)

1. **User Identity & Multi-Context Versatility (`users.ts`)**:
   - An individual `User` (`usr-X`) can own businesses (`membership_type = 'OWNER'`), be a business member (`membership_type = 'MEMBER'`), and hold platform roles (`PlatformMembership`).
   - **Rule**: Every user holding a business credential MUST possess a primary `INDIVIDUAL` credential before holding any `BUSINESS` credential.

2. **Email 3-Tier Separation Constraints (`emails.ts`, `userEmails.ts`, `businessEmails.ts`)**:
   - **Personal Emails (`EmailRecord.type = 'PERSONAL'`)**: Stored in `emails.ts` and mapped exclusively in `userEmails.ts` for individual user account logins.
   - **Member Emails (`EmailRecord.type = 'MEMBER'`)**: Stored in `emails.ts` and mapped exclusively in `businessMemberships.ts` and `businessEmails.ts` for single-tenant business logins.
   - **Strict Isolation Rule**: Member emails MUST NOT overlap with personal user emails, and personal user emails MUST NOT be assigned as member business login emails.

3. **Super Admin Isolation Constraints**:
   - Super Admin (`usr-1`, `SUPERADMIN-001`) is strictly the top-level Platform Root Owner (`is_platform_active: true`).
   - Super Admin MUST NOT have any email address in `userEmails.ts` or `emails.ts`.
   - Super Admin MUST NOT have any business memberships in `businessMemberships.ts`.
   - Super Admin MUST NOT have personal user context (`/user/*`) or business workspace context (`/b/*`), and operates exclusively within `/p/*`.

4. **Platform Membership & Role Architecture (`platformMemberships.ts`, `platformRoles.ts`)**:
   - `PlatformMembership` links a `user_id` to a `membership_type` (`SUPER_ADMIN` | `PLATFORM_MEMBER`) and `platform_role_id`.
   - Contains security flags `require_switch_password` and `switch_password`.

5. **Unified Global Address Model (`addresses.ts`)**:
   - A single, consolidated `Address` entity represents global international locations.
   - Contains global fields: `country_code`, `country_name`, `address_type` (`HQ`, `BRANCH`, `WAREHOUSE`, `RESIDENTIAL`), `is_primary`, `owner_type` (`'USER'` | `'BUSINESS'`), and `owner_id`.

---

### B. Business & Party Schema (`src/data/business/`)

1. **1 Business <-> 1 Claimed Party Rule (`businesses.ts`, `parties.ts`)**:
   - One business entity (`bus-X`) claims strictly ONE Party (`pty-X`, `owner_type = 'BUSINESS'`, `owner_id = business.id`).
   - Individual users (`owner_type = 'USER'`) CANNOT own Manufacturer or Brand parties, but CAN operate personal seller trading parties (`pty-6`).

2. **Brand & Manufacturer Co-Claimant Architecture (`brandClaims.ts`)**:
   - Multiple verified business parties can claim the same brand as equal co-claimants (e.g. Samsung India and Samsung UK co-claiming Samsung Brand `brd-1`).
   - Unclaimed brands remain linked to placeholder parties (`pty-3` ASICS Corp) until claimed via platform verification.

---

### C. Catalog & Taxonomy Integrity (`src/data/catalog/`)

1. **Strict Taxonomy Tree**: `Categories` $\rightarrow$ `AttributeGroups` $\rightarrow$ `Attributes` $\rightarrow$ `AttributeValues`.
2. **Category Leaf Mapping**: Dynamic attributes and RFQ filters compute purely from `mappedGroupIds` defined on leaf categories.
3. **Seller Products (`sellerProducts.ts`)**: Linked to `seller_party_id`, `product_id`, `brand_id`, and `manufacturer_party_id`.
