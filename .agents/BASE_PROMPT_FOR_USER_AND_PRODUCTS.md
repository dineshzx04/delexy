
### SYSTEM ARCHITECTURE PROMPT: Unified Single Login & Dual Identity Data Model

#### 1. CORE DOMAIN MODEL & ENTITIES
* **Email Entities (`mockEmails`):**
  * `PERSONAL`: Unique to an individual user identity. Used for global user registration, primary user contact, and can be added as contact emails on owned businesses. **Can never be used as a business member email.**
  * `MEMBER`: Dedicated exclusively to a specific business membership (`mockBusinessMemberships.email_id`). **Can never be used as an individual user's primary or secondary email.**
* **User Entity (`mockUsers` & `mockUserEmails`):**
  * Onboarded via Government ID verification (`mockUserIdentifications`) and primary email verification.
  * Assigned a unique global `app_user_id` (e.g., `USR-984201`).
* **Business Memberships (`mockBusinessMemberships`):**
  * `OWNER`: Linked directly to the user who owns/claimed the business.
  * `MEMBER`: Linked to a user via a dedicated `MEMBER` email (`email_id`). Can enforce a secondary `require_switch_password` flag.
  * *Lifecycle:* If a business deletes or deactivates a member, the `MEMBER` email is unlinked and becomes available for reassignment.
* **Auth Credentials (`mockAuthCredentials`):**
  * `INDIVIDUAL`: Stores the master password tied directly to `user_id`.
  * `BUSINESS`: Stores the specific business password tied to `business_membership_id` and `user_id`.

---

#### 2. UNIFIED SINGLE LOGIN SYSTEM
The system exposes **one single login entry point** (e.g., `POST /api/v1/auth/login`). The backend dynamically determines user privileges based on the identifier provided:

1. **Identifier Identification:**
   * The user inputs an identifier (`app_user_id`, `PERSONAL` email, or `MEMBER` email) along with a password.

2. **Branch A: Global User Login (`app_user_id` or `PERSONAL` Email)**
   * **Authentication:** Validates input against `INDIVIDUAL` credentials (`credential_type: 'INDIVIDUAL'`).
   * **Context Payload:** Returns the global user profile and **all available contexts** tied to `user_id`:
     * Individual User Profile.
     * All Owned Businesses (`membership_type: 'OWNER'`).
     * All Member Businesses (`membership_type: 'MEMBER'`).
   * **Session Power:** Full top-level access. User can switch across any of their contexts without re-logging in.

3. **Branch B: Member Context Login (`MEMBER` Email)**
   * **Authentication:** Validates input against `BUSINESS` credentials (`credential_type: 'BUSINESS'`).
   * **Context Payload:** Resolves **only** the business memberships associated with that specific `MEMBER` email.
   * **Disambiguation & Switch Password:**
     * If the email maps to multiple business contexts, prompt the user to choose one context.
     * If the chosen membership has `require_switch_password: true`, require entry of the secondary `switch_password` before granting session tokens.

---

#### 3. STRICT DATA VALIDATION RULES
1. An email with `type: 'MEMBER'` cannot exist in `mockUserEmails`.
2. An email with `type: 'PERSONAL'` cannot be assigned as `email_id` in `mockBusinessMemberships`.
3. Each `mockAuthCredentials` record of type `BUSINESS` must match both the `user_id` and `business_membership_id` of an active `mockBusinessMemberships` record.









                      ┌────────────────────────────────┐
                      │ Login Request (Input + Pass)   │
                      └───────────────┬────────────────┘
                                      │
                         Lookup input in mockEmails 
                           or mockUsers (app_user_id)
                                      │
             ┌────────────────────────┴────────────────────────┐
             ▼                                                 ▼
   Email Type = PERSONAL                             Email Type = MEMBER
  or matched via App User ID                        (or business context)
             │                                                 │
  Authenticate with INDIVIDUAL                      Authenticate with BUSINESS
        Credentials                                       Credentials
             │                                                 │
             ▼                                                 ▼
Return Full Master Payload:                       Return Member Payload:
 • Individual context                              • Member contexts associated
 • Owned business contexts                           with that member email
 • Member business contexts                          (Require switch password if enabled)