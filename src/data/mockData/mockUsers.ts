import type { User, UserCredential, Address } from '../schemas';

export const mockUsers: User[] = Array.from({ length: 12 }, (_, i) => {
  const index = i + 1;
  const isPlatformAdmin = index === 2 || index === 12; // user-2 & user-12 are platform admins
  return {
    id: `user-${index}`,
    first_name: index === 1 ? 'John' : index === 2 ? 'Admin' : `UserFirstName ${index}`,
    last_name: index === 1 ? 'Doe' : index === 2 ? 'Master' : `UserLastName ${index}`,
    full_name: index === 1 ? 'John Doe' : index === 2 ? 'Admin Master' : `User ${index}`,
    national_id_hash: `hash-nat-id-${index}`,
    primary_phone_e164: `+1415555${1000 + index}`,
    preferred_locale: index % 2 === 0 ? 'en-US' : 'en-GB',
    timezone: index % 3 === 0 ? 'UTC' : index % 3 === 1 ? 'America/New_York' : 'Asia/Kolkata',
    country_of_residence: index % 2 === 0 ? 'USA' : 'IND',
    is_platform_active: isPlatformAdmin,
    is_active: true,
    terms_accepted_at: new Date('2026-01-01').toISOString(),
    privacy_policy_accepted_at: new Date('2026-01-01').toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
});

export const mockUserCredentials: UserCredential[] = mockUsers.map((user, i) => {
  const index = i + 1;
  const email = index === 1 ? 'user@email.com' : index === 2 ? 'admin@platform.com' : `user-${index}@delexy.com`;
  return {
    id: `cred-${index}`,
    user_id: user.id,
    email,
    password_hash: `hashed_password_${index}`,
    auth_type: 'PASSWORD',
    is_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
});

export const mockAddresses: Address[] = mockUsers.map((user, i) => {
  const index = i + 1;
  return {
    id: `addr-${index}`,
    entity_type: 'USER',
    entity_id: user.id,
    address_line1: `${index}0${index} Global Boulevard`,
    address_line2: `Suite ${index}00`,
    city: index % 2 === 0 ? 'New York' : 'Mumbai',
    state_province_region: index % 2 === 0 ? 'NY' : 'MH',
    postal_code: `${10000 + index}`,
    country_iso3: user.country_of_residence,
    is_primary: true,
    created_at: new Date().toISOString(),
  };
});
