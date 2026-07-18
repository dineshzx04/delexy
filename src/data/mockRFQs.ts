export type RFQStatus = 'Open' | 'Responded' | 'Closed' | 'Cancelled';
export type QuoteStatus = 'Pending' | 'Submitted' | 'Accepted' | 'Rejected';

export interface RFQItem {
  id: string;
  categoryId?: string;
  platformProductId?: string;
  targetTenantId?: string;
  quantity: number;
  unit?: string;

  // New Static Fields for Target/Broadcast
  brand?: string;
  manufacturer?: string;
  countryOfOrigin?: string;
  modelNumber?: string;
  partNumber?: string;
  height?: string;
  width?: string;
  weight?: string;

  // Dynamic Attributes based on Category
  dynamicAttributes?: Record<string, string>;
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
  rfqNumber: string;
  title: string;
  status: RFQStatus;

  // Requester (Buyer)
  requesterTenantId: string;
  requesterTenantName: string;
  contactEmail: string;
  contactMobile: string;

  // Global RFQ Details
  submissionDeadline: string;
  shippingDestination: string;
  currency: string;
  specifications: string;

  createdAt: string;

  items: RFQItem[];
  quotes: RFQQuote[];
}

// In-memory store
let mockRFQs: RFQ[] = [
  {
    // INBOUND RFQ for org-1
    id: 'rfq-001',
    rfqNumber: 'RFQ-2023-1001',
    title: 'Q4 Industrial Motor & Phone Restock',
    status: 'Responded',
    requesterTenantId: 'org-2',
    requesterTenantName: 'XYZ Manufacturing Ltd',
    contactEmail: 'procurement@xyz.com',
    contactMobile: '+1-555-0192',
    submissionDeadline: '2023-11-15',
    currency: 'USD',
    shippingDestination: 'New York, USA',
    specifications: 'Standard specs apply.',
    createdAt: '2023-11-01T10:00:00Z',
    items: [
      {
        id: 'item-1',
        targetTenantId: 'org-1', // Targeted to org-1 (Current User will see this)
        categoryId: 'c-2-2-1-1',
        platformProductId: 'pp-3',
        quantity: 500,
        brand: 'Acme',
        manufacturer: 'Acme Corp',
        countryOfOrigin: 'USA',
        height: '20cm',
        weight: '5kg'
      },
      {
        id: 'item-2',
        targetTenantId: 'org-3', // Targeted to someone else (Current User will NOT see this in Inbound)
        categoryId: 'c-1-1-1-1',
        platformProductId: 'pp-1',
        quantity: 200,
        brand: 'Apple'
      }
    ],
    quotes: [
      {
        id: 'q-001',
        responderTenantId: 'org-1',
        responderTenantName: 'ABC Engineering Pvt Ltd',
        notes: 'We can fulfill this from our standard stock.',
        status: 'Submitted',
        submittedAt: '2023-11-02T14:30:00Z',
        items: [
          { rfqItemId: 'item-1', price: 245.50, leadTimeDays: 14 }
        ]
      }
    ]
  },
  {
    // OUTBOUND RFQ for org-1
    id: 'rfq-002',
    rfqNumber: 'RFQ-2023-1002',
    title: 'Office Hardware Upgrades',
    status: 'Open',
    requesterTenantId: 'org-1',
    requesterTenantName: 'ABC Engineering Pvt Ltd',
    contactEmail: 'sourcing@abceng.com',
    contactMobile: '+1-555-9921',
    submissionDeadline: '2023-11-20',
    currency: 'USD',
    shippingDestination: 'Texas, USA',
    specifications: 'Require fastest shipping possible.',
    createdAt: '2023-11-10T08:00:00Z',
    items: [
      {
        id: 'item-1',
        targetTenantId: 'org-2', // Targeted away from self
        categoryId: 'c-1-1-1-1',
        platformProductId: 'pp-1',
        quantity: 100,
        unit: 'Pieces',
        brand: 'Apple',
        modelNumber: 'iPhone 14 Pro'
      },
      {
        id: 'item-2',
        // No targetTenantId -> Open (Broadcast) item
        categoryId: 'c-1-1-1-2',
        // No platformProductId -> "not product mapped"
        quantity: 50,
        unit: 'Units',
        brand: 'Apple',
        dynamicAttributes: {
          'Screen Size': '15 inch',
          'Processor': 'M2',
          'RAM': '16GB'
        }
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
    (!item.targetTenantId && rfq.requesterTenantId !== tenantId)
  );
};

export const getRFQsReceived = (tenantId: string) =>
  mockRFQs.filter(rfq => {
    // A seller receives this RFQ if ANY item is targeted to them or broadcasted
    return getRelevantRFQItems(rfq, tenantId).length > 0;
  });

export const getRFQById = (id: string) =>
  mockRFQs.find(rfq => rfq.id === id);

export const createRFQ = (rfq: Omit<RFQ, 'id' | 'rfqNumber' | 'createdAt' | 'quotes' | 'status'>) => {
  const newId = `rfq-${Date.now()}`;
  const newRFQ: RFQ = {
    ...rfq,
    id: newId,
    rfqNumber: `RFQ-${Math.floor(1000 + Math.random() * 9000)}`,
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
