import { userDb } from './user.db';
import { mockUsers } from './users';
import { mockEmails } from './emails';
import { mockUserEmails } from './userEmails';
import { mockUserIdentifications } from './userIdentifications';
import { mockBusinesses } from './businesses';
import { mockAddresses } from './addresses';
import { mockBusinessEmails } from './businessEmails';
import { mockRoles } from './roles';
import { mockBusinessMemberships } from './businessMemberships';
import { mockAuthCredentials } from './authCredentials';
import { mockPlatformRoles } from './platformRoles';
import { mockPlatformMemberships } from './platformMemberships';

export {
  mockUsers,
  mockEmails,
  mockUserEmails,
  mockUserIdentifications,
  mockBusinesses,
  mockAddresses,
  mockBusinessEmails,
  mockRoles,
  mockBusinessMemberships,
  mockAuthCredentials,
  mockPlatformRoles,
  mockPlatformMemberships
};

export const seedUserModule = async () => {
  const count = await userDb.users.count();
  if (count === 0) {
    await userDb.users.bulkPut(mockUsers);
    await userDb.emails.bulkPut(mockEmails);
    await userDb.userEmails.bulkPut(mockUserEmails);
    await userDb.userIdentifications.bulkPut(mockUserIdentifications);
    await userDb.businesses.bulkPut(mockBusinesses);
    await userDb.addresses.bulkPut(mockAddresses);
    await userDb.businessEmails.bulkPut(mockBusinessEmails);
    await userDb.roles.bulkPut(mockRoles);
    await userDb.businessMemberships.bulkPut(mockBusinessMemberships);
    await userDb.authCredentials.bulkPut(mockAuthCredentials);
    await userDb.platformRoles.bulkPut(mockPlatformRoles);
    await userDb.platformMemberships.bulkPut(mockPlatformMemberships);
    console.log('[User Module] Database seeded successfully.');
  }
};

export const seedIdentityModule = seedUserModule;
