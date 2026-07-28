import Dexie, { type Table } from 'dexie';
import type { AuthCredential, Business, BusinessEmail, BusinessMembership, EmailRecord, User, UserAddress, UserBusinessRole, UserEmail, UserIdentification } from './user.module';

export * from './user.module';

export class UserDatabase extends Dexie {
  users!: Table<User, string>;
  emails!: Table<EmailRecord, string>;
  userEmails!: Table<UserEmail, string>;
  authCredentials!: Table<AuthCredential, string>;
  businesses!: Table<Business, string>;
  businessMemberships!: Table<BusinessMembership, string>;
  userBusinessRoles!: Table<UserBusinessRole, string>;
  businessEmails!: Table<BusinessEmail, string>;
  userAddresses!: Table<UserAddress, string>;
  userIdentifications!: Table<UserIdentification, string>;

  constructor() {
    super('delexyUserDB');
    this.version(4).stores({
      users: 'id, app_user_id',
      emails: 'id, email',
      userEmails: 'id, user_id, email_id',
      authCredentials: 'id, email_id, user_id, business_membership_id',
      businesses: 'id, slug',
      businessMemberships: 'id, business_id, user_id',
      userBusinessRoles: 'id, business_id',
      businessEmails: 'id, business_id, email_id',
      userAddresses: 'id, user_id',
      userIdentifications: 'id, user_id',
    });
  }
}

export const userDb = new UserDatabase();
