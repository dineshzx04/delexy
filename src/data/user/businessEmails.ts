import type { BusinessEmail } from './user.module';

export const mockBusinessEmails: BusinessEmail[] = [
  {
    id: 'be-1',
    business_id: 'bus-a',
    email_id: 'em-101',
    email_type: 'PRIMARY',
    label: 'Main Office Contact',
    is_verified: true,
    created_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'be-2',
    business_id: 'bus-b',
    email_id: 'em-103',
    email_type: 'PRIMARY',
    label: 'Main Office Contact',
    is_verified: true,
    created_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'be-3',
    business_id: 'bus-c',
    email_id: 'em-102',
    email_type: 'PRIMARY',
    label: 'Main Office Contact',
    is_verified: true,
    created_at: '2026-03-15T08:00:00.000Z',
  },
];
