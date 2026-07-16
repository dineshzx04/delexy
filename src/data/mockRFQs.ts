export type RFQType = 'direct' | 'targeted' | 'broadcast';
export type RFQStatus = 'Open' | 'Responded' | 'Closed' | 'Cancelled';
export type QuoteStatus = 'Pending' | 'Submitted' | 'Accepted' | 'Rejected';

export interface RFQItem {
  id: string;
  type: RFQType;
  categoryId?: string;
  platformProductId?: string;
  targetSku?: string;
  targetTenantId?: string;
  quantity: number;
}

export interface QuoteItem {
  rfqItemId: string;
  price: number;
  leadTimeDays: number;
}

export interface RFQQuote {
  id: string;
  responderTenantId: string;
  responderTenantName: string;
  items: QuoteItem[];
  notes: string;
  status: QuoteStatus;
  submittedAt: string;
}

export interface RFQ {
  id: string;
  status: RFQStatus;
  
  // Requester (Buyer)
  requesterTenantId: string;
  requesterTenantName: string;
  
  // Global RFQ Details
  requiredDate: string;
  shippingDestination: string;
  notes: string;
  
  createdAt: string;
  
  items: RFQItem[];
  quotes: RFQQuote[];
}

// In-memory store
let mockRFQs: RFQ[] = [
  {
    id: 'rfq-001',
    status: 'Responded',
    requesterTenantId: 'tenant-2',
    requesterTenantName: 'TechSource Procurement',
    requiredDate: '2023-12-01',
    shippingDestination: 'New York, USA',
    notes: 'Looking for best pricing on industrial servo motors. Need them by Q4.',
    createdAt: '2023-11-01T10:00:00Z',
    items: [
      {
        id: 'item-1',
        type: 'broadcast',
        categoryId: 'c-2-2-1-1',
        platformProductId: 'pp-3',
        quantity: 500
      }
    ],
    quotes: [
      {
        id: 'q-001',
        responderTenantId: 'tenant-1',
        responderTenantName: 'Acme Corp (Business)',
        notes: 'We can fulfill this from our standard stock.',
        status: 'Submitted',
        submittedAt: '2023-11-02T14:30:00Z',
        items: [
          { rfqItemId: 'item-1', price: 245.50, leadTimeDays: 14 }
        ]
      },
      {
        id: 'q-002',
        responderTenantId: 'tenant-3',
        responderTenantName: 'GlobalTech Industries',
        notes: 'Longer lead time due to shipping constraints.',
        status: 'Submitted',
        submittedAt: '2023-11-03T09:15:00Z',
        items: [
          { rfqItemId: 'item-1', price: 230.00, leadTimeDays: 30 }
        ]
      }
    ]
  },
  {
    id: 'rfq-002',
    status: 'Open',
    requesterTenantId: 'tenant-1',
    requesterTenantName: 'Acme Corp (Business)',
    requiredDate: '2023-12-15',
    shippingDestination: 'Texas, USA',
    notes: 'Direct RFQ for Micro Controller Pro.',
    createdAt: '2023-11-10T08:00:00Z',
    items: [
      {
        id: 'item-1',
        type: 'direct',
        targetSku: 'MC-R2-32-512',
        targetTenantId: 'tenant-1',
        quantity: 1000
      }
    ],
    quotes: []
  }
];

export const getRFQs = () => [...mockRFQs];

export const getRFQsByRequester = (tenantId: string) => 
  mockRFQs.filter(rfq => rfq.requesterTenantId === tenantId);

export const getRelevantRFQItems = (rfq: RFQ, tenantId: string): RFQItem[] => {
  return rfq.items.filter(item => 
    item.targetTenantId === tenantId || 
    (item.type === 'broadcast' && rfq.requesterTenantId !== tenantId)
  );
};

export const getRFQsReceived = (tenantId: string) => 
  mockRFQs.filter(rfq => {
    // A seller receives this RFQ if ANY item is targeted to them or broadcasted
    return getRelevantRFQItems(rfq, tenantId).length > 0;
  });

export const getRFQById = (id: string) => 
  mockRFQs.find(rfq => rfq.id === id);

export const createRFQ = (rfq: Omit<RFQ, 'id' | 'createdAt' | 'quotes' | 'status'>) => {
  const newRFQ: RFQ = {
    ...rfq,
    id: `rfq-${Date.now()}`,
    status: 'Open',
    createdAt: new Date().toISOString(),
    quotes: []
  };
  mockRFQs.push(newRFQ);
  return newRFQ;
};

export const submitQuote = (rfqId: string, quote: Omit<RFQQuote, 'id' | 'status' | 'submittedAt'>) => {
  const rfq = mockRFQs.find(r => r.id === rfqId);
  if (rfq) {
    const newQuote: RFQQuote = {
      ...quote,
      id: `q-${Date.now()}`,
      status: 'Submitted',
      submittedAt: new Date().toISOString()
    };
    rfq.quotes.push(newQuote);
    rfq.status = 'Responded';
    return newQuote;
  }
  return null;
};

export const acceptQuote = (rfqId: string, quoteId: string) => {
  const rfq = mockRFQs.find(r => r.id === rfqId);
  if (rfq) {
    rfq.quotes.forEach(q => {
      q.status = q.id === quoteId ? 'Accepted' : 'Rejected';
    });
    rfq.status = 'Closed';
  }
};
