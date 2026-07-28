import { userDb } from './user/userDb';
import { mockUsers } from './user/users';
import { mockEmails } from './user/emails';
import { mockUserEmails } from './user/userEmails';
import { mockAuthCredentials } from './user/authCredentials';
import { mockBusinesses } from './user/businesses';
import { mockBusinessMemberships } from './user/businessMemberships';
import { mockUserBusinessRoles } from './user/userBusinessRoles';
import { mockBusinessEmails } from './user/businessEmails';
import { mockUserAddresses } from './user/userAddresses';
import { mockUserIdentifications } from './user/userIdentifications';

let seedPromise: Promise<void> | null = null;

export const seedDatabase = async () => {
  if (seedPromise) {
    return seedPromise;
  }

  seedPromise = (async () => {
    try {
      const userCount = await userDb.users.count();
      if (userCount === 0) {
        console.log('Seeding mock users database...');
        await userDb.users.bulkPut(mockUsers as any);
        await userDb.emails.bulkPut(mockEmails as any);
        await userDb.userEmails.bulkPut(mockUserEmails as any);
        await userDb.authCredentials.bulkPut(mockAuthCredentials as any);
        await userDb.businesses.bulkPut(mockBusinesses as any);
        await userDb.businessMemberships.bulkPut(mockBusinessMemberships as any);
        await userDb.userBusinessRoles.bulkPut(mockUserBusinessRoles as any);
        await userDb.businessEmails.bulkPut(mockBusinessEmails as any);
        await userDb.userAddresses.bulkPut(mockUserAddresses as any);
        await userDb.userIdentifications.bulkPut(mockUserIdentifications as any);
        console.log('Mock users database seeded successfully.');
      }
    } catch (error) {
      console.error('Error seeding database:', error);
    }
  })();

  return seedPromise;
};

