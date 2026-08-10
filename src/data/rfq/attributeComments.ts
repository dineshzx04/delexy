import type { AttributeComment } from './rfq.module';

export const mockAttributeComments: AttributeComment[] = [
  // Comments for Seller 1 (q-001)
  {
    id: "c-001",
    quoteId: "q-001",
    groupId: "grp-1",
    attributeId: "attr-1",
    round: 1,
    senderType: "SELLER",
    senderId: "pty-3",
    comment: "We can offer Matte Black instead of glossy Black. Is that fine?",
    createdAt: "2026-08-01T10:00:00Z"
  },
  {
    id: "c-002",
    quoteId: "q-001",
    groupId: "grp-1",
    attributeId: "attr-1",
    round: 2,
    senderType: "BUYER",
    senderId: "pty-1",
    comment: "Matte Black is acceptable, but please confirm UV protection rating.",
    createdAt: "2026-08-02T10:00:00Z"
  },
  {
    id: "c-003",
    quoteId: "q-001",
    groupId: "grp-1",
    attributeId: "attr-1",
    round: 2,
    senderType: "SELLER",
    senderId: "pty-3",
    comment: "The final UV protection rating is UV400.",
    createdAt: "2026-08-02T10:15:00Z"
  },
  // Comments for Seller 2 (q-002)
  {
    id: "c-004",
    quoteId: "q-002",
    groupId: "grp-1",
    attributeId: "attr-1",
    round: 1,
    senderType: "SELLER",
    senderId: "pty-6",
    comment: "We can supply the exact black color as requested.",
    createdAt: "2026-08-01T11:00:00Z"
  },
  // Comments for Item 3 / q-005 (Revision Requested dialogue)
  {
    id: "c-005",
    quoteId: "q-005",
    groupId: "grp-7",
    attributeId: "attr-13",
    round: 1,
    senderType: "BUYER",
    senderId: "pty-1",
    comment: "We need US 10 size, is US 11 the only one in stock?",
    createdAt: "2026-08-02T14:00:00Z"
  },
  {
    id: "c-006",
    quoteId: "q-005",
    groupId: "grp-7",
    attributeId: "attr-13",
    round: 2,
    senderType: "SELLER",
    senderId: "pty-3",
    comment: "US 10 is currently backordered for 2 weeks. Offering US 11 as alternative.",
    createdAt: "2026-08-03T09:00:00Z"
  }
];
