-- Disable foreign key checks during setup
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables if re-running script
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS business_memberships;
DROP TABLE IF EXISTS business_role_permissions;
DROP TABLE IF EXISTS business_roles;
DROP TABLE IF EXISTS business_permissions;
DROP TABLE IF EXISTS business_emails;
DROP TABLE IF EXISTS businesses;
DROP TABLE IF EXISTS user_credentials;
DROP TABLE IF EXISTS user_emails;
DROP TABLE IF EXISTS user_identifications;
DROP TABLE IF EXISTS emails;
DROP TABLE IF EXISTS user_platform_roles;
DROP TABLE IF EXISTS platform_role_permissions;
DROP TABLE IF EXISTS platform_roles;
DROP TABLE IF EXISTS platform_permissions;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- =================================================================
-- 1. MASTER EMAILS TABLE (Zero Duplication Source of Truth)
-- =================================================================
CREATE TABLE emails (
    id CHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_emails_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =================================================================
-- 2. CORE USERS
-- =================================================================
CREATE TABLE users (
    id CHAR(36) NOT NULL,
    app_user_id VARCHAR(50) NOT NULL, -- e.g., 'USR-984201'
    
    -- Real-World Persona
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    date_of_birth DATE NOT NULL,
    place_of_birth VARCHAR(150) NOT NULL,
    country_of_residence VARCHAR(100) NOT NULL,
    
    -- Mutual Exclusivity State Flags
    is_platform_active BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE = Platform Admin Mode
    is_active BOOLEAN NOT NULL DEFAULT TRUE,          -- Global account status
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_app_user_id (app_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================
-- 3. MULTI-ID / KYC IDENTIFICATIONS
-- =================================================================
CREATE TABLE user_identifications (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    
    id_type VARCHAR(50) NOT NULL, -- 'NATIONAL_ID', 'PASSPORT', 'DRIVERS_LICENSE', 'SSN', 'TAX_ID'
    issuing_country VARCHAR(100) NOT NULL,
    id_number_hash VARCHAR(255) NOT NULL, -- SHA-256 HASH for fraud check
    
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'VERIFIED', 'REJECTED'
    expiry_date DATE NULL,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_country_idtype (user_id, issuing_country, id_type),
    UNIQUE KEY uq_id_hash (id_number_hash),
    CONSTRAINT fk_user_identifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =================================================================
-- 4. USER EMAILS & AUTHENTICATION CREDENTIALS
-- =================================================================
CREATE TABLE user_emails (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    email_id CHAR(36) NOT NULL,
    
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_self_added BOOLEAN NOT NULL DEFAULT TRUE, -- FALSE = Business Invite (Cannot be Primary)
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_email (user_id, email_id),
    CONSTRAINT fk_user_emails_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_emails_email FOREIGN KEY (email_id) REFERENCES emails (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_credentials (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    email_id CHAR(36) NOT NULL, -- NULL = Global Login Password; Specified = Scoped Work Password
    password_hash VARCHAR(255) NOT NULL,
    auth_type VARCHAR(50) NOT NULL DEFAULT 'PASSWORD',
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    CONSTRAINT fk_user_credentials_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_credentials_email FOREIGN KEY (email_id) REFERENCES emails (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =================================================================
-- 5. BUSINESSES & DYNAMIC TENANT ROLES
-- =================================================================
CREATE TABLE businesses (
    id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_businesses_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE business_emails (
    id CHAR(36) NOT NULL,
    business_id CHAR(36) NOT NULL,
    email_id CHAR(36) NOT NULL,
    
    email_type VARCHAR(50) NOT NULL DEFAULT 'PRIMARY', -- 'PRIMARY', 'BILLING', 'SUPPORT', 'LEGAL'
    label VARCHAR(100) NULL,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_business_email_type (business_id, email_id, email_type),
    CONSTRAINT fk_business_emails_business FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
    CONSTRAINT fk_business_emails_email FOREIGN KEY (email_id) REFERENCES emails (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE business_permissions (
    id CHAR(36) NOT NULL,
    code VARCHAR(100) NOT NULL, -- e.g., 'business.invoices.create'
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_bus_perm_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE business_roles (
    id CHAR(36) NOT NULL,
    business_id CHAR(36) NULL, -- NULL = System Default Template
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE business_role_permissions (
    role_id CHAR(36) NOT NULL,
    permission_id CHAR(36) NOT NULL,
    
    PRIMARY KEY (role_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE platform_permissions (
    id CHAR(36) NOT NULL,
    code VARCHAR(100) NOT NULL, -- e.g., 'platform.businesses.view'
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_platform_perm_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE platform_roles (
    id CHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL, -- e.g., 'Platform Super Admin'
    description TEXT NULL,
    is_system_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_platform_role_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE platform_role_permissions (
    role_id CHAR(36) NOT NULL,
    permission_id CHAR(36) NOT NULL,
    
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_prp_role FOREIGN KEY (role_id) REFERENCES platform_roles (id) ON DELETE CASCADE,
    CONSTRAINT fk_prp_perm FOREIGN KEY (permission_id) REFERENCES platform_permissions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_platform_roles (
    user_id CHAR(36) NOT NULL,
    role_id CHAR(36) NOT NULL,
    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_upr_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_upr_role FOREIGN KEY (role_id) REFERENCES platform_roles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================
-- 6. BUSINESS MEMBERSHIPS (The Core Bridge)
-- =================================================================
CREATE TABLE business_memberships (
    id CHAR(36) NOT NULL,
    business_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    
    -- EXPLICIT MEMBERSHIP TYPE
    membership_type VARCHAR(20) NOT NULL DEFAULT 'MEMBER', -- 'OWNER', 'MEMBER', 'GUEST'
    
    -- Granular Role
    role_id CHAR(36) NOT NULL,
    
    -- Specific Contact Email assigned to this business
    contact_email_id CHAR(36) NULL,
    
    -- Status controlled by admins AND platform state triggers
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'REVOKED', 'FROZEN_BY_PLATFORM'
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    UNIQUE KEY uq_business_membership (business_id, user_id),
    CONSTRAINT fk_bm_business FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
    CONSTRAINT fk_bm_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_bm_role FOREIGN KEY (role_id) REFERENCES business_roles (id) ON DELETE RESTRICT,
    CONSTRAINT fk_bm_email FOREIGN KEY (contact_email_id) REFERENCES emails (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =================================================================
-- 7. ADDRESSES TABLE
-- =================================================================
CREATE TABLE addresses (
    id CHAR(36) NOT NULL,
    
    -- Owner Mapping (User OR Business)
    user_id CHAR(36) NULL,
    business_id CHAR(36) NULL,
    
    address_type VARCHAR(50) NOT NULL DEFAULT 'PRIMARY', -- 'RESIDENTIAL', 'MAILING', 'REGISTERED_OFFICE'
    street_line1 VARCHAR(255) NOT NULL,
    street_line2 VARCHAR(255) NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_addresses_business FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
    
    -- Constraint: Must belong to EITHER User OR Business
    CONSTRAINT chk_address_owner CHECK (
        (user_id IS NOT NULL AND business_id IS NULL) OR
        (user_id IS NULL AND business_id IS NOT NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =================================================================
-- 8. MYSQL TRIGGERS FOR MUTUAL EXCLUSIVITY
-- =================================================================
DELIMITER $$

-- Trigger 1: Handles Platform Admin Mode Mutual Exclusivity State Changes
CREATE TRIGGER trg_user_platform_state_change
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    -- Case 1: Activated as Platform Admin -> Freeze all Business Memberships
    IF NEW.is_platform_active = TRUE AND OLD.is_platform_active = FALSE THEN
        UPDATE business_memberships 
        SET status = 'FROZEN_BY_PLATFORM'
        WHERE user_id = NEW.id AND status = 'ACTIVE';

    -- Case 2: Deactivated from Platform Admin -> Unfreeze Business Memberships
    ELSIF NEW.is_platform_active = FALSE AND OLD.is_platform_active = TRUE THEN
        UPDATE business_memberships 
        SET status = 'ACTIVE'
        WHERE user_id = NEW.id AND status = 'FROZEN_BY_PLATFORM';
    END IF;
END$$


-- Trigger 2: Prevents promoting a non-self-added email to Primary
CREATE TRIGGER trg_check_primary_email_promotion
BEFORE UPDATE ON user_emails
FOR EACH ROW
BEGIN
    IF NEW.is_primary = TRUE AND NEW.is_self_added = FALSE THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Security Violation: Emails added via business invitations cannot be set as Primary Email.';
    END IF;
END$$

DELIMITER ;