import type { UserEmail } from './user.module';

export const mockUserEmails: UserEmail[] = [
  // User 2: John Doe Personal Emails (Primary & Secondary)
  {
    id: 'ue-1',
    user_id: 'usr-2',
    email_id: 'em-101',
    is_primary: true,
    is_self_added: true,
    is_verified: true,
    created_at: '2026-01-15T08:00:00.000Z',
    updated_at: '2026-01-15T12:30:45.657Z',
  },
  {
    id: 'ue-2',
    user_id: 'usr-2',
    email_id: 'em-102',
    is_primary: false,
    is_self_added: true,
    is_verified: true,
    created_at: '2026-03-15T08:00:00.000Z',
    updated_at: '2026-03-15T08:00:00.000Z',
  },
  // User 3: Alice Smith Personal Email
  {
    id: 'ue-3',
    user_id: 'usr-3',
    email_id: 'em-104',
    is_primary: true,
    is_self_added: true,
    is_verified: true,
    created_at: '2026-03-15T08:00:00.000Z',
    updated_at: '2026-03-15T08:00:00.000Z',
  },
  // User 4: Robert Johnson Personal Email
  {
    id: 'ue-4',
    user_id: 'usr-4',
    email_id: 'em-107',
    is_primary: true,
    is_self_added: true,
    is_verified: true,
    created_at: '2026-04-10T08:00:00.000Z',
    updated_at: '2026-04-10T08:00:00.000Z',
  },
];
