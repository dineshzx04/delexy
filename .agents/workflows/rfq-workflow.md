---
description: RFQ workflow
---

Yes. The main bottleneck in your design is trying to make **RFQ item → product → variant → revision → approval** happen too early.

The clean approach is:

> **RFQ negotiation first → Award → Product/Variant creation → Seller/Platform revision → Approval → Order**

Do **not** force normal product creation/revision before the buyer has selected the seller, unless the RFQ is specifically asking for an already-existing catalog product.

### Recommended RFQ lifecycle

```text
RFQ
 │
 ├── Item 1
 │    ├── Attribute 1
 │    ├── Attribute 2
 │    ├── Description/specification
 │    │
 │    ├── Seller A → Quote
 │    │              ├── Revision 1
 │    │              ├── Revision 2
 │    │              └── Approved
 │    │
 │    ├── Seller B → Quote
 │    │              └── Approved
 │    │
 │    └── Seller C → Quote
 │                   └── Rejected
 │
 ├── Item 2
 │    └── ...
 │
 └── Award
       ├── Seller A awarded
       └── Seller B awarded
              ↓
       Create/Map Product Variant
              ↓
       Seller Product Revision
              ↓
       Platform/Requester Approval
              ↓
       Variant APPROVED / ACTIVE
              ↓
       PO / Order
              ↓
       order_item.variant_id
```

## Your important question: when should variant be created?

I recommend **after award**, not before.

Because before award, you do not know which seller's commercial offer is actually going to become the orderable product.

For example:

```text
RFQ Item
"100 pcs - Bearing"

Required:
ID      = 6205
Material = Steel
Seal     = 2RS
Brand    = SKF or equivalent
```

Seller A quotes:

```text
SKF 6205-2RS
₹450
Lead time 7 days
```

Seller B quotes:

```text
FAG 6205-2RS
₹420
Lead time 10 days
```

Both quotes may be approved.

Buyer awards Seller B.

Only now do you know:

```text
RFQ Item #1
        ↓
Award → Seller B
        ↓
Seller B Product
        ↓
Variant
        ↓
variant_id = VAR-000982
```

Then your order can safely use:

```text
order_item.variant_id = VAR-000982
```

That is much cleaner.

---

# But you need one important distinction

Do **not** think of `Product Variant` as the quote itself.

You should have roughly:

```text
RFQ
  ↓
RFQ Item
  ↓
Seller Quote
  ↓
Seller Quote Revision
  ↓
Award
  ↓
Seller Product
  ↓
Seller Product Variant
```

The quote says:

> "I am willing to sell this specification for ₹420."

The product/variant says:

> "This is the actual catalog item/orderable configuration being sold."

That separation is very important.

---

# What happens to your revision workflow?

You said:

> each product creation should be revision between platform and seller

Then use revision **only after the commercial decision is sufficiently finalized**.

Recommended:

### Case 1 — Existing seller product already exists

This is the easy case.

```text
RFQ Item
   ↓
Seller Quote
   ↓
Award
   ↓
Existing Seller Product Variant
   ↓
PO / Order
```

No new product revision is required.

You simply reference:

```text
seller_product_id
variant_id
```

---

### Case 2 — Seller does not have the required product

Then:

```text
RFQ Item
   ↓
Seller Quote
   ↓
Award
   ↓
Create Seller Product Draft
   ↓
Create Variant Draft
   ↓
Revision
   ↓
Seller submits
   ↓
Platform/Requester reviews
   ↓
Approved
   ↓
Variant becomes ACTIVE
   ↓
PO / Order
```

This is where your existing product revision workflow fits.

---

# Where should the Variant ID be generated?

I would generate the ID **when the awarded seller product/variant draft is created**, even before approval.

For example:

```text
variant_id = VAR-000982
status = PENDING_APPROVAL
```

Then revision happens against this variant.

After approval:

```text
variant_id = VAR-000982
status = ACTIVE
```

The ID remains the same.

That gives you a stable reference for the whole workflow.

### Why this is useful

You can have:

```text
VAR-000982
   ↓
Revision 1
   ↓
Revision 2
   ↓
Revision 3
   ↓
APPROVED
```

Instead of creating a new variant ID for every revision.

So:

> **Variant = identity**
>
> **Revision = version/history of that identity**

This is the key design principle.

---

# What if the buyer changes the specification after award?

Then don't change the approved variant directly.

Create a new revision:

```text
VAR-000982
   ↓
Revision 1
   ↓
Revision 2
   ↓
Revision 3
```

