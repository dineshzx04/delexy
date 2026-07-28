# SYSTEM PROMPT: Multi-Tenant Catalog-to-Offer Architecture & Dynamic EAV Engine

## OBJECTIVE
Design and implement a multi-tenant Catalog-to-Offer EAV (Entity-Attribute-Value) relational database and API schema. The engine must decouple platform-level canonical catalog products from seller-level offers while dynamically inheriting category attributes and driving variant matrix generation.

---

## ARCHITECTURAL ENGINE RULES

### 1. Master Taxonomy & EAV Hierarchy
* Categories are hierarchical (`hierarchical_categories`) supporting multi-level navigation paths (e.g., L1 -> L2 -> L3).
* Attribute Groups (`attribute_groups`), Attributes (`attributes`), and Attribute Values (`attribute_values`) exist as standalone entities.
* **Category Mapping Rule:** Dynamic dynamic attribute groups are mapped directly to Categories (`category_attribute_groups`), NOT to catalog products.

### 2. Platform Catalog Product (Canonical Base)
* `catalog_products` contains ONLY immutable platform-level metadata (e.g., Name, Model Number, Part Number, Manufacturer, and a single `category_id`).
* Catalog products contain ZERO direct dynamic attribute references. Dynamic attributes are resolved dynamically via:
  $$\text{Catalog Product} \longrightarrow \text{Category} \longrightarrow \text{Attribute Groups} \longrightarrow \text{Attributes}$$

### 3. Seller Listing & Config Engine
* When a seller selects a `catalog_product` to list, a `seller_product` instance is initialized.
* The system fetches all attributes associated with the product's `category_id`.
* **Variant vs. Spec Toggle (`is_variant_driver`):**
  * The seller evaluates each category attribute with a boolean flag: `is_variant_driver`.
  * **If `is_variant_driver = false` (Unchecked):** Converts to a **Static Spec**. The seller assigns a single static value stored in `seller_product_specs`.
  * **If `is_variant_driver = true` (Checked):** Converts to a **Variant Axis**. The seller selects multiple values, triggering the variant matrix builder.

### 4. Sellable Variant Generation
* The system calculates the Cartesian product of all checked variant attributes to create sellable child units (`seller_product_variants`).
* Each variant SKU represents a physical transactional line item holding:
  * `seller_sku`, `price`, `stock_qty`, `min_stock_threshold`, and `is_sellable`.
* The specific value combinations for each variant are mapped via `seller_variant_attribute_values`.

---

## REQUIRED TABLE SCHEMA LIST
1. `hierarchical_categories`
2. `attribute_groups`
3. `category_attribute_groups`
4. `attributes`
5. `attribute_group_attributes`
6. `attribute_values`
7. `catalog_products`
8. `seller_products`
9. `seller_product_attribute_configs` (`is_variant_driver` boolean toggle)
10. `seller_product_specs` (static non-variant attribute values)
11. `seller_product_variants` (sellable SKUs with price/stock)
12. `seller_variant_attribute_values` (variant matrix combination mappings)

---

## OUTPUT EXPECTATIONS
* Provide normalized SQL DDL scripts with Foreign Keys and Composite Indexing strategies.
* Provide JSON payloads representing the state transitions:
  1. Initial category dynamic attribute fetch for a selected catalog product.
  2. Seller configuration payload submitting `is_variant_driver` flags and static values.
  3. Final generated sellable variant SKUs with attribute combinations.