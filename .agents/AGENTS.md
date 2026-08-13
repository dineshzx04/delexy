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

5. **Unified Party-Centric Address Model (`addresses.ts`)**:
   - Every physical location in the system belongs directly to a `Party` via `party_id`.
   - **Corporate Business Location**: Belongs to the Business claimed Party (`pty-1`, `pty-2`, etc.).
   - **Personal Trading Location**: Belongs to the User Personal Party (`pty-6`, `pty-8`).
   - **Unclaimed Entity Location**: Belongs directly to the Unclaimed Placeholder Party (`pty-3`, `pty-7`).
   - **Zero-Migration Claim Architecture**: When an Unclaimed Party is claimed by a Business, all address records remain attached to `party_id` with zero migration required.
   - **Multi-Location Support**: A single Party can hold multiple address records across types: `HQ`, `WAREHOUSE`, `BRANCH`, and `RESIDENTIAL`.

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

1. **Strict Taxonomy Tree**: Categories -> AttributeGroups -> Attributes -> AttributeValues.
2. **Category Leaf Mapping**: Dynamic attributes and RFQ filters compute purely from `mappedGroupIds` defined on leaf categories.
3. **Seller Products (`sellerProducts.ts`)**: Linked to `seller_party_id`, `product_id`, `brand_id`, and `manufacturer_party_id`.

---

## 3. RFQ SOURCING LIFECYCLE WORKFLOW

This is the canonical workflow for the RFQ & Sourcing module. Every agent working on this project MUST follow this lifecycle strictly.

### 3A. RFQ Lifecycle Phases (Buyer/Requester Side)

| Phase | Status | Page | Action |
|-------|--------|------|--------|
| 1 | DRAFT | RfqCreateWizard.tsx | Buyer creates RFQ with line items and specs |
| 2 | SENT | RfqList.tsx / RfqWorkspace.tsx | RFQ is published and sent to invited sellers |
| 3 | COLLECTING_QUOTES | ItemDetailWorkspace.tsx | Sellers submit quote proposals |
| 4 | UNDER_REVIEW | ItemDetailWorkspace.tsx -> RequesterQuoteReview.tsx | Buyer reviews quotes, may request revisions |
| 5 | AWARDED | ItemDetailWorkspace.tsx | Buyer awards contract; creates rfq_award with product_mapping_status=PENDING |
| 6 | Waiting | ItemDetailWorkspace.tsx | Buyer waits for seller to map catalog product |
| 7 | SUBMITTED (mapping) | RfqAwardCheckMapping.tsx | Seller submits mapping; Buyer checks the mapped product variant |
| 8 | ACKNOWLEDGED (mapping) | RfqAwardCheckMapping.tsx | Buyer acknowledges the variant specs |
| 9 | PO_CREATED | RfqAwardReleasePo.tsx | Buyer releases Purchase Order |
| 10 | PO_RECEIVED | (Supplier side) | Supplier confirms receipt of PO |

### 3B. RFQ Lifecycle Phases (Seller/Supplier Side)

| Phase | Status | Page | Action |
|-------|--------|------|--------|
| 1 | Assigned | SupplierRfqInbox.tsx | Seller sees RFQ item assignment |
| 2 | NOT_SUBMITTED | SupplierRfqInbox.tsx | Seller can submit their proposal |
| 3 | SUBMITTED | SupplierItemRespond.tsx | Seller submits quote with specs and price |
| 4 | REVISION_REQUIRED | SupplierItemRespond.tsx | Buyer requests revision; seller updates |
| 5 | ACCEPTED/AWARDED | SupplierRfqInbox.tsx | Contract awarded to seller |
| 6 | PENDING (mapping) | SupplierProductMapping.tsx | Seller maps catalog product variant |
| 7 | SUBMITTED (mapping) | SupplierRfqInbox.tsx - Awaiting Spec Approval | Seller waits for buyer to check specs |
| 8 | ACKNOWLEDGED (mapping) | SupplierRfqInbox.tsx - Awaiting PO Release | Seller waits for buyer to release PO |
| 9 | PO_CREATED | SupplierAwardReceipt.tsx | Seller acknowledges PO |
| 10 | PO_RECEIVED | SupplierRfqInbox.tsx - View PO / Order | Order is complete |

### 3C. RFQ Award Data Model

```
rfq_award {
  id, rfq_item_id, seller_party_id, seller_quote_id,
  award_status: AWARDED | PO_CREATED | PO_RECEIVED,
  product_mapping_status: PENDING | SUBMITTED | ACKNOWLEDGED,
  variant_id,          // Set by seller in SupplierProductMapping
  unit_price,
  awarded_quantity,
  purchase_order_id,   // Set by buyer in RfqAwardReleasePo
  shipping_address, payment_terms, delivery_notes, po_released_at,
  po_received_at, supplier_acknowledgement_note
}
```

### 3D. Action Gate Rules (CRITICAL)

- After Award is created, product_mapping_status MUST always start as PENDING.
- Buyer CANNOT release PO until product_mapping_status === ACKNOWLEDGED.
- Seller sees Map Product action only when product_mapping_status === PENDING.
- Seller sees "Awaiting Spec Approval..." when product_mapping_status === SUBMITTED.
- Seller sees "Awaiting PO Release..." when product_mapping_status === ACKNOWLEDGED and award_status === AWARDED.
- Seller sees "Confirm PO Receipt" only when award_status === PO_CREATED.
- Seller sees "View PO / Order" only when award_status === PO_RECEIVED.
- Buyer Check Spec Mapping action navigates to RfqAwardCheckMapping.tsx (DEDICATED PAGE).
- Buyer Release PO action navigates to RfqAwardReleasePo.tsx (DEDICATED PAGE).

---

## 4. UI & COMPONENT CODING STANDARDS

### 4A. Breadcrumb Pattern - MANDATORY

EVERY page MUST use the global BreadcrumbContext hook. NEVER render an inline Breadcrumb component.

CORRECT PATTERN:

```tsx
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';

export const MyPage: React.FC = () => {
  const navigate = useNavigate();
  // All useLiveQuery hooks first...

  const breadcrumbs = React.useMemo(() => [
    { title: <a onClick={() => navigate('/b/rfqs')}>RFQs Workspace</a> },
    { title: <a onClick={() => navigate(`/b/rfqs/${rfqId}`)}>{rfq?.rfq_number || 'RFQ'}</a> },
    { title: <span className="text-slate-800 font-semibold">Page Title</span> }
  ], [navigate, rfqId, rfq?.rfq_number]);

  useBreadcrumb(breadcrumbs);  // Must be called before any conditional return

  if (!data) return <LoadingState />;
  return <div>...</div>;
};
```

WRONG PATTERN - never do this:

```tsx
return (
  <div>
    <Breadcrumb items={[...]} />  // NEVER inline Breadcrumb
  </div>
);
```

Breadcrumb hook placement rules:
1. Declare breadcrumbs with React.useMemo() after all useLiveQuery hooks.
2. Call useBreadcrumb(breadcrumbs) immediately after the memo.
3. Both must appear BEFORE any conditional return (early return guards).
4. Use optional chaining in the memo for data that may not yet be loaded (e.g., rfq?.rfq_number).
5. Remove Breadcrumb from Ant Design imports if it was there.

---

### 4B. React Hook Safety Rules

CRITICAL: Never dereference undefined values before the loading guard.

CORRECT - computed values derived from loaded async data:

```tsx
const rfq = useLiveQuery(...);
const award = useLiveQuery(...);

const mappingDetails = React.useMemo(() => {
  if (!award) return defaultEmptyState;  // Safe internal guard
  const mappedProduct = sellerProducts.find(p => p.variants.some(v => v.id === award.variant_id));
  return { mappedProduct };
}, [award, sellerProducts]);

// Loading guard AFTER all hooks:
if (!rfq || !award) return <Loading />;

// Safe to dereference here:
const categoryName = categories.find(c => c.id === item.category_id)?.name;
```

WRONG - dereferencing before guard:

```tsx
const award = useLiveQuery(...);
// DANGER: award may be undefined here!
const mappedProduct = sellerProducts.find(p => p.variants.some(v => v.id === award.variant_id));
if (!award) return <Loading />;
```

---

### 4C. Attribute Value Lookup Pattern

When displaying catalog attribute values in specs/variant tables, always look up the human-readable label from catalogDb.attributeValues:

