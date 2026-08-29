This is a clean, production-friendly schema for a **Product Draft Moderation Workflow with Audit Trail**.

---

## 1. product_draft

Draft header and current workflow state.

```sql
CREATE TABLE product_draft (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    seller_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,

    draft_no VARCHAR(50) UNIQUE,

    status ENUM(
        'DRAFT',
        'SUBMITTED',
        'UNDER_REVIEW',
        'CHANGES_REQUESTED',
        'APPROVED',
        'REJECTED',
        'PUBLISHED'
    ) NOT NULL DEFAULT 'DRAFT',

    current_round_no INT NOT NULL DEFAULT 0,

    created_by BIGINT NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 2. product_review_round

One row per review cycle.

```sql
CREATE TABLE product_review_round (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    product_draft_id BIGINT NOT NULL,

    round_no INT NOT NULL,

    status ENUM(
        'OPEN',
        'UNDER_REVIEW',
        'CHANGES_REQUESTED',
        'APPROVED',
        'CLOSED'
    ) NOT NULL,

    submitted_by BIGINT NOT NULL,
    submitted_at DATETIME NOT NULL,

    reviewed_by BIGINT NULL,
    reviewed_at DATETIME NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_product_round (
        product_draft_id,
        round_no
    ),

    FOREIGN KEY (product_draft_id)
        REFERENCES product_draft(id)
);
```

---

## 3. product_draft_item

Current attribute values only.

```sql
CREATE TABLE product_draft_item (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    product_draft_id BIGINT NOT NULL,

    attribute_id BIGINT NOT NULL,

    value_json JSON NOT NULL,

    is_completed BOOLEAN DEFAULT TRUE,

    created_by BIGINT NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_draft_attribute (
        product_draft_id,
        attribute_id
    ),

    FOREIGN KEY (product_draft_id)
        REFERENCES product_draft(id)
);
```

Example:

```json
{
  "value": "Blue"
}
```

or

```json
{
  "valueId": 123,
  "label": "Blue"
}
```

---

## 4. product_draft_change_history

Stores only actual value changes.

```sql
CREATE TABLE product_draft_change_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    product_draft_id BIGINT NOT NULL,

    round_id BIGINT NULL,

    attribute_id BIGINT NOT NULL,

    old_value_json JSON,

    new_value_json JSON,

    changed_by BIGINT NOT NULL,

    change_reason VARCHAR(500) NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_draft_id)
        REFERENCES product_draft(id),

    FOREIGN KEY (round_id)
        REFERENCES product_review_round(id)
);
```

Example:

```json
{
  "old_value": "Red",
  "new_value": "Blue"
}
```

---

## 5. product_draft_comment

Stores all conversations, approvals, rejections, and notes.

```sql
CREATE TABLE product_draft_comment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    product_draft_id BIGINT NOT NULL,

    round_id BIGINT NULL,

    attribute_id BIGINT NULL,

    parent_comment_id BIGINT NULL,

    comment_type ENUM(
        'COMMENT',
        'INFO',
        'APPROVED',
        'REJECTED',
        'QUESTION',
        'REPLY'
    ) NOT NULL,

    actor_type ENUM(
        'USER',
        'PLATFORM'
    ) NOT NULL,

    comment TEXT NOT NULL,

    created_by BIGINT NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_draft_id)
        REFERENCES product_draft(id),

    FOREIGN KEY (round_id)
        REFERENCES product_review_round(id),

    FOREIGN KEY (parent_comment_id)
        REFERENCES product_draft_comment(id)
);
```

---

# Relationship Diagram

```text
product_draft
    │
    ├── product_review_round
    │
    ├── product_draft_item
    │
    ├── product_draft_change_history
    │
    └── product_draft_comment
```

---

# Example Flow

```text
Draft Created
    ↓
Round 1 Submitted
    ↓
Platform Rejects Color
    ↓
Comment Added
    ↓
User Changes

Color:
Red → Blue

(history row)

    ↓
Round 2 Submitted
    ↓
Platform Approves Color
    ↓
Product Approved
```

This schema gives you:

* Current draft data (`product_draft_item`)
* Round-wise review tracking (`product_review_round`)
* Complete audit trail (`product_draft_change_history`)
* Attribute-level and product-level discussions (`product_draft_comment`)
* Scalable storage because only changed values and review actions are stored.
