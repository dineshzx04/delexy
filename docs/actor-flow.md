# B2B SaaS Marketplace Actor Flow

This document outlines the primary actors within the platform and their corresponding capabilities. Importantly, concepts like "Buyer" or "Seller" are treated as **features**, not actors, and organization-level titles are treated as **roles**, not actors.

## 1. Platform
The highest level of the system, representing the SaaS marketplace itself.

### 1.1 Platform Owner
*   **Description:** Owns the entire SaaS platform.
*   **Capabilities:** Can manage platform admins, subscriptions, settings, permissions, and all global configurations.

### 1.2 Platform Members (Sub Admins)
*   **Description:** Invited by the Platform Owner to help manage the platform (similar to GitHub organization admins).
*   **Roles:**
    *   Catalog Admin
    *   Product Reviewer
    *   Finance Admin
    *   Support Admin

---

## 2. Marketplace
The core application area where trading and interactions occur.

### 2.1 Individual User
*   **Description:** A normal platform user.
*   **Capabilities:**
    *   Buy products
    *   Sell products
    *   Create RFQs
    *   Respond to RFQs
    *   Create seller products
    *   Create organizations
*   **Note:** Buyer/Seller are features, not actors. An Individual User can act as a buyer or a seller depending on the action they are taking.

---

## 3. Organization
A business entity or tenant operating within the marketplace.

### 3.1 Organization Owner
*   **Description:** The owner of a business/tenant on the platform.
*   **Capabilities:**
    *   Manage organization settings
    *   Invite users
    *   Create roles
    *   Manage subscriptions
    *   Use all marketplace features (buying, selling, etc.)

### 3.2 Organization Members
*   **Description:** Users invited into an organization. Their access and capabilities depend on assigned roles.
*   **Roles (Examples):**
    *   Procurement Manager
    *   Sales Manager
    *   Finance Manager
    *   Warehouse Manager
*   **Note:** These are roles, not actors. The actor is the "Organization Member", and their permissions are defined by these roles.
