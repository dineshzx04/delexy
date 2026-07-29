### SYSTEM ARCHITECTURE PROMPT: Unified Single Login & Dual Identity Data Model

#### 1. CORE DOMAIN MODEL & ENTITIES
* **Email Entities (`emails`):**
  * `PERSONAL`: Unique to an individual user identity. Used for global user registration, primary user contact, and can be added as contact emails on owned businesses. **Can never be used as a business member email.**
  * `MEMBER`: Dedicated exclusively to a specific business membership (`business_memberships.email_id`). **Can never be used as an individual user's primary or secondary email.**
* **User Entity (`users` & `user_emails`):**
  * Onboarded via Government ID verification (`user_identifications`) and primary email verification.
  * Assigned a unique global `app_user_id` (e.g., `USR-984201`).
* **Address Entities (`addresses` & Polymorphic Links):**
  * Categorized by context via `entity_type`:
    * `USER`: Personal residential/mailing address linked to an individual user (`user_addresses`).
    * `BUSINESS`: Registered physical/mailing address linked to a business entity (`business_addresses`).
* **Role Entities (`roles`):**
  * Scoped **exclusively to the business domain**. Used to define granular authorization permissions and functional access levels for members within a business context (`business_memberships.role_id`). Individual user accounts do not use business roles.
* **Business Memberships (`business_memberships`):**
  * `OWNER`: Linked directly to the user who owns/claimed the business.
  * `MEMBER`: Linked to a user via a dedicated `MEMBER` email (`email_id`) and assigned a specific business `role_id`. Can enforce a secondary `require_switch_password` flag.
  * *Lifecycle:* If a business deletes or deactivates a member, the `MEMBER` email is unlinked and becomes available for reassignment.
* **Auth Credentials (`auth_credentials`):**
  * `INDIVIDUAL`: Stores the master password tied directly to `user_id`.
  * `BUSINESS`: Stores the specific business password tied to `business_membership_id` and `user_id`.

---

#### 2. UNIFIED SINGLE LOGIN SYSTEM
The system exposes **one single login entry point** (e.g., `POST /api/v1/auth/login`). The backend dynamically determines user privileges based on the identifier provided:

1. **Identifier Identification:**
   * The user inputs an identifier (`app_user_id`, `PERSONAL` email, or `MEMBER` email) along with a password.

2. **Branch A: Global User Login (`app_user_id` or `PERSONAL` Email)**
   * **Authentication:** Validates input against `INDIVIDUAL` credentials (`credential_type: 'INDIVIDUAL'`).
   * **Context Payload:** Returns the global user profile (including personal address) and **all available contexts** tied to `user_id`:
     * Individual User Profile.
     * All Owned Businesses (`membership_type: 'OWNER'`).
     * All Member Businesses (`membership_type: 'MEMBER'`), including assigned business roles.
   * **Session Power:** Full top-level access. User can switch across any of their contexts without re-logging in.

3. **Branch B: Member Context Login (`MEMBER` Email)**
   * **Authentication:** Validates input against `BUSINESS` credentials (`credential_type: 'BUSINESS'`).
   * **Context Payload:** Resolves **only** the business memberships associated with that specific `MEMBER` email, including the user's assigned business role (`role_id`).
   * **Disambiguation & Switch Password:**
     * If the email maps to multiple business contexts, prompt the user to choose one context.
     * If the chosen membership has `require_switch_password: true`, require entry of the secondary `switch_password` before granting session tokens.

---

#### 3. STRICT DATA VALIDATION RULES
1. An email with `type: 'MEMBER'` cannot exist in `user_emails`.
2. An email with `type: 'PERSONAL'` cannot be assigned as `email_id` in `business_memberships`.
3. An address tagged as `entity_type: 'USER'` cannot be linked to a business entity, and vice versa.
4. `roles` can only be assigned to `business_memberships` (via `role_id`) and cannot be assigned directly to an individual user profile.
5. Each `auth_credentials` record of type `BUSINESS` must match both the `user_id` and `business_membership_id` of an active `business_memberships` record.

---

#### 4. DATABASE TABLE SCHEMA MAPPING
Below is the official database table mapping and relationship structure:

* **`emails`**: Primary email registry (`id`, `email`, `type`, `created_at`, `updated_at`).
* **`users`**: Global user profiles (`id`, `app_user_id`, `first_name`, `last_name`, `full_name`, `date_of_birth`, `place_of_birth`, `country_of_residence`, `is_active`, timestamps).
* **`user_emails`**: Junction table linking individual users to personal emails (`id`, `user_id`, `email_id`, `is_primary`, `is_verified`, timestamps).
* **`user_identifications`**: User ID verification records (`id`, `user_id`, `id_type`, `issuing_country`, `id_number`, `verification_status`, `expiry_date`, timestamps).
* **`addresses`**: Master address repository (`id`, `street_address_1`, `street_address_2`, `city`, `state_province`, `postal_code`, `country`, `entity_type` ['USER' | 'BUSINESS'], timestamps).
* **`user_addresses`**: Junction linking user profile to personal address (`id`, `user_id`, `address_id`, `is_primary`, timestamps).
* **`businesses`**: Registered business entities (`id`, `name`, `legal_name`, `slug`, `website`, `phone`, `country_code`, `is_active`, `is_claimed`, timestamps).
* **`business_addresses`**: Junction linking business entity to business address (`id`, `business_id`, `address_id`, `address_type` ['HEADQUARTERS' | 'BRANCH' | 'MAILING'], timestamps).
* **`business_emails`**: Contact emails assigned to businesses (`id`, `business_id`, `email_id`, `email_type`, `label`, `is_verified`, timestamps).
* **`roles`**: Business permission roles (`id`, `business_id`, `role_name`, `permissions`, timestamps).
* **`business_memberships`**: User memberships in businesses (`id`, `business_id`, `user_id`, `email_id`, `membership_type`, `role_id` [FK to `roles`], `status`, `require_switch_password`, `deleted_at`, timestamps).
* **`auth_credentials`**: Passwords and login credentials (`id`, `credential_type`, `user_id`, `business_membership_id`, `password_hash`, `switch_password_hash`, `auth_type`, timestamps).








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