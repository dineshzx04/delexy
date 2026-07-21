import { categories } from './src/data/mockData/categories';
import { groups } from './src/data/mockData/attributeGroups';
import { attributes } from './src/data/mockData/attributes';
import { values } from './src/data/mockData/attributeValues';
import * as fs from 'fs';

// Helper to strictly resolve attributes for a given category
function getStrictAttributes(categoryId: string) {
  const cat = categories.find(c => c.id === categoryId);
  if (!cat) return {};

  const dynAttrs: any = {};
  
  cat.mappedGroupIds.forEach(gId => {
    const group = groups.find(g => g.id === gId);
    if (!group) return;
    
    group.attributeIds.forEach((attrId, aIdx) => {
      const attr = attributes.find(a => a.id === attrId);
      if (!attr) return;
      
      const valObjs = attr.valueIds.map(vid => values.find(v => v.id === vid));
      
      if (valObjs.length > 0) {
        // Just pick the first available valid option to ensure it's strictly compliant
        dynAttrs[attr.name] = valObjs[0]?.value; 
      }
    });
  });

  return dynAttrs;
}

const rfqs = [
  {
    id: 'rfq-001',
    rfqNumber: 'RFQ-2026-1001',
    title: 'Q1 Restock for Pumping & Valve Stations',
    status: 'Open',
    requesterTenantId: 'tenant-1',
    requesterTenantName: 'Acme Corp (Business)',
    contactEmail: 'procurement@acme.com',
    contactMobile: '+1-555-0192',
    submissionDeadline: '2026-08-15',
    currency: 'USD',
    shippingDestination: 'New York, USA',
    specifications: 'Standard specs apply. Must include certifications.',
    createdAt: new Date().toISOString(),
    items: [
      {
        id: 'item-1',
        targetTenantId: 'org-2',
        categoryId: 'c-1-1-2-1', // Centrifugal Pumps
        platformProductId: 'pp-1',
        quantity: 50,
        unit: 'Pieces',
        brand: ['Acme'],
        manufacturer: ['Acme Corp'],
        countryOfOrigin: 'USA',
        height: '20cm',
        weight: '50kg',
        dynamicAttributes: getStrictAttributes('c-1-1-2-1')
      },
      {
        id: 'item-2',
        // No targetTenantId -> Open (Broadcast) item
        categoryId: 'c-1-1-3-1', // Gate Valves
        quantity: 200,
        unit: 'Pieces',
        brand: ['ValvCo'],
        dynamicAttributes: getStrictAttributes('c-1-1-3-1')
      }
    ],
    quotes: []
  },
  {
    id: 'rfq-002',
    rfqNumber: 'RFQ-2026-1002',
    title: 'Urgent: AC Motors for Factory Floor',
    status: 'Responded',
    requesterTenantId: 'org-2',
    requesterTenantName: 'Global Machinery Inc',
    contactEmail: 'sourcing@globalmachinery.com',
    contactMobile: '+1-555-9921',
    submissionDeadline: '2026-08-01',
    currency: 'USD',
    shippingDestination: 'Texas, USA',
    specifications: 'Require fastest shipping possible. Looking for direct replacement parts.',
    createdAt: new Date().toISOString(),
    items: [
      {
        id: 'item-3',
        targetTenantId: 'tenant-1',
        categoryId: 'c-1-1-1-1', // AC Motors
        quantity: 100,
        unit: 'Pieces',
        brand: ['Acme'],
        modelNumber: 'ACM-100',
        dynamicAttributes: getStrictAttributes('c-1-1-1-1')
      }
    ],
    quotes: [
      {
        id: 'q-001',
        responderTenantId: 'tenant-1',
        responderTenantName: 'Acme Corp (Business)',
        notes: 'We have these in stock and can ship immediately from our TX warehouse.',
        status: 'Submitted',
        submittedAt: new Date().toISOString(),
        items: [
          { 
            rfqItemId: 'item-3', 
            price: 245.50, 
            leadTimeDays: 2,
            responseType: 'OPEN_RFQ', // Uses the custom spec approach
            quotedSpecifications: {
              brand: ['Acme'],
              // Introducing a DEVIAITON here: requested was Value 7, but quoted is Value 8
              dynamicAttributes: {
                'Attribute 1': 'Value 1',
                'Attribute 2': 'Value 4',
                'Attribute 3': 'Value 8', // Deviation
                'Attribute 4': 'Value 10'
              }
            }
          }
        ],
        chatLog: [
          {
            id: 'chat-1',
            quoteId: 'q-001',
            itemId: 'item-3',
            senderTenantId: 'org-2', // Buyer asking question
            message: 'We noticed you quoted Value 8 for Attribute 3. Do you have any Value 7 in stock?',
            timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            fieldContext: 'dynamicAttributes.Attribute 3'
          },
          {
            id: 'chat-2',
            quoteId: 'q-001',
            itemId: 'item-3',
            senderTenantId: 'tenant-1', // Seller replying
            message: 'Unfortunately we are out of Value 7, but Value 8 is a direct, higher-rated replacement that fits the same spec.',
            timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
            fieldContext: 'dynamicAttributes.Attribute 3'
          }
        ]
      }
    ]
  }
];

const fileContent = `export const rfqs = ${JSON.stringify(rfqs, null, 2)};\n`;
fs.writeFileSync('src/data/mockData/rfqs.ts', fileContent);
console.log('Successfully generated rfqs.ts');
