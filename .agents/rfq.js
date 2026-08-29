const rfqs = [
  {
    id: "rfq-01",
    status: "IN_PROGRESS",
    createdAt: "2026-08-01T09:00:00Z",
  },
];

const rfqItems = [
  {
    id: "item-01",
    rfqId: "rfq-01",
    itemRevision: 1, // Buyer-led item revision/version
    categoryId: "cat-01",
    quantity: 10,
    unit_price: 100,
    unit: "kg",
    targettedSellerIds: ["sel-01", "sel-02"],
  },
];

const itemAttributes = [
  {
    id: "ia-01", // Primary key in database table
    itemId: "item-01",
    groupId: "grp-1",
    attributeId: "attr-01",
    attributeName: "Color",
    description: "Must be scratch-resistant.",
    currentBuyerValues: [{ valueId: "val1", valueLabel: "Black" }],
  }
];

// Single active quote per seller-item
const sellerQuote = [
  {
    id: "q-001",
    itemId: "item-01",
    sellerId: "sel-01",
    itemRevision: 1,     // Quote is bidding against Item Revision 1
    round: 2,           // Increments with each negotiation round
    unit_price: 108,    // Latest unit price offered
    status: "FINALIZED" // DRAFT | SUBMITTED | FINALIZED
  },
  {
    id: "q-002",
    itemId: "item-01",
    sellerId: "sel-02",
    itemRevision: 1,     // Quote is bidding against Item Revision 1
    round: 1,           // Remained on round 1
    unit_price: 112,    // Offered price
    status: "FINALIZED" // DRAFT | SUBMITTED | FINALIZED
  }
];

// Active response values proposed by the sellers (no comment fields)
const sellerAttributeResponses = [
  {
    id: "resp-001",
    quoteId: "q-001",
    groupId: "grp-1",
    attributeId: "attr-01",
    buyerValue: [{ valueId: "val1", valueLabel: "Black" }],
    value: [{ valueId: "val2", valueLabel: "Matte Black" }],
  },
  {
    id: "resp-002",
    quoteId: "q-002",
    groupId: "grp-1",
    attributeId: "attr-01",
    buyerValue: [{ valueId: "val1", valueLabel: "Black" }],
    value: [{ valueId: "val1", valueLabel: "Black" }],
  }
];

// Separate comments log thread for each attribute
const attributeComments = [ 
  // Comments for Seller 1 (q-001)
  {
    id: "c-001",
    quoteId: "q-001",
    groupId: "grp-1",
    attributeId: "attr-01",
    round: 1,
    senderType: "SELLER",
    senderId: "sel-01",
    comment: "We can offer Matte Black instead of glossy Black. Is that fine?",
    createdAt: "2026-08-01T10:00:00Z"
  },
  {
    id: "c-002",
    quoteId: "q-001",
    groupId: "grp-1",
    attributeId: "attr-01",
    round: 2,
    senderType: "BUYER",
    senderId: "buyer-01",
    comment: "Matte Black is acceptable, but please confirm UV protection rating.",
    createdAt: "2026-08-02T10:00:00Z"
  },
  {
    id: "c-003",
    quoteId: "q-001",
    groupId: "grp-1",
    attributeId: "attr-01",
    round: 2,
    senderType: "SELLER",
    senderId: "sel-01",
    comment: "The final UV protection rating is UV400.",
    createdAt: "2026-08-02T10:15:00Z"
  },
  // Comments for Seller 2 (q-002)
  {
    id: "c-004",
    quoteId: "q-002",
    groupId: "grp-1",
    attributeId: "attr-01",
    round: 1,
    senderType: "SELLER",
    senderId: "sel-02",
    comment: "We can supply the exact black color as requested.",
    createdAt: "2026-08-01T11:00:00Z"
  }
];

// Historical responses archived from previous negotiation rounds
const attributeResponseHistory = [
  {
    id: "hist-001",
    responseId: "resp-001",
    quoteId: "q-001",
    round: 1,
    groupId: "grp-1",
    attributeId: "attr-01",
    buyerValue: [{ valueId: "val1", valueLabel: "Black" }],
    value: [{ valueId: "val3", valueLabel: "Glossy Black" }],
    archivedAt: "2026-08-02T10:00:00Z"
  }
];

// Final award details, minimum quantity of 1 per awardee
const rfqAwards = [
  {
    id: "awd-01",
    rfqId: "rfq-01",
    itemId: "item-01",
    sellerId: "sel-01",
    awardedQuantity: 8, // Split quantity (total requested was 10)
    unitPrice: 108,
    awardedAt: "2026-08-05T14:00:00Z"
  },
  {
    id: "awd-02",
    rfqId: "rfq-01",
    itemId: "item-01",
    sellerId: "sel-02",
    awardedQuantity: 2, // Must be >= 1
    unitPrice: 112,
    awardedAt: "2026-08-05T14:00:00Z"
  }
];