```tsx
const catalogAttributeValues = useLiveQuery(() => catalogDb.attributeValues.toArray(), []) || [];

// Inside useMemo:
const valLabel = catalogAttributeValues.find(v => v.id === cv.value_id)?.label
               || cv.value_label
               || cv.value_id;  // fallback to ID as last resort
```

---

### 4D. Grouped Attribute Specifications Display Pattern

When rendering attribute specs, always group by group_id and display as separate cards:

```tsx
const groupsMap: Record<string, { name: string; rows: any[] }> = {};
combination_values.forEach(cv => {
  const groupId = cv.group_id || 'ungrouped';
  if (!groupsMap[groupId]) {
    const groupName = attributeGroups.find(g => g.id === groupId)?.name || 'General Specifications';
    groupsMap[groupId] = { name: groupName, rows: [] };
  }
  const attrName = catalogAttributes.find(a => a.id === cv.attribute_id)?.name || cv.attribute_id;
  const valLabel = catalogAttributeValues.find(v => v.id === cv.value_id)?.label || cv.value_id;
  groupsMap[groupId].rows.push({ key: cv.attribute_id, specification: attrName, value: valLabel });
});

// Render each group as a separate card with color accent
const accentColors = ['#10b981', '#8b5cf6', '#f59e0b', '#14b8a6', '#ec4899'];
```

---

### 4E. Page Navigation - Each Action Gets Its Own Dedicated Page

Every distinct action in the workflow MUST navigate to a dedicated new page. NEVER reuse the same page for different workflow actions.

| Action | Dedicated Page |
|--------|---------------|
| Create RFQ | RfqCreateWizard.tsx |
| View RFQ Line Items | RfqWorkspace.tsx |
| Manage Item / View Quotes | ItemDetailWorkspace.tsx |
| Buyer Review Quote | RequesterQuoteReview.tsx |
| Buyer Check Spec Mapping | RfqAwardCheckMapping.tsx |
| Buyer Release PO | RfqAwardReleasePo.tsx |
| Supplier Respond to Quote | SupplierItemRespond.tsx |
| Supplier Map Catalog Product | SupplierProductMapping.tsx |
| Supplier Confirm PO Receipt | SupplierAwardReceipt.tsx |

---

### 4F. basePath Dual-Context Pattern

Every RFQ page MUST support both /b/ (Business) and /user/ contexts:

```tsx
const { activeWorkspace } = useWorkspace();
const isBusinessContext = activeWorkspace?.type === 'BUSINESS';
const basePath = isBusinessContext ? '/b/rfqs' : '/user/rfqs';

// For supplier pages:
const supplierBasePath = isBusinessContext ? '/b/supplier/rfqs' : '/user/supplier/rfqs';
```

---

### 4G. Supplier Status Text Rules (SupplierRfqInbox)

The action column in SupplierRfqInbox.tsx MUST follow this exact state machine:

- award.product_mapping_status === PENDING -> Button: "Map Product" (purple, navigates to /product)
- award.product_mapping_status === SUBMITTED -> Text: "Awaiting Spec Approval..." (blue italic)
- award.product_mapping_status === ACKNOWLEDGED && award.award_status === AWARDED -> Text: "Awaiting PO Release..." (amber italic)
- award.award_status === PO_CREATED -> Button: "Confirm PO Receipt" (purple)
- award.award_status === PO_RECEIVED -> Button: "View PO / Order" (emerald outline)

---

## 5. PAGE INVENTORY

### RFQ & Sourcing (src/pages/rfq/)

| File | Role | Context |
|------|------|---------|
| RfqList.tsx | List all buyer RFQs | Buyer |
| RfqCreateWizard.tsx | Create new RFQ wizard | Buyer |
| RfqWorkspace.tsx | View single RFQ + line items table | Buyer |
| ItemDetailWorkspace.tsx | Manage single item, view quotes & award | Buyer |
| RequesterQuoteReview.tsx | Side-by-side quote spec review | Buyer |
| RfqAwardCheckMapping.tsx | Review & acknowledge seller mapped variant | Buyer |
| RfqAwardReleasePo.tsx | Issue Purchase Order | Buyer |
| BuyerDashboard.tsx | Sourcing overview dashboard | Buyer |
| SupplierRfqInbox.tsx | List of assigned RFQ items with status | Supplier |
| SupplierItemRespond.tsx | Submit/edit quote response | Supplier |
| SupplierProductMapping.tsx | Map catalog product to awarded contract | Supplier |
| SupplierAwardReceipt.tsx | Confirm receipt of Purchase Order | Supplier |
| RfqStatusBadge.tsx | Badge components (no logic, pure UI) | Shared |

