### MASTER SYSTEM ARCHITECTURE PROMPT: Unified Identity, Access & E-Commerce Platform

---

#### 1. IDENTITY & ACCESS LAYERS

* **Physical vs. Legal Entities:**
  * **Users (`users`, `user_emails`, `user_identifications`, `user_addresses`):** Represents physical persons. Owns personal profile, personal emails, personal residential address, and government identification. Does NOT directly own brands or products.
  * **Businesses (`businesses`, `business_emails`, `business_addresses`):** Represents registered legal entities. Owns company profile, contact emails, and headquarters/branch addresses.
* **Email Registry (`emails`):**
  * `PERSONAL`: Unique to individual users. Used for user registration and contact. Cannot be used as a business member email.
  * `MEMBER`: Dedicated exclusively to a business membership (`business_memberships.email_id`). Cannot be used as a user's personal email.
* **Access Control (`business_memberships`, `roles`, `auth_credentials`):**
  * Controls authentication and permissions ONLY. Has zero commercial meaning.
  * `roles`: Defined exclusively per business context (`business_id`) and assigned to members via `business_memberships.role_id`.
  * `auth_credentials`: Stores `INDIVIDUAL` master passwords (linked to `user_id`) and `BUSINESS` context passwords (linked to `business_membership_id`).

---

#### 2. COMMERCE IDENTITY LAYER (`parties`)

All commerce modules reference `party_id` instead of `user_id` or `business_id`.

* **Parties (`parties`):**
  * 1:1 polymorphic mapping with `USER` or `BUSINESS`.
  * Fields: `id`, `owner_type` ('USER' | 'BUSINESS'), `owner_id`, `display_name`, `status`, `is_claimed`, `is_verified`.
* **Party Capabilities (`party_capabilities`):**
  * Defines allowed commercial actions: `CUSTOMER`, `SELLER`, `DISTRIBUTOR`, `MANUFACTURER`, `BRAND_OWNER`.
  * **Capability Matrix Rule:**
    * **USER Party:** Can hold `CUSTOMER`, `SELLER`, `DISTRIBUTOR`. *(Cannot hold `MANUFACTURER` or `BRAND_OWNER`)*.
    * **BUSINESS Party:** Can hold `CUSTOMER`, `SELLER`, `DISTRIBUTOR`, `MANUFACTURER`, `BRAND_OWNER`.

---

#### 3. BRAND, MANUFACTURING & CLAIM FLOW

* **Brands (`brands`):** Must belong to a BUSINESS party with `BRAND_OWNER` capability.
* **Manufacturing (`manufacturer_profiles`, `manufacturer_facilities`):** Belong to a BUSINESS party with `MANUFACTURER` capability. Manufacturing country belongs to the physical facility (`manufacturer_facilities.country_code`), not the overarching corporate entity.
* **On-the-Fly Creation & Claim Flow:**
  * If a brand or manufacturer does not exist during product creation, the platform auto-creates a placeholder `BUSINESS` party (`is_claimed = FALSE`, `is_verified = FALSE`).
  * When real owners join, they initiate a claim via `party_claims` (`target_party_id`, `claimant_party_id`, `claimant_user_id`, `status`).
  * Upon admin verification, ownership of the placeholder party/brand is transferred to the real business.

---

#### 4. PRODUCT CATALOG & SELLER LISTING LAYER

Decouples master catalog concepts from operational seller listings:

* **Catalog Product (`products`):**
  * Represents the global, abstract catalog entity shared across all platform sellers.
  * *Fields:* `id`, `name`, `description`, `status`, `created_at`, `updated_at`.
  * Category mapping managed via `product_categories` junction table.
* **Seller Listing / Product SKU (`seller_products`):**
  * Represents an actual sellable unit offered by a specific seller.
  * *Fields:* `id`, `seller_party_id`, `product_id`, `brand_id`, `manufacturer_facility_id`, `sku`, `barcode`, `price`, `stock`, `status`.

---

#### 5. OPERATIONS & AUXILIARY MODULES

* **Warehouses & Inventory (`warehouses`, `inventory`):** Physical stock management tied to `seller_party_id` or `facility_id`.
* **Distributor & Customer Profiles (`distributor_profiles`, `customer_profiles`):** Specialized profiles linked via `party_id`.
* **Categories & Media (`categories`, `product_categories`, `media`, `product_media`, `brand_media`):** Shared taxonomy and digital asset management.

---

#### 6. OFFICIAL DATABASE TABLE MAPPING


emails                      ── Master email registry
users                       ── Physical person profiles
user_emails                 ── User ↔ Email junction (PERSONAL type)
user_identifications        ── Government ID verification
businesses                  ── Legal entity profiles
addresses                   ── Polymorphic address repository ('USER' | 'BUSINESS')
user_addresses              ── User ↔ Address junction
business_addresses          ── Business ↔ Address junction
business_emails             ── Business contact emails
roles                       ── Business permissions
business_memberships        ── User ↔ Business access control
auth_credentials            ── Passwords (INDIVIDUAL & BUSINESS)
parties                     ── Unified commercial identity
party_capabilities          ── Capability flags (CUSTOMER, SELLER, etc.)
party_claims                ── Unverified party/brand claim management
brands                      ── Brand entities (BUSINESS parties only)
manufacturer_profiles       ── Manufacturer registrations (BUSINESS parties only)
manufacturer_facilities     ── Physical factories and country attribution
products                    ── Base product catalog (Name, Description)
seller_products             ── Marketplace listings (SKU, Barcode, Price, Stock, Brand, Facility)
seller_profiles             ── Seller registry
distributor_profiles        ── Distributor registry
customer_profiles           ── Customer registry
warehouses                  ── Warehouse locations
inventory                   ── Product stock per warehouse
categories                  ── Catalog hierarchy
product_categories          ── Product ↔ Category junction
media                       ── Asset storage
product_media               ── Product ↔ Asset junction
brand_media                 ── Brand ↔ Asset junction