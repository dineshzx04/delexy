import type { Rfq } from './rfq.module';

export const mockRfqs: Rfq[] = [
  {
    id: 'rfq-2026-1001',
    rfq_number: 'RFQ-2026-1001',
    title: 'Q3 Corporate Smartphone Restock & Custom Equipment',
    description: 'Bulk procurement of 100 units of flagship mobile devices.',
    
    requester_party_id: 'pty-1',          // Samsung Electronics India Party (parties.ts)
    requester_party_type: 'BUSINESS',
    requester_name: 'Samsung Electronics India Party',
    created_by_user_id: 'usr-2',          // John Doe (users.ts)

    contact_email: 'john.doe@samsung-india.com',
    contact_phone: '+91-9876543210',
    shipping_destination: 'Samsung India HQ Facility, New Delhi, India',
    
    status: 'FULLY_AWARDED',
    submission_deadline: '2026-08-30T23:59:59.000Z',
    
    total_items_count: 1,
    total_estimated_budget: 100000,
    currency: 'USD',

    attachments: [
      {
        id: 'att-1',
        file_name: 'Sourcing_Specification_V1.pdf',
        file_url: 'https://delexy.internal/docs/Sourcing_Specification_V1.pdf',
        file_type: 'application/pdf',
        file_size: '2.4 MB',
        uploaded_at: '2026-08-01T10:00:00.000Z',
      }
    ],

    timeline: [
      {
        id: 'tl-1',
        rfq_id: 'rfq-2026-1001',
        event_type: 'ISSUED',
        actor_name: 'John Doe',
        actor_id: 'usr-2',
        timestamp: '2026-08-01T10:00:00.000Z',
        remarks: 'RFQ published with 1 item targeting 2 sellers.',
      },
      {
        id: 'tl-2',
        rfq_id: 'rfq-2026-1001',
        event_type: 'AWARDED',
        actor_name: 'John Doe',
        actor_id: 'usr-2',
        timestamp: '2026-08-02T12:05:00.000Z',
        remarks: 'Split award completed across Sony Corp (60 units) and ASUSTeK (40 units).',
      }
    ],

    created_at: '2026-08-01T10:00:00.000Z',
    updated_at: '2026-08-02T12:05:00.000Z',
  }
];