### Business Workspace (src/pages/business/)

| File | Role |
|------|------|
| BusinessDashboard.tsx | Corporate tenant home |
| BusinessProfile.tsx | Entity registration & profile |
| BusinessMembers.tsx | Team member management |
| BusinessRoles.tsx | RBAC roles management |
| BusinessEmailsPage.tsx | Business communication emails |
| BusinessPartyManufacturerBrands.tsx | Brand & manufacturer claims |
| BusinessSettings.tsx | Workspace settings |

### Personal User Workspace (src/pages/user/)

| File | Role |
|------|------|
| Dashboard.tsx | Personal account homepage |
| UserProfile.tsx | Personal profile management |
| UserAddresses.tsx | Personal address book |
| UserIdentifications.tsx | KYC / identity documents |
| UserBrands.tsx | Brand registrations |
| UserSellerProducts.tsx | Seller catalog listing |
| UserBusinessSubmissions.tsx | Business registration tracking |
| CreateBusiness.tsx | New business entity registration |
| SellerProductSubmissionForm.tsx | Seller product catalog submission |
| PlaceholderPage.tsx | Stub page for under-construction sections |

### Platform Administration (src/pages/platform/)

| File | Role |
|------|------|
| PlatformDashboard.tsx | Super admin overview |
| PlatformUsers.tsx / PlatformUserRegistry.tsx | User governance |
| PlatformBusinesses.tsx / PlatformBusinessReviewQueue.tsx / PlatformBusinessReviewDetail.tsx | Business verification |
| PlatformBrands.tsx / PlatformManufacturers.tsx | Brand & manufacturer registry |
| PlatformParties.tsx | Party records |
| PlatformRoles.tsx | Platform-level RBAC |
| PlatformSellerProducts.tsx / PlatformSellerProductReviewQueue.tsx / PlatformSellerProductReviewDetail.tsx | Seller product review |
| CategoryManagement.tsx / CategoryProducts.tsx | Catalog category taxonomy |
| AttributeGroups.tsx / Attributes.tsx / AttributeValues.tsx / AttributeMapping.tsx | Attribute taxonomy |

### Auth & Common (src/pages/auth/, src/pages/common/)

| File | Role |
|------|------|
| LandingPage.tsx | Public landing page |
| Login.tsx | Multi-context authentication |
| Register.tsx | New user registration |
| NotFound.tsx | 404 error page |

---

## 6. PROJECT STRUCTURE & TECH STACK

- **Framework**: React + TypeScript (Vite)
- **Styling**: Vanilla CSS + Tailwind utility classes (no Tailwind config, just className strings)
- **UI Library**: Ant Design (antd)
- **Database**: Dexie.js (IndexedDB wrapper) - rfqDb, catalogDb, businessDb, userDb
- **Routing**: React Router v6 with nested layouts
- **State**: useLiveQuery from dexie-react-hooks for all reactive DB data
- **Contexts**:
  - WorkspaceContext - auth state, active workspace, user roles
  - BreadcrumbContext - global breadcrumb state for layout header

### Layout Files:
- UserLayout.tsx - renders breadcrumbs from BreadcrumbContext in the header for /user/*
- BusinessLayout.tsx - renders breadcrumbs from BreadcrumbContext in the header for /b/*
- PlatformLayout.tsx - renders breadcrumbs from BreadcrumbContext in the header for /p/*

---

## 7. BUILD & QUALITY STANDARDS

1. Always run `npx tsc --noEmit` after making changes to verify TypeScript type safety.
2. Always run `npm run build` to confirm the production bundle compiles without errors.
3. Never leave unused imports in files (e.g., remove Breadcrumb from antd imports when converting to context hook).
4. Never use `any` for known types when the schema is clear from the data files.
5. All database mutations via rfqDb.*.update(), rfqDb.*.add() - use Dexie transaction methods.
6. The chunk size warning (> 500kB) is expected and acceptable in the current prototype stage.
