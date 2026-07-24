import { db } from './db';
import { mockUsers } from './users';
import { mockEmails } from './emails';
import { mockUserEmails } from './userEmails';
import { mockAuthCredentials } from './authCredentials';
import { mockBusinesses } from './businesses';
import { mockBusinessMemberships } from './businessMemberships';
import { mockUserBusinessRoles } from './userBusinessRoles';
import { mockBusinessEmails } from './businessEmails';
import { mockUserAddresses } from './userAddresses';
import { mockUserIdentifications } from './userIdentifications';

let seedPromise: Promise<void> | null = null;

export const seedDatabase = async () => {
  if (seedPromise) {
    return seedPromise;
  }

  seedPromise = (async () => {
    try {
      const userCount = await db.users.count();
      if (userCount === 0) {
        console.log('Seeding mock users database...');
        await db.users.bulkPut(mockUsers as any);
        await db.emails.bulkPut(mockEmails as any);
        await db.userEmails.bulkPut(mockUserEmails as any);
        await db.authCredentials.bulkPut(mockAuthCredentials as any);
        await db.businesses.bulkPut(mockBusinesses as any);
        await db.businessMemberships.bulkPut(mockBusinessMemberships as any);
        await db.userBusinessRoles.bulkPut(mockUserBusinessRoles as any);
        await db.businessEmails.bulkPut(mockBusinessEmails as any);
        await db.userAddresses.bulkPut(mockUserAddresses as any);
        await db.userIdentifications.bulkPut(mockUserIdentifications as any);
        console.log('Mock users database seeded successfully.');
      }
    } catch (error) {
      console.error('Error seeding database:', error);
    }
  })();

  return seedPromise;
};

