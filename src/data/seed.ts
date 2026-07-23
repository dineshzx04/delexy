import { db } from './db';

let isSeeding = false;

export const seedDatabase = async (force = false) => {
  if (isSeeding) return;
  isSeeding = true;

  try {
    // Prevent duplicate seeding if data already exists and force is false
    const count = await db.users.count();
    if (count > 0 && !force) {
      return;
    }

    const timestamp = '2026-01-01T00:00:00Z';

    // Execute clear and seed inside an atomic Dexie transaction
    await db.transaction('rw', [
      db.emails,
      db.users,
      db.platformPermissions,
      db.platformRoles,
      db.platformRolePermissions,
      db.userPlatformRoles,
      db.userIdentifications,
      db.userEmails,
      db.userCredentials,
      db.businesses,
      db.businessEmails,
      db.businessPermissions,
      db.businessRoles,
      db.businessRolePermissions,
      db.businessMemberships,
      db.addresses,
      db.categories,
      db.attributeGroups,
      db.attributes,
      db.attributeValues,
      db.products,
    ], async () => {
      // Clear existing data across all tables
      await Promise.all([
        db.emails.clear(),
        db.users.clear(),
        db.platformPermissions.clear(),
        db.platformRoles.clear(),
        db.platformRolePermissions.clear(),
        db.userPlatformRoles.clear(),
        db.userIdentifications.clear(),
        db.userEmails.clear(),
        db.userCredentials.clear(),
        db.businesses.clear(),
        db.businessEmails.clear(),
        db.businessPermissions.clear(),
        db.businessRoles.clear(),
        db.businessRolePermissions.clear(),
        db.businessMemberships.clear(),
        db.addresses.clear(),
        db.categories.clear(),
        db.attributeGroups.clear(),
        db.attributes.clear(),
        db.attributeValues.clear(),
        db.products.clear(),
      ]);

      // =================================================================
      // 1. MASTER EMAILS
      // =================================================================
      await db.emails.bulkPut([
        { id: 'em-1', email: 'john.doe@delexy.com', is_verified: true, created_at: timestamp, updated_at: timestamp },
        { id: 'em-2', email: 'jane.smith@gmail.com', is_verified: true, created_at: timestamp, updated_at: timestamp },
        { id: 'em-3', email: 'jane@acmecorp.com', is_verified: true, created_at: timestamp, updated_at: timestamp },
        { id: 'em-4', email: 'jane@globaltech.com', is_verified: true, created_at: timestamp, updated_at: timestamp },
        { id: 'em-5', email: 'robert.t@acmecorp.com', is_verified: false, created_at: timestamp, updated_at: timestamp },
        { id: 'em-6', email: 'support@acmecorp.com', is_verified: true, created_at: timestamp, updated_at: timestamp },
        { id: 'em-7', email: 'billing@acmecorp.com', is_verified: true, created_at: timestamp, updated_at: timestamp },
      ]);

      // =================================================================
      // 2. CORE USERS
      // =================================================================
      await db.users.bulkPut([
        {
          id: 'usr-1',
          app_user_id: 'USR-001',
          first_name: 'John',
          last_name: 'Doe',
          full_name: 'User 1 - John Doe',
          date_of_birth: '1985-05-15',
          place_of_birth: 'New York, USA',
          country_of_residence: 'USA',
          is_platform_active: true, // Scenario 1: Platform Admin Mode Active
          is_active: true,
          created_at: timestamp,
          updated_at: timestamp,
        },
        {
          id: 'usr-2',
          app_user_id: 'USR-002',
          first_name: 'Jane',
          last_name: 'Smith',
          full_name: 'User 2 - Jane Smith',
          date_of_birth: '1990-08-22',
          place_of_birth: 'London, UK',
          country_of_residence: 'GBR',
          is_platform_active: false, // Scenario 2: Multi-Tenant Business Owner/Member
          is_active: true,
          created_at: timestamp,
          updated_at: timestamp,
        },
        {
          id: 'usr-3',
          app_user_id: 'USR-003',
          first_name: 'Robert',
          last_name: 'Taylor',
          full_name: 'User 3 - Robert Taylor',
          date_of_birth: '1995-11-03',
          place_of_birth: 'Toronto, Canada',
          country_of_residence: 'CAN',
          is_platform_active: false, // Scenario 3: Invited Guest / Pending KYC User
          is_active: true,
          created_at: timestamp,
          updated_at: timestamp,
        },
      ]);

      // =================================================================
      // 3. PLATFORM ROLES & PERMISSIONS
      // =================================================================
      await db.platformPermissions.bulkPut([
        { id: 'pperm-1', code: 'platform.businesses.view', description: 'View all platform businesses', created_at: timestamp },
        { id: 'pperm-2', code: 'platform.users.manage', description: 'Manage global users', created_at: timestamp },
      ]);

      await db.platformRoles.bulkPut([
        { id: 'prole-1', name: 'Platform Super Admin', description: 'Full platform administration access', is_system_default: true, created_at: timestamp },
      ]);

      await db.platformRolePermissions.bulkPut([
        { id: 'prp-1', role_id: 'prole-1', permission_id: 'pperm-1' },
        { id: 'prp-2', role_id: 'prole-1', permission_id: 'pperm-2' },
      ]);

      await db.userPlatformRoles.bulkPut([
        { id: 'upr-1', user_id: 'usr-1', role_id: 'prole-1', granted_at: timestamp },
      ]);

      // =================================================================
      // 4. KYC IDENTIFICATIONS
      // =================================================================
      await db.userIdentifications.bulkPut([
        {
          id: 'uid-1',
          user_id: 'usr-1',
          id_type: 'NATIONAL_ID',
          issuing_country: 'USA',
          id_number_hash: 'hash_usr1_natid_9921',
          is_primary: true,
          verification_status: 'VERIFIED',
          expiry_date: '2030-12-31',
          created_at: timestamp,
          updated_at: timestamp,
        },
        {
          id: 'uid-2',
          user_id: 'usr-2',
          id_type: 'PASSPORT',
          issuing_country: 'GBR',
          id_number_hash: 'hash_usr2_passport_4412',
          is_primary: true,
          verification_status: 'VERIFIED',
          expiry_date: '2028-06-30',
          created_at: timestamp,
          updated_at: timestamp,
        },
        {
          id: 'uid-3',
          user_id: 'usr-3',
          id_type: 'DRIVERS_LICENSE',
          issuing_country: 'CAN',
          id_number_hash: 'hash_usr3_dl_1029',
          is_primary: true,
          verification_status: 'PENDING',
          expiry_date: '2027-09-15',
          created_at: timestamp,
          updated_at: timestamp,
        },
      ]);

      // =================================================================
      // 5. USER EMAILS & CREDENTIALS
      // =================================================================
      await db.userEmails.bulkPut([
        { id: 'uemail-1', user_id: 'usr-1', email_id: 'em-1', is_primary: true, is_self_added: true, created_at: timestamp },
        { id: 'uemail-2', user_id: 'usr-2', email_id: 'em-2', is_primary: true, is_self_added: true, created_at: timestamp },
        { id: 'uemail-3', user_id: 'usr-2', email_id: 'em-3', is_primary: false, is_self_added: false, created_at: timestamp },
        { id: 'uemail-4', user_id: 'usr-2', email_id: 'em-4', is_primary: false, is_self_added: false, created_at: timestamp },
        { id: 'uemail-5', user_id: 'usr-3', email_id: 'em-5', is_primary: false, is_self_added: false, created_at: timestamp },
      ]);

      await db.userCredentials.bulkPut([
        { id: 'ucred-1', user_id: 'usr-1', email_id: 'em-1', password_hash: '$2a$12$e8X5L8hash...', auth_type: 'PASSWORD', created_at: timestamp, updated_at: timestamp },
        { id: 'ucred-2', user_id: 'usr-2', email_id: null, password_hash: '$2a$12$b7Y9K2hash...', auth_type: 'PASSWORD', created_at: timestamp, updated_at: timestamp },
        { id: 'ucred-3', user_id: 'usr-2', email_id: 'em-3', password_hash: '$2a$12$k2M3L1hash...', auth_type: 'PASSWORD', created_at: timestamp, updated_at: timestamp },
        { id: 'ucred-4', user_id: 'usr-3', email_id: 'em-5', password_hash: '$2a$12$p4N1M2hash...', auth_type: 'PASSWORD', created_at: timestamp, updated_at: timestamp },
      ]);

      // =================================================================
      // 6. BUSINESSES & TENANT ROLES
      // =================================================================
      await db.businesses.bulkPut([
        { id: 'biz-1', name: 'Acme Corporation', slug: 'acme-corp', is_active: true, created_at: timestamp, updated_at: timestamp },
        { id: 'biz-2', name: 'Global Tech Ltd', slug: 'global-tech', is_active: true, created_at: timestamp, updated_at: timestamp },
      ]);

      await db.businessEmails.bulkPut([
        { id: 'bemail-1', business_id: 'biz-1', email_id: 'em-6', email_type: 'SUPPORT', label: 'Support Desk', created_at: timestamp },
        { id: 'bemail-2', business_id: 'biz-1', email_id: 'em-7', email_type: 'BILLING', label: 'Accounts Payable', created_at: timestamp },
      ]);

      await db.businessPermissions.bulkPut([
        { id: 'bperm-1', code: 'business.invoices.create', description: 'Create and edit tenant invoices', created_at: timestamp },
        { id: 'bperm-2', code: 'business.members.manage', description: 'Invite and update business team members', created_at: timestamp },
      ]);

      await db.businessRoles.bulkPut([
        { id: 'brole-1', business_id: 'biz-1', name: 'Business Admin', description: 'Full business administration', created_at: timestamp },
        { id: 'brole-2', business_id: 'biz-2', name: 'Finance Manager', description: 'Financial management access', created_at: timestamp },
        { id: 'brole-3', business_id: 'biz-1', name: 'Team Member', description: 'Standard employee role', created_at: timestamp },
      ]);

      await db.businessRolePermissions.bulkPut([
        { id: 'brp-1', role_id: 'brole-1', permission_id: 'bperm-1' },
        { id: 'brp-2', role_id: 'brole-1', permission_id: 'bperm-2' },
        { id: 'brp-3', role_id: 'brole-2', permission_id: 'bperm-1' },
      ]);

      // =================================================================
      // 7. BUSINESS MEMBERSHIPS
      // =================================================================
      await db.businessMemberships.bulkPut([
        {
          id: 'bmem-1',
          business_id: 'biz-1',
          user_id: 'usr-1',
          membership_type: 'MEMBER',
          role_id: 'brole-3',
          contact_email_id: 'em-1',
          status: 'FROZEN_BY_PLATFORM', // Trigger 1 result: usr-1 has is_platform_active = true
          created_at: timestamp,
          updated_at: timestamp,
        },
        {
          id: 'bmem-2',
          business_id: 'biz-1',
          user_id: 'usr-2',
          membership_type: 'OWNER',
          role_id: 'brole-1',
          contact_email_id: 'em-3',
          status: 'ACTIVE',
          created_at: timestamp,
          updated_at: timestamp,
        },
        {
          id: 'bmem-3',
          business_id: 'biz-2',
          user_id: 'usr-2',
          membership_type: 'MEMBER',
          role_id: 'brole-2',
          contact_email_id: 'em-4',
          status: 'ACTIVE',
          created_at: timestamp,
          updated_at: timestamp,
        },
        {
          id: 'bmem-4',
          business_id: 'biz-1',
          user_id: 'usr-3',
          membership_type: 'GUEST',
          role_id: 'brole-3',
          contact_email_id: 'em-5',
          status: 'ACTIVE',
          created_at: timestamp,
          updated_at: timestamp,
        },
      ]);

      // =================================================================
      // 8. ADDRESSES
      // =================================================================
      await db.addresses.bulkPut([
        {
          id: 'addr-1',
          user_id: 'usr-1',
          business_id: null,
          address_type: 'RESIDENTIAL',
          street_line1: '100 Broadway St',
          street_line2: 'Apt 4B',
          city: 'New York',
          state: 'NY',
          postal_code: '10001',
          country: 'USA',
          is_primary: true,
          created_at: timestamp,
        },
        {
          id: 'addr-2',
          user_id: null,
          business_id: 'biz-1',
          address_type: 'REGISTERED_OFFICE',
          street_line1: '500 Tech Parkway',
          street_line2: 'Suite 200',
          city: 'San Francisco',
          state: 'CA',
          postal_code: '94105',
          country: 'USA',
          is_primary: true,
          created_at: timestamp,
        },
        {
          id: 'addr-3',
          user_id: null,
          business_id: 'biz-2',
          address_type: 'REGISTERED_OFFICE',
          street_line1: '25 Finsbury Circus',
          street_line2: null,
          city: 'London',
          state: 'Greater London',
          postal_code: 'EC2M 7EE',
          country: 'GBR',
          is_primary: true,
          created_at: timestamp,
        },
        {
          id: 'addr-4',
          user_id: 'usr-3',
          business_id: null,
          address_type: 'RESIDENTIAL',
          street_line1: '45 King St W',
          street_line2: null,
          city: 'Toronto',
          state: 'ON',
          postal_code: 'M5H 1J8',
          country: 'CAN',
          is_primary: true,
          created_at: timestamp,
        },
      ]);

      // =================================================================
      // 9. TAXONOMY & PRODUCTS
      // =================================================================
      await db.attributeValues.bulkPut([
        { id: 'val-1', value: 'v-black', label: 'Black', sortOrder: 1, created_at: timestamp },
        { id: 'val-2', value: 'v-silver', label: 'Silver', sortOrder: 2, created_at: timestamp },
        { id: 'val-3', value: 'v-16gb', label: '16 GB', sortOrder: 1, created_at: timestamp },
        { id: 'val-4', value: 'v-32gb', label: '32 GB', sortOrder: 2, created_at: timestamp },
        { id: 'val-5', value: 'v-intel-i7', label: 'Intel Core i7', sortOrder: 1, created_at: timestamp },
      ]);

      await db.attributes.bulkPut([
        { id: 'attr-1', code: 'color', name: 'Color', label: 'Color', inputType: 'select', type: 'select', valueIds: ['val-1', 'val-2'], created_at: timestamp },
        { id: 'attr-2', code: 'ram', name: 'RAM Capacity', label: 'RAM Capacity', inputType: 'select', type: 'select', unit: 'GB', valueIds: ['val-3', 'val-4'], created_at: timestamp },
        { id: 'attr-3', code: 'processor', name: 'Processor', label: 'Processor', inputType: 'select', type: 'select', valueIds: ['val-5'], created_at: timestamp },
      ]);

      await db.attributeGroups.bulkPut([
        { id: 'grp-1', code: 'hardware-specs', name: 'Hardware Specifications', description: 'Core compute unit specs', attributeIds: ['attr-1', 'attr-2', 'attr-3'], created_at: timestamp },
      ]);

      await db.categories.bulkPut([
        { id: 'cat-1', parentId: null, name: 'Cat 1 - Electronics', slug: 'cat-1-electronics', mappedGroupIds: ['grp-1'], created_at: timestamp },
        { id: 'cat-2', parentId: 'cat-1', name: 'Cat 2 - Computers & Servers', slug: 'cat-2-computers-servers', mappedGroupIds: ['grp-1'], created_at: timestamp },
      ]);

      await db.products.bulkPut([
        {
          id: 'prod-1',
          name: 'Prod 1 - Enterprise Server Pro',
          categoryId: 'cat-2',
          SKU: 'SKU-PROD-001',
          dynamicAttributes: { 'attr-1': 'val-1', 'attr-2': 'val-4', 'attr-3': 'val-5' },
          globalSpecs: { 'attr-1': 'val-1' },
          created_at: timestamp,
        },
      ]);
    });

    console.log('Delexy DB seeded successfully with all 21 tables and strict taxonomy mapping.');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    isSeeding = false;
  }
};
