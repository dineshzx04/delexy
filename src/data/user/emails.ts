import type { EmailRecord } from './user.module';

export const mockEmails: EmailRecord[] = [
  {
    id: 'em-101',
    email: 'john.personal@gmail.com',
    type: 'PERSONAL',
    created_at: '2026-01-15T08:00:00.000Z',
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'em-102',
    email: 'john2.personal@gmail.com',
    type: 'PERSONAL',
    created_at: '2026-01-15T08:00:00.000Z',
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'em-103',
    email: 'business.a@gmail.com',
    type: 'PERSONAL',
    created_at: '2026-01-15T08:00:00.000Z',
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'em-104',
    email: 'alice.personal@gmail.com',
    type: 'PERSONAL',
    created_at: '2026-03-15T08:00:00.000Z',
    updated_at: '2026-03-15T08:00:00.000Z',
  },
  {
    id: 'em-105',
    email: 'alice.business@gmail.com',
    type: 'MEMBER',
    created_at: '2026-03-15T08:00:00.000Z',
    updated_at: '2026-03-15T08:00:00.000Z',
  },
  {
    id: 'em-106',
    email: 'john.member@gmail.com',
    type: 'MEMBER',
    created_at: '2026-03-15T08:00:00.000Z',
    updated_at: '2026-03-15T08:00:00.000Z',
  }
];
