import type { EmailRecord } from './user.module';

export const mockEmails: EmailRecord[] = [
  // Personal User Emails (Referenced ONLY in userEmails.ts)
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
    id: 'em-104',
    email: 'alice.personal@gmail.com',
    type: 'PERSONAL',
    created_at: '2026-03-15T08:00:00.000Z',
    updated_at: '2026-03-15T08:00:00.000Z',
  },
  {
    id: 'em-107',
    email: 'robert.personal@gmail.com',
    type: 'PERSONAL',
    created_at: '2026-04-10T08:00:00.000Z',
    updated_at: '2026-04-10T08:00:00.000Z',
  },

  // Member & Business Corporate Emails (Referenced ONLY in businessMemberships.ts and businessEmails.ts)
  {
    id: 'em-103',
    email: 'contact.samsungin@gmail.com',
    type: 'MEMBER',
    created_at: '2026-01-15T08:00:00.000Z',
    updated_at: '2026-01-15T08:00:00.000Z',
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
  },
  {
    id: 'em-108',
    email: 'robert.business@gmail.com',
    type: 'MEMBER',
    created_at: '2026-04-10T08:00:00.000Z',
    updated_at: '2026-04-10T08:00:00.000Z',
  },
  {
    id: 'em-109',
    email: 'contact.samsunguk@gmail.com',
    type: 'MEMBER',
    created_at: '2026-01-15T08:00:00.000Z',
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'em-110',
    email: 'contact.businessc@gmail.com',
    type: 'MEMBER',
    created_at: '2026-03-15T08:00:00.000Z',
    updated_at: '2026-03-15T08:00:00.000Z',
  },
];
