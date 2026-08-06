import type { AttributeComment } from './rfq.module';

export const mockAttributeComments: AttributeComment[] = [
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
