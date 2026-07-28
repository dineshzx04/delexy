Here is your complete, updated prompt. All mock data tables are consolidated into **a single structured CSV block** (which can be easily copied directly into Excel or Google Sheets), and the prompt explicitly instructs the architecture generator to process it as a unified spreadsheet export.

---

## Technical Architecture Document Prompt

```markdown
Act as a Principal Software Architect. Generate a formal, production-grade Software Architecture Document (SAD) based on the multi-tenant catalog and identity specifications below.

### System Architecture Scope:

1. Master Catalog Engine (Many-to-Many Dynamic EAV Schema):
   - Hierarchical Categories (`hierarchical_categories`).
   - Standalone Attribute Groups (`attribute_groups`), Attributes (`attributes`), and Attribute Values (`attribute_values`).
   - Many-to-Many junction mapping between Groups and Attributes (`attribute_group_attributes`).
   - Many-to-Many junction mapping between Attributes and Values (`attribute_attribute_values`).
   - Category Product templates that enforce dynamic attribute bindings.

2. Dual-Portal Authentication & Zero-Trust Isolation Engine:
   - Physical Identity anchored to National ID (`users.national_id`) supporting multiple verified emails.
   - Portal 1 (Global SSO Portal):
     - Authenticates via `app_user_id` or Primary Email + Master Password (`global_credentials`).
     - Issues JWT with `can_switch_context: true`. Grants access to Personal Account and context switching across linked businesses.
   - Portal 2 (Isolated Business Portal - Pattern 1 Implementation):
     - Authenticates using a unique business identity handle (e.g., `username.tenant`) + Tenant Password (`tenant_credentials`).
     - Uses a globally unique database index on `business_identity` to prevent cross-tenant lookup leaks.
     - Issues JWT with `can_switch_context: false`. Strictly restricts session context to the current tenant workspace with zero cross-tenant credential leakage.

3. Seller Product Onboarding & Variant Matrix Generator:
   - Static attributes (`model_number`, `part_number`, `title`).
   - Dynamic attribute driver toggling:
     - Toggle OFF -> Stores spec in `product_global_attributes`.
     - Toggle ON -> Feeds into Cartesian Product Matrix Generator to issue SKUs, Prices, and Stock levels in `product_variants`.

---

### Complete System DDL Schema (PostgreSQL):

```sql
-- 1. MASTER CATALOG SCHEMAS (MANY-TO-MANY ATTRIBUTES)
CREATE TABLE hierarchical_categories (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    parent_id VARCHAR REFERENCES hierarchical_categories(id)
);

CREATE TABLE attribute_groups (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL
);

CREATE TABLE attributes (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    data_type VARCHAR NOT NULL DEFAULT 'String'
);

CREATE TABLE attribute_values (
    id VARCHAR PRIMARY KEY,
    value VARCHAR NOT NULL
);

-- Pivot: Groups <-> Attributes (Many-to-Many)
CREATE TABLE attribute_group_attributes (
    group_id VARCHAR REFERENCES attribute_groups(id) ON DELETE CASCADE,
    attribute_id VARCHAR REFERENCES attributes(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, attribute_id)
);

-- Pivot: Attributes <-> Values (Many-to-Many)
CREATE TABLE attribute_attribute_values (
    attribute_id VARCHAR REFERENCES attributes(id) ON DELETE CASCADE,
    attribute_value_id VARCHAR REFERENCES attribute_values(id) ON DELETE CASCADE,
    PRIMARY KEY (attribute_id, attribute_value_id)
);

CREATE TABLE category_products (
    id VARCHAR PRIMARY KEY,
    category_id VARCHAR REFERENCES hierarchical_categories(id),
    name VARCHAR NOT NULL
);

CREATE TABLE category_product_attributes (
    category_product_id VARCHAR REFERENCES category_products(id),
    attribute_id VARCHAR REFERENCES attributes(id),
    PRIMARY KEY (category_product_id, attribute_id)
);

