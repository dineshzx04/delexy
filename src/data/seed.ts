import { db } from './db';
import {
  mockUsers,
  mockUserCredentials,
  mockAddresses,
  mockBusinesses,
  mockBusinessPermissions,
  mockBusinessRoles,
  mockBusinessRolePermissions,
  mockBusinessMemberships,
  mockPlatformPermissions,
  mockPlatformRoles,
  mockPlatformRolePermissions,
  mockUserPlatformRoles,
  mockAttributeValues,
  mockAttributes,
  mockAttributeGroups,
  mockCategories,
} from './mockData';

export const seedDatabase = async () => {
  try {
    const userCount = await db.users.count();
    if (userCount > 0) {
      console.log('Database already seeded.');
      return;
    }

    console.log('Seeding Mock Database with Prefix IDs & Mapped Data (>10 entries per table)...');

    // 1. Core Users & Credentials & Addresses
    await db.users.bulkAdd(mockUsers);
    await db.userCredentials.bulkAdd(mockUserCredentials);
    await db.addresses.bulkAdd(mockAddresses);

    // 2. Platform RBAC
    await db.platformPermissions.bulkAdd(mockPlatformPermissions);
    await db.platformRoles.bulkAdd(mockPlatformRoles);
    await db.platformRolePermissions.bulkAdd(mockPlatformRolePermissions);
    await db.userPlatformRoles.bulkAdd(mockUserPlatformRoles);

    // 3. Businesses & Business RBAC & Memberships
    await db.businesses.bulkAdd(mockBusinesses);
    await db.businessPermissions.bulkAdd(mockBusinessPermissions);
    await db.businessRoles.bulkAdd(mockBusinessRoles);
    await db.businessRolePermissions.bulkAdd(mockBusinessRolePermissions);
    await db.businessMemberships.bulkAdd(mockBusinessMemberships);

    // 4. Attributes, Values, Groups & Categories
    await db.attributeValues.bulkAdd(mockAttributeValues);
    await db.attributes.bulkAdd(mockAttributes);
    await db.attributeGroups.bulkAdd(mockAttributeGroups);
    await db.categories.bulkAdd(mockCategories);

    console.log('Mock database seeded successfully with >10 entries per table.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
