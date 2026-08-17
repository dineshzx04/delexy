1. variant_label_id is IMMUTABLE.

2. Never modify the attribute/value combination of an existing
   variant_label_id.

3. Adding a new variant attribute creates NEW variant labels.

4. Old variant labels can become RETIRED but must remain queryable.

5. Old RFQs/orders continue referencing their original variant_label_id.

6. New RFQs cannot select RETIRED variants.

7. If an old variant splits into multiple new variants,
   store a SPLIT_INTO relationship.

8. Never automatically select one successor when the new
   attribute has multiple possible values.

9. Store a snapshot of the variant attributes in RFQ/order items.