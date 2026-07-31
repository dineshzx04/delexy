import Dexie, { type Table } from 'dexie';
import type {
  User,
  EmailRecord,
  UserEmail,
  UserIdentification,
  Business,
  Address,
  BusinessEmail,
  Role,
  BusinessMembership,
  AuthCredential,
  PlatformRole,
  PlatformMembership
} from './user.module';

export class UserDatabase extends Dexie {
  users!: Table<User, string>;
  emails!: Table<EmailRecord, string>;
  userEmails!: Table<UserEmail, string>;
  userIdentifications!: Table<UserIdentification, string>;
  businesses!: Table<Business, string>;
  addresses!: Table<Address, string>;
  businessEmails!: Table<BusinessEmail, string>;
  roles!: Table<Role, string>;
  businessMemberships!: Table<BusinessMembership, string>;
  authCredentials!: Table<AuthCredential, string>;
  platformRoles!: Table<PlatformRole, string>;
  platformMemberships!: Table<PlatformMembership, string>;

  constructor() {
    super('delexy_user_db');
    this.version(1).stores({
      users: 'id, app_user_id',
      emails: 'id, email, type',
      userEmails: 'id, user_id, email_id',
      userIdentifications: 'id, user_id',
      businesses: 'id, slug',
      addresses: 'id, party_id, country_code, is_primary',
      businessEmails: 'id, business_id, email_id',
      roles: 'id, business_id',
      businessMemberships: 'id, business_id, user_id, email_id',
      authCredentials: 'id, email_id, user_id, business_membership_id',
      platformRoles: 'id, role_name',
      platformMemberships: 'id, user_id, platform_role_id, status',
    });
  }
}

export const userDb = new UserDatabase();
export const identityDb = userDb; // Backwards compatibility alias
