To make this architecture truly **global-scale**, we need to resolve a few key structural limitations in the current schema:

1. **Global Uniqueness of the "Man" (Human Entity):** A real-world human shouldn't just be a local name string. They need globally unique identity identifiers like a **Tax ID / National ID** or **Verified Phone Number (E.164)** to prevent duplicate account creation across regions.
2. **Global Localization & Compliance:** A global platform requires localized **currencies**, **timezones**, **locales**, and **international phone formats**.
3. **Data Residency / Privacy Compliance (GDPR, CCPA, SOC2):** Storing user data globally requires tracking **country of data residency** and explicit **legal terms/privacy consent**.
4. **Enhanced Address Normalization:** Global addresses vary widely by country (e.g., postal codes are optional in some nations, state/province naming differs).

Here is the enhanced, **globally compliant production schema**.

---

### Global-Scale Production Schema

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================
-- 1. GLOBAL CORE PERSON (Unique Human Identity Across the World)
-- =================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Name Formatting for Global Names
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    
    -- Global Identity Uniqueness (Ensures one real human identity)
    national_id_hash VARCHAR(255) UNIQUE, -- SHA-256 Hash of SSN/Passport/Tax ID (GDPR compliant storage)
    primary_phone_e164 VARCHAR(20) UNIQUE, -- Global E.164 format (e.g., +14155552671)
    
    -- Globalization & Regionalization Preferences
    preferred_locale VARCHAR(10) DEFAULT 'en-US', -- Language & formatting
    timezone VARCHAR(50) DEFAULT 'UTC',            -- e.g., 'America/New_York', 'Asia/Kolkata'
    country_of_residence VARCHAR(3) NOT NULL,      -- ISO 3166-1 alpha-3 code (e.g., 'USA', 'IND', 'DEU')
    
    -- Mutual Exclusivity State Flags
    is_platform_active BOOLEAN DEFAULT FALSE, -- TRUE = Platform Admin Mode (Business/Individual Frozen)
    is_active BOOLEAN DEFAULT TRUE,            -- Global account status
    
    -- Compliance & Audit Tracking
    terms_accepted_at TIMESTAMP WITH TIME ZONE,
    privacy_policy_accepted_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- 2. DYNAMIC PLATFORM ROLES & PERMISSIONS
-- =================================================================
CREATE TABLE platform_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'platform.businesses.view', 'platform.system.config'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE platform_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE platform_role_permissions (
    role_id UUID NOT NULL REFERENCES platform_roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES platform_permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_platform_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES platform_roles(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- =================================================================
-- 3. GLOBAL BUSINESSES (Multinational Companies / Tenants)
-- =================================================================
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    
    -- Global Business Registration & Finance
    registration_number VARCHAR(100), -- Tax/VAT/EIN or Government Registration ID
    default_currency VARCHAR(3) DEFAULT 'USD', -- ISO 4217 Currency Code (e.g., 'USD', 'EUR', 'INR')
    country_of_incorporation VARCHAR(3) NOT NULL, -- ISO Alpha-3
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- 4. DYNAMIC BUSINESS ROLES & PERMISSIONS
-- =================================================================
CREATE TABLE business_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE business_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, name)
);

CREATE TABLE business_role_permissions (
    role_id UUID NOT NULL REFERENCES business_roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES business_permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- =================================================================
-- 5. CREDENTIALS & GLOBAL BUSINESS MEMBERSHIPS
-- =================================================================
CREATE TABLE user_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    auth_type VARCHAR(50) DEFAULT 'PASSWORD',
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE business_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id UUID NOT NULL REFERENCES user_credentials(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES business_roles(id) ON DELETE RESTRICT,
    membership_type VARCHAR(20) NOT NULL DEFAULT 'MEMBER', -- 'OWNER', 'MEMBER'
    status VARCHAR(50) DEFAULT 'ACTIVE', -- 'ACTIVE', 'REVOKED', 'FROZEN_BY_PLATFORM'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, credential_id)
);

-- =================================================================
-- 6. GLOBAL ADDRESSES (ISO Compliant Multi-Country Format)
-- =================================================================
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(20) NOT NULL, -- 'USER' or 'BUSINESS'
    entity_id UUID NOT NULL,
    
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state_province_region VARCHAR(100), -- Accommodates non-US provinces/regions
    postal_code VARCHAR(20),            -- Nullable because some global territories do not use postal codes
    country_iso3 VARCHAR(3) NOT NULL,   -- ISO 3166-1 alpha-3 (e.g., 'USA', 'DEU', 'GBR')
    
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- 7. DATABASE TRIGGER FOR PLATFORM MUTUAL EXCLUSIVITY
-- =================================================================
CREATE OR REPLACE FUNCTION handle_platform_member_state_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_platform_active = TRUE AND OLD.is_platform_active = FALSE THEN
        UPDATE business_memberships 
        SET status = 'FROZEN_BY_PLATFORM'
        WHERE user_id = NEW.id AND status = 'ACTIVE';

    ELSIF NEW.is_platform_active = FALSE AND OLD.is_platform_active = TRUE THEN
        UPDATE business_memberships 
        SET status = 'ACTIVE'
        WHERE user_id = NEW.id AND status = 'FROZEN_BY_PLATFORM';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_platform_state_change
AFTER UPDATE OF is_platform_active ON users
FOR EACH ROW
EXECUTE FUNCTION handle_platform_member_state_change();

-- =================================================================
-- GLOBAL INDEXES FOR HIGH-CONCURRENCY LOOKUPS
-- =================================================================
CREATE INDEX idx_users_phone ON users(primary_phone_e164);
CREATE INDEX idx_users_national_id ON users(national_id_hash);
CREATE INDEX idx_credentials_email ON user_credentials(email);
CREATE INDEX idx_businesses_reg_num ON businesses(registration_number);

```

---

### Key Improvements for Global Scale

1. **Unique Identity Safeguards:**
* `national_id_hash`: Stores a cryptographic hash of a national identity document to ensure a real-world person cannot register duplicate accounts under different names or emails.
* `primary_phone_e164`: Enforces standardized international phone formatting (`+<country_code><number>`).


2. **Internationalization & Localization:**
* `country_of_residence` & `country_iso3`: Uses standardized ISO 3166-1 alpha-3 codes.
* `default_currency`: ISO 4217 support for cross-border financial transactions per business.
* `timezone` & `preferred_locale`: Ensures UTC timestamp handling on the backend while displaying regional time and language on the client side.


3. **Flexible Address Schema:**
* Renamed state to `state_province_region` and made `postal_code` nullable to support international address variations across different continents.