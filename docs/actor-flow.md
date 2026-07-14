# B2B SaaS Marketplace Actor Flow

This document outlines the primary actors within the platform and their corresponding capabilities. Importantly, concepts like "Buyer" or "Seller" are treated as **features** or **contexts**, not hardcoded actors. Likewise, organization-level titles are treated as **roles** managed via RBAC, not separate actor types.

## 1. Platform Level (Global System)
The highest level of the system, representing the SaaS marketplace administration itself. This corresponds to the `platform` workspace type in the application.

### 1.1 Platform Owner
*   **Description:** The super admin who owns the entire SaaS platform.
*   **Capabilities:** 
    *   Manage platform-wide settings and billing.
    *   Manage global taxonomies (Categories, Attribute Groups, Attributes, Attribute Values).
    *   Manage Platform Products (master catalog).
    *   Invite and assign permissions to Platform Members.
    *   Oversee all Tenants and Individual users.

### 1.2 Platform Members (Sub Admins)
*   **Description:** Internal team members invited by the Platform Owner to help manage the platform operations (similar to GitHub organization admins).
*   **Example Roles:**
    *   **Catalog Admin:** Approves products, manages category taxonomies.
    *   **Finance Admin:** Oversees marketplace fee collection, payouts, and subscriptions.
    *   **Support Admin:** Manages user disputes, helps with account recovery.

---

## 2. Organization Level (Tenant / B2B)
A business entity or tenant operating within the marketplace. This corresponds to the `tenant` workspace type in the application.

### 2.1 Organization Owner
*   **Description:** The creator/owner of a business entity on the platform.
*   **Capabilities:**
    *   Manage organization-level settings (branding, billing, regions).
    *   Invite users to join the organization.
    *   Define and assign custom RBAC (Role-Based Access Control) policies.
    *   Manage SaaS subscriptions for the organization.
    *   Access all marketplace features on behalf of the org (buying, selling, quoting).

### 2.2 Organization Members
*   **Description:** Employees or contractors invited into an organization. Their access and capabilities are strictly dictated by the RBAC roles assigned to them by the Org Owner.
*   **Example Roles (Configurable via RBAC):**
    *   **Procurement Manager:** Can create RFQs, approve Purchase Orders, browse suppliers.
    *   **Sales Manager:** Can create products, respond to RFQs with quotes, manage incoming orders.
    *   **Finance Manager:** Can view invoices, manage payment methods.
    *   **Warehouse Manager:** Can update shipping statuses and inventory.
*   **Note:** The actor is simply an "Organization Member". Their functional capabilities are dynamic based on their role.

---

## 3. Marketplace Level (Individual / B2C)
The core application area where standalone trading and interactions occur. This corresponds to the `individual` workspace type in the application.

### 3.1 Individual User
*   **Description:** A standard registered user who operates independently (i.e., they are not currently operating under a Tenant Workspace).
*   **Capabilities:**
    *   Buy products for personal or sole-proprietor use.
    *   Sell products independently.
    *   Create and respond to RFQs.
    *   Create a new Organization (which elevates them to an Organization Owner of a new Tenant).
*   **Note:** Buyer/Seller are features, not actors. An Individual User can fluidly act as a buyer or a seller depending on the specific transaction they are engaged in.
