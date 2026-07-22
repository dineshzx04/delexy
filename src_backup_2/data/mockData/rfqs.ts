export const rfqs = [
  {
    "id": "rfq-001",
    "rfqNumber": "RFQ-2026-1001",
    "title": "Q1 Restock for Pumping & Valve Stations",
    "status": "Open",
    "requesterTenantId": "tenant-1",
    "requesterTenantName": "Acme Corp (Business)",
    "contactEmail": "procurement@acme.com",
    "contactMobile": "+1-555-0192",
    "submissionDeadline": "2026-08-15",
    "currency": "USD",
    "shippingDestination": "New York, USA",
    "specifications": "Standard specs apply. Must include certifications.",
    "createdAt": "2026-07-20T11:52:58.417Z",
    "items": [
      {
        "id": "item-1",
        "targetTenantId": "org-2",
        "categoryId": "c-1-1-2-1",
        "platformProductId": "pp-1",
        "quantity": 50,
        "unit": "Pieces",
        "brand": [
          "Acme"
        ],
        "manufacturer": [
          "Acme Corp"
        ],
        "countryOfOrigin": "USA",
        "height": "20cm",
        "weight": "50kg",
        "dynamicAttributes": {
          "Attribute 13": "Value 37",
          "Attribute 14": "Value 40",
          "Attribute 15": "Value 43",
          "Attribute 16": "Value 46"
        }
      },
      {
        "id": "item-2",
        "categoryId": "c-1-1-3-1",
        "quantity": 200,
        "unit": "Pieces",
        "brand": [
          "ValvCo"
        ],
        "dynamicAttributes": {
          "Attribute 25": "Value 73",
          "Attribute 26": "Value 76",
          "Attribute 27": "Value 79",
          "Attribute 28": "Value 82"
        }
      }
    ],
    "quotes": []
  },
  {
    "id": "rfq-002",
    "rfqNumber": "RFQ-2026-1002",
    "title": "Urgent: AC Motors for Factory Floor",
    "status": "Responded",
    "requesterTenantId": "org-2",
    "requesterTenantName": "Global Machinery Inc",
    "contactEmail": "sourcing@globalmachinery.com",
    "contactMobile": "+1-555-9921",
    "submissionDeadline": "2026-08-01",
    "currency": "USD",
    "shippingDestination": "Texas, USA",
    "specifications": "Require fastest shipping possible. Looking for direct replacement parts.",
    "createdAt": "2026-07-20T11:52:58.418Z",
    "items": [
      {
        "id": "item-3",
        "targetTenantId": "tenant-1",
        "categoryId": "c-1-1-1-1",
        "quantity": 100,
        "unit": "Pieces",
        "brand": [
          "Acme"
        ],
        "modelNumber": "ACM-100",
        "dynamicAttributes": {
          "Attribute 1": "Value 1",
          "Attribute 2": "Value 4",
          "Attribute 3": "Value 7",
          "Attribute 4": "Value 10"
        }
      }
    ],
    "quotes": [
      {
        "id": "q-001",
        "responderTenantId": "tenant-1",
        "responderTenantName": "Acme Corp (Business)",
        "notes": "We have these in stock and can ship immediately from our TX warehouse.",
        "status": "Submitted",
        "submittedAt": "2026-07-20T11:52:58.418Z",
        "items": [
          {
            "rfqItemId": "item-3",
            "price": 245.5,
            "leadTimeDays": 2,
            "responseType": "OPEN_RFQ",
            "quotedSpecifications": {
              "brand": [
                "Acme"
              ],
              "dynamicAttributes": {
                "Attribute 1": "Value 1",
                "Attribute 2": "Value 4",
                "Attribute 3": "Value 8",
                "Attribute 4": "Value 10"
              }
            }
          }
        ],
        "chatLog": [
          {
            "id": "chat-1",
            "quoteId": "q-001",
            "itemId": "item-3",
            "senderTenantId": "org-2",
            "message": "We noticed you quoted Value 8 for Attribute 3. Do you have any Value 7 in stock?",
            "timestamp": "2026-07-20T10:52:58.418Z",
            "fieldContext": "dynamicAttributes.Attribute 3"
          },
          {
            "id": "chat-2",
            "quoteId": "q-001",
            "itemId": "item-3",
            "senderTenantId": "tenant-1",
            "message": "Unfortunately we are out of Value 7, but Value 8 is a direct, higher-rated replacement that fits the same spec.",
            "timestamp": "2026-07-20T11:22:58.418Z",
            "fieldContext": "dynamicAttributes.Attribute 3"
          }
        ]
      }
    ]
  }
];
