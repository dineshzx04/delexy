# SYSTEM ARCHITECTURE: Unified Identity, Access & Commerce

---

# 1. Identity Layer

The Identity Layer manages people and legal business entities.

## Users

Represents an individual person.

Tables

* users
* user_emails
* user_identifications
* user_addresses

A User owns:

* Personal profile
* Personal emails
* Personal address
* Government identification

A User does **not** own brands or manufacture products.

---

## Businesses

Represents a registered legal entity.

Tables

* businesses
* business_emails
* business_addresses

A Business owns:

* Business information
* Contact emails
* Business addresses

Businesses are the only entities that may own Brands or become Manufacturers.

---

# 2. Access Layer

The Access Layer controls authentication and permissions only.

It has no commercial meaning.

Tables

* business_memberships
* roles
* auth_credentials

Responsibilities

* Business ownership
* Member invitations
* Business roles
* Login
* Passwords
* Switch password
* Context switching

Example

John

↓

Owner

↓

Business A

Alice

↓

Member

↓

Business A

This only means Alice can access Business A.

It does NOT mean Alice owns its brands.

---

# 3. Commerce Layer

Every commercial participant is represented by a Party.

A Party is the unified identity used by all commerce modules.

```
User ------------\
                  \
                   ---> Party
                  /
Business --------/
```

Table

## parties

```
id
owner_type        // USER | BUSINESS
owner_id
display_name
status
created_at
updated_at
```

Examples

PTY-001 → John

PTY-002 → Business A

PTY-003 → Business B

Every User owns one Party.

Every Business owns one Party.

Commerce modules never reference user_id or business_id.

They reference party_id.

---

# 4. Party Capabilities

A Party may have one or more capabilities.

Table

## party_capabilities

```
id
party_id
capability
status
created_at
updated_at
```

Capabilities

* CUSTOMER
* SELLER
* DISTRIBUTOR
* MANUFACTURER
* BRAND_OWNER

Rules

USER Party

✓ CUSTOMER

✓ SELLER

✓ DISTRIBUTOR

✗ MANUFACTURER

✗ BRAND_OWNER

BUSINESS Party

✓ CUSTOMER

✓ SELLER

✓ DISTRIBUTOR

✓ MANUFACTURER

✓ BRAND_OWNER

---

# 5. Brand Module

Only Business Parties having BRAND_OWNER capability may own brands.

Tables

## brands

```
id
owner_party_id
name
slug
logo
description
status
```

Validation

owner_party_id

↓

Must belong to

BUSINESS

AND

Capability = BRAND_OWNER

---

# 6. Manufacturer Module

Only Business Parties having MANUFACTURER capability may manufacture products.

Tables

## manufacturer_profiles

```
id
party_id
registration_number
license_number
status
```

A manufacturer may have multiple manufacturing facilities.

## manufacturer_facilities

```
id
manufacturer_profile_id
facility_name
country_code
address_id
status
```

Manufacturing country belongs to the facility, not the manufacturer.

Example

Business A

↓

Manufacturer

↓

Factory

India

↓

Factory

Vietnam

↓

Factory

United Kingdom

---

# 7. Product Module

Tables

## products

```
id
brand_id
manufacturer_facility_id
sku
barcode
name
description
status
```

Relationship

Business

↓

Brand

↓

Product

↓

Manufactured at

↓

Facility

---

# 8. Seller Module

Both User Parties and Business Parties can sell.

Tables

## seller_profiles

```
id
party_id
seller_code
status
```

## seller_products

```
id
seller_party_id
product_id
price
stock
status
```

One product

↓

Many sellers

↓

Different prices

↓

Different stock

---

# 9. Distributor Module

Tables

## distributor_profiles

```
id
party_id
territory
status
```

Both Users and Businesses may become distributors.

---

# 10. Customer Module

Customer is simply a Party having CUSTOMER capability.

Table

## customer_profiles

```
id
party_id
status
```

---

# 11. Inventory Module

Tables

## warehouses

```
id
party_id
name
address_id
```

## inventory

```
id
warehouse_id
product_id
quantity
reserved_quantity
```

Each seller may own multiple warehouses.

---

# 12. Categories Module

Tables

```
categories

product_categories
```

Products may belong to multiple categories.

---

# 13. Media Module

Tables

```
media

product_media

brand_media
```

Stores images, videos and documents.

---

# 14. Commerce Relationships

```
Users
│
├── user_emails
├── user_identifications
├── user_addresses
│
└── Parties
      │
      ├── Seller Profile
      ├── Distributor Profile
      └── Customer Profile

Businesses
│
├── business_emails
├── business_addresses
│
├── business_memberships
├── roles
└── auth_credentials
│
└── Parties
      │
      ├── Seller Profile
      ├── Distributor Profile
      ├── Customer Profile
      ├── Manufacturer Profile
      │      │
      │      └── Manufacturing Facilities
      │
      └── Brand Owner
             │
             └── Brands
                    │
                    └── Products
                           │
                           ├── Categories
                           ├── Media
                           ├── Inventory
                           └── Seller Products
```

---

# 15. Module Responsibility

Identity

* users
* businesses

Authentication

* auth_credentials

Permissions

* business_memberships
* roles

Commerce Identity

* parties

Commerce Capability

* party_capabilities

Brand Management

* brands

Manufacturing

* manufacturer_profiles
* manufacturer_facilities

Product Management

* products

Selling

* seller_profiles
* seller_products

Distribution

* distributor_profiles

Customer

* customer_profiles

Inventory

* warehouses
* inventory

Categories

* categories
* product_categories

Media

* media
* product_media
* brand_media

---

# 16. Design Principles

1. Users and Businesses are identities.
2. Business Memberships manage access only.
3. Parties are the commercial identity.
4. All commerce modules reference `party_id`.
5. Only Business Parties may own Brands.
6. Only Business Parties may become Manufacturers.
7. Manufacturing country belongs to Manufacturing Facilities.
8. Users may become Customers, Sellers and Distributors.
9. Businesses may become Customers, Sellers, Distributors, Manufacturers and Brand Owners.
10. Authentication and Commerce remain completely independent.
