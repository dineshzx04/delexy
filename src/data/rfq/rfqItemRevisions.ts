import type { RfqItemRevision } from "./rfq.module";

export const mockRfqItemRevisions: RfqItemRevision[] = [
  // Item 1 Revisions (Flagship Smartphones)
  {
    id: "rev-item-01-1",
    rfq_item_id: "item-01",
    revision_number: 1,
    created_by: "usr-2",
    created_at: "2026-08-01T10:00:00Z"
  },
  
  // Item 2 Revisions (Gaming Laptops)
  {
    id: "rev-item-02-1",
    rfq_item_id: "item-02",
    revision_number: 1,
    created_by: "usr-2",
    created_at: "2026-08-01T10:00:00Z"
  },
  
  // Item 3 Revisions (Running Shoes)
  {
    id: "rev-item-03-1",
    rfq_item_id: "item-03",
    revision_number: 1,
    created_by: "usr-2",
    created_at: "2026-08-01T10:00:00Z"
  },
  {
    id: "rev-item-03-2",
    rfq_item_id: "item-03",
    revision_number: 2,
    created_by: "usr-2",
    created_at: "2026-08-02T14:00:00Z" // round 2 revision request
  }
];
