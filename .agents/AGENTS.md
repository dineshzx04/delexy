# Delexy Prototype Workspace Rules

## Data Architecture & Mock Data Rules
1. **Strict Taxonomy Mapping**: All product filtering logic is strictly typed and tightly coupled to the underlying taxonomy defined in `db.categories`, `db.attributeGroups`, and `db.attributes`.
2. **Category Leaf Nodes**: The leaf categories (e.g., `c-2-1-1-1`) determine the available attributes via `mappedGroupIds`.
3. **Product & Variant Integrity**: 
   - A mock product (e.g., in `seed.ts`) must map to a valid `categoryId`.
   - The product's `dynamicAttributes` and `globalSpecs` must *only* contain attribute keys (`attr-X`) that are mapped to that category's `mappedGroupIds`.
   - The values assigned to those attributes must belong to the valid `valueIds` of that specific attribute.
4. **RFQ Filtering Behavior**: 
   - In `CreateRFQ.tsx`, the UI computes dynamic attribute filters and dropdown choices (like Manufacturer/Brand) purely based on the strictly typed mapping from `baseMatches` (products matching the selected Category).
   - Random dummy data should never be used, as it breaks the filtering logic (`Array.includes` and taxonomy matches).
