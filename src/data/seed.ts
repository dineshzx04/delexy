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

export const seedDatabase = async () => {
  try {
    const userCount = await db.users.count();
    if (userCount === 0) {
      console.log('Seeding mock users database...');
      await db.users.bulkAdd(mockUsers as any);
      await db.emails.bulkAdd(mockEmails as any);
      await db.userEmails.bulkAdd(mockUserEmails as any);
      await db.authCredentials.bulkAdd(mockAuthCredentials as any);
      await db.businesses.bulkAdd(mockBusinesses as any);
      await db.businessMemberships.bulkAdd(mockBusinessMemberships as any);
      await db.userBusinessRoles.bulkAdd(mockUserBusinessRoles as any);
      await db.businessEmails.bulkAdd(mockBusinessEmails as any);
      await db.userAddresses.bulkAdd(mockUserAddresses as any);
      await db.userIdentifications.bulkAdd(mockUserIdentifications as any);
      console.log('Mock users database seeded successfully.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