If the change is significant enough to represent a different physical configuration, then create a **new variant**.

For example:

```text
Variant A
M10 × 50
Steel
Grade 8.8
```

changed to:

```text
Variant B
M10 × 60
Steel
Grade 8.8
```

That should usually be a different variant.

But:

```text
Variant A
description changed
packaging changed
image changed
```

may remain the same variant with a new revision.

---

# What about multiple approved quotes?

Your statement:

> one item can have multiple approved seller quotes

That's perfectly valid.

Example:

```text
RFQ ITEM 1
│
├── Quote A → APPROVED
├── Quote B → APPROVED
├── Quote C → APPROVED
│
├── Award A → Seller A
└── Award B → Seller B
```

Then:

```text
Award A
  ↓
Seller Product A
  ↓
Variant A

Award B
  ↓
Seller Product B
  ↓
Variant B
```

So **one RFQ item can ultimately produce multiple orderable seller variants**.

---

# The important lifecycle boundary

I would separate your system into three phases.

### Phase 1 — Requirement / Negotiation

```text
RFQ
 ↓
RFQ Item
 ↓
Specifications / Attributes
 ↓
Seller Invitation
 ↓
Seller Quote
 ↓
Quote Revision
 ↓
Quote Approval
```

No product creation required yet.

### Phase 2 — Commercial decision

```text
Approved Quote
 ↓
Award
 ↓
Awarded Seller
```

This is the trigger for product creation if necessary.

### Phase 3 — Orderable product

```text
Award
 ↓
Existing Variant?
 ├── YES → use it
 │
 └── NO
      ↓
   Create Product
      ↓
   Create Variant
      ↓
   Revision
      ↓
   Approval
      ↓
   ACTIVE Variant
```

Then:

```text
ACTIVE Variant
      ↓
PO
      ↓
Order
      ↓
OrderItem.variant_id
```

---

# One more improvement I strongly recommend

Introduce a concept such as:

```text
AwardedProductMapping
```

or

```text
RfqAwardItem
```

Example:

```text
RfqAwardItem
-------------------------
id
rfq_item_id
seller_quote_id
seller_id

product_id
variant_id

product_mapping_status
award_status
```

Then your lifecycle becomes:

```text
RFQ Item
   ↓
Seller Quote
   ↓
Award
   ↓
RfqAwardItem
   ↓
product_mapping_status
   ↓
variant_id
   ↓
Order
```

Your earlier status idea fits very well here:

```text
product_mapping_status
NOT_REQUIRED
PENDING
SUBMITTED
ACKNOWLEDGED
```

For example:

### Existing variant

```text
award_status = AWARDED
product_mapping_status = NOT_REQUIRED
variant_id = VAR-001
```

### New variant required

```text
award_status = AWARDED
product_mapping_status = PENDING
variant_id = VAR-982
```

Seller creates it:

```text
product_mapping_status = SUBMITTED
```

Platform/requester approves:

```text
product_mapping_status = ACKNOWLEDGED
```

Now order creation is allowed.

---

# Final recommended lifecycle

```text
                    RFQ
                     │
              ┌──────┴──────┐
              │             │
           Item 1         Item 2
              │
      Seller requests
              │
     ┌────────┼────────┐
     │        │        │
   Seller A Seller B Seller C
     │        │        │
   Quote    Quote    Quote
     │        │        │
 Revisions Revisions Revisions
     │        │        │
 Approved  Approved  Rejected
     │        │
     └────┬───┘
          │
       AWARD
      ┌───┴───┐
      │       │
   Seller A Seller B
      │       │
 Existing? Existing?
   │           │
  YES          NO
   │           │
Variant     Create Product
   │           │
   │        Create Variant
   │           │
   │         Revision
   │           │
   │         Approval
   │           │
   └──────┬────┘
          │
      ACTIVE VARIANT
          │
        PO/Order
          │
 order_item.variant_id
```

## The nutshell answer

**Do not create a normal product/variant during RFQ creation.**

Create the product/variant **after award**, only when the awarded seller does not already have a suitable variant.

Then:

**Award → Product/Variant Draft → Revision → Approval → Active Variant → Order**

And keep **Variant ID stable across revisions**.

The biggest architectural rule is:

> **Quote represents a seller's commercial offer; Award represents the buyer's decision; Product Variant represents the actual orderable configuration.**

That separation will prevent your RFQ lifecycle from becoming tangled with your product revision lifecycle.