-- 2. USER IDENTITY & MULTI-TENANCY SCHEMAS (PATTERN 1)
CREATE TABLE users (
    id VARCHAR PRIMARY KEY, -- app_user_id
    national_id VARCHAR UNIQUE NOT NULL,
    full_name VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_emails (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    email VARCHAR UNIQUE NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE
);

CREATE TABLE global_credentials (
    user_id VARCHAR PRIMARY KEY REFERENCES users(id),
    password_hash VARCHAR NOT NULL
);

CREATE TABLE businesses (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    owner_user_id VARCHAR REFERENCES users(id)
);

CREATE TABLE tenant_memberships (
    id VARCHAR PRIMARY KEY,
    business_id VARCHAR REFERENCES businesses(id),
    user_id VARCHAR REFERENCES users(id),
    user_email_id VARCHAR REFERENCES user_emails(id),
    role VARCHAR NOT NULL DEFAULT 'MEMBER',
    status VARCHAR DEFAULT 'ACTIVE',
    UNIQUE(business_id, user_id)
);

CREATE TABLE tenant_credentials (
    id VARCHAR PRIMARY KEY,
    membership_id VARCHAR UNIQUE REFERENCES tenant_memberships(id),
    business_identity VARCHAR UNIQUE NOT NULL, -- Pattern 1 Unique Handle (e.g. alex.apexelectronics)
    password_hash VARCHAR NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ONBOARDING & VARIANT SCHEMAS
CREATE TABLE seller_products (
    id VARCHAR PRIMARY KEY,
    business_id VARCHAR REFERENCES businesses(id),
    category_product_id VARCHAR REFERENCES category_products(id),
    model_number VARCHAR NOT NULL,
    part_number VARCHAR NOT NULL,
    title VARCHAR NOT NULL
);

CREATE TABLE product_global_attributes (
    id VARCHAR PRIMARY KEY,
    seller_product_id VARCHAR REFERENCES seller_products(id),
    attribute_id VARCHAR REFERENCES attributes(id),
    attribute_value_id VARCHAR REFERENCES attribute_values(id)
);

CREATE TABLE product_variants (
    id VARCHAR PRIMARY KEY,
    seller_product_id VARCHAR REFERENCES seller_products(id),
    sku VARCHAR UNIQUE NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0
);

CREATE TABLE variant_attribute_values (
    variant_id VARCHAR REFERENCES product_variants(id),
    attribute_id VARCHAR REFERENCES attributes(id),
    attribute_value_id VARCHAR REFERENCES attribute_values(id),
    PRIMARY KEY (variant_id, attribute_id, attribute_value_id)
);

```

---

### Mapped System Mock Data (Consolidated Excel/CSV Workbook Export):

Note: Below is the complete mock dataset containing all system entities mapped together into a unified spreadsheet structure (minimum 5 mapped records per table):

```csv
Table_Name,col_1,col_2,col_3,col_4,col_5,col_6
hierarchical_categories,cat_101,Electronics,NULL,,,
hierarchical_categories,cat_102,Computing & Laptops,cat_101,,,
hierarchical_categories,cat_103,Laptops,cat_102,,,
hierarchical_categories,cat_104,Audio & Sound,cat_101,,,
hierarchical_categories,cat_105,Wireless Headphones,cat_104,,,
attribute_groups,grp_1,Performance & Hardware,,,,
attribute_groups,grp_2,Display & Visuals,,,,
attribute_groups,grp_3,Memory & Storage,,,,
attribute_groups,grp_4,Physical & Aesthetics,,,,
attribute_groups,grp_5,Power & Connectivity,,,,
attributes,attr_1,Processor Model,String,,,
attributes,attr_2,RAM Size,String,,,
attributes,attr_3,Storage Capacity,String,,,
attributes,attr_4,Color Finish,String,,,
attributes,attr_5,Display Refresh Rate,String,,,
attribute_values,val_1,Intel Core i7-13700H,,,,
attribute_values,val_2,16GB DDR5,,,,
attribute_values,val_3,32GB DDR5,,,,
attribute_values,val_4,512GB NVMe SSD,,,,
attribute_values,val_5,Space Gray,,,,
attribute_group_attributes,grp_1,attr_1,,,,
attribute_group_attributes,grp_1,attr_2,,,,
attribute_group_attributes,grp_3,attr_2,,,,
attribute_group_attributes,grp_3,attr_3,,,,
attribute_group_attributes,grp_4,attr_4,,,,
attribute_attribute_values,attr_1,val_1,,,,
attribute_attribute_values,attr_2,val_2,,,,
attribute_attribute_values,attr_2,val_3,,,,
attribute_attribute_values,attr_3,val_4,,,,
attribute_attribute_values,attr_4,val_5,,,,
category_products,cp_1,cat_103,Professional Ultrabook,,,
category_products,cp_2,cat_103,Gaming Laptop,,,
category_products,cp_3,cat_105,ANC Wireless Headphones,,,
category_products,cp_4,cat_103,Convertible 2-in-1 Laptop,,,
category_products,cp_5,cat_105,Studio Monitor Headphones,,,
category_product_attributes,cp_1,attr_1,,,,
category_product_attributes,cp_1,attr_2,,,,
category_product_attributes,cp_1,attr_3,,,,
category_product_attributes,cp_1,attr_4,,,,
category_product_attributes,cp_2,attr_5,,,,
users,usr_1,NID-998811,Alex Mercer,2026-01-10 10:00:00,,
users,usr_2,NID-443322,Sarah Connor,2026-01-11 11:30:00,,
users,usr_3,NID-112233,Bruce Wayne,2026-01-12 09:15:00,,
users,usr_4,NID-556677,Clark Kent,2026-01-13 14:20:00,,
users,usr_5,NID-889900,Diana Prince,2026-01-14 16:45:00,,
user_emails,em_1,usr_1,alex.personal@gmail.com,TRUE,TRUE,
user_emails,em_2,usr_1,alex.dev@outlook.com,FALSE,TRUE,
user_emails,em_3,usr_2,sarah@techcorp.com,TRUE,TRUE,
user_emails,em_4,usr_3,bruce@wayneenterprises.com,TRUE,TRUE,
user_emails,em_5,usr_4,clark@dailyplanet.com,TRUE,TRUE,
global_credentials,usr_1,$2a$12$MasterHashAlex...,,,,
global_credentials,usr_2,$2a$12$MasterHashSarah...,,,,
global_credentials,usr_3,$2a$12$MasterHashBruce...,,,,
global_credentials,usr_4,$2a$12$MasterHashClark...,,,,
global_credentials,usr_5,$2a$12$MasterHashDiana...,,,,
businesses,biz_1,usr_1,Apex Electronics Ltd,,,
businesses,biz_2,usr_2,Cyberdyne Systems,,,
businesses,biz_3,usr_3,Wayne Technologies,,,
businesses,biz_4,usr_4,Metropolis Tech Depot,,,
businesses,biz_5,usr_5,Themyscira Audio,,,
tenant_memberships,mem_1,biz_1,usr_1,em_1,OWNER,ACTIVE
tenant_memberships,mem_2,biz_2,usr_1,em_1,MEMBER,ACTIVE
tenant_memberships,mem_3,biz_2,usr_2,em_3,OWNER,ACTIVE
tenant_memberships,mem_4,biz_3,usr_3,em_4,OWNER,ACTIVE
tenant_memberships,mem_5,biz_1,usr_5,em_5,MEMBER,ACTIVE
tenant_credentials,tc_1,mem_1,alex.apexelectronics,$2a$12$ApexHash1...,2026-01-10 10:00:00
tenant_credentials,tc_2,mem_2,alex.cyberdyne,$2a$12$CyberHash2...,2026-01-11 11:00:00
tenant_credentials,tc_3,mem_3,sarah.cyberdyne,$2a$12$CyberHash3...,2026-01-11 11:30:00
tenant_credentials,tc_4,mem_4,bruce.waynetech,$2a$12$WayneHash4...,2026-01-12 09:15:00
tenant_credentials,tc_5,mem_5,diana.apexelectronics,$2a$12$ApexHash5...,2026-01-14 16:45:00
seller_products,sp_1,biz_1,cp_1,XPS-15-2026,PN-DEL-9530,Apex Pro Book 15
seller_products,sp_2,biz_1,cp_2,G15-2026,PN-G15-88,Apex Titan Gaming Laptop
seller_products,sp_3,biz_2,cp_1,CD-800,PN-CYB-800,Cyberdyne Workstation Pro
seller_products,sp_4,biz_3,cp_3,WH-1000,PN-WAY-1000,Bat-Sound ANC Headphone
seller_products,sp_5,biz_4,cp_4,FLEX-14,PN-MET-14F,Metropolis Flex 14-inch
product_global_attributes,pga_1,sp_1,attr_1,val_1,,
product_global_attributes,pga_2,sp_2,attr_1,val_1,,
product_global_attributes,pga_3,sp_3,attr_1,val_1,,
product_global_attributes,pga_4,sp_4,attr_4,val_5,,
product_global_attributes,pga_5,sp_5,attr_5,val_5,,
product_variants,var_1,sp_1,APX-PB15-16-512-GRY,1299.99,50,
product_variants,var_2,sp_1,APX-PB15-32-512-GRY,1599.99,30,
product_variants,var_3,sp_2,APX-TITAN-16-512-GRY,1899.99,20,
product_variants,var_4,sp_3,CYB-800-32-512-GRY,2100.00,10,
product_variants,var_5,sp_4,BAT-WH1000-BLK,349.99,100,
variant_attribute_values,var_1,attr_2,val_2,,,
variant_attribute_values,var_1,attr_3,val_4,,,
variant_attribute_values,var_1,attr_4,val_5,,,
variant_attribute_values,var_2,attr_2,val_3,,,
variant_attribute_values,var_2,attr_3,val_4,,,

```

---

### Document Sections Required:

1. Executive Architectural Summary
2. System Topology & Context Diagrams (Mermaid syntax)
3. Database Architecture & ERD Diagram Explanation based on the DDL and consolidated spreadsheet data
4. Authentication Sequence Diagrams for:
a) Portal 1 Global SSO & Workspace Context Switcher
b) Portal 2 Isolated Tenant Authentication (Pattern 1 Unique Handle)
c) Tenant Password Reset Flow (Scoped strictly to `membership_id`)
5. OpenAPI 3.0 API Specification for:
* Master Catalog & Dynamic Many-to-Many Attribute Management
* Authentication Endpoints (`/auth/login`, `/auth/business-login`, `/auth/switch-context`)
* Product Onboarding & Variant Matrix Generator


6. Threat Modeling, Security Audit & Multi-Tenant Data Isolation Strategy (SOC2 / ISO27001 Alignment)

```

```



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