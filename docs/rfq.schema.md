-- =========================================================
-- RFQ
-- =========================================================

CREATE TABLE rfqs (
id VARCHAR(50) PRIMARY KEY,
status VARCHAR(30) NOT NULL,
requester_id VARCHAR(50) NOT NULL,
created_at TIMESTAMP NOT NULL,
updated_at TIMESTAMP NOT NULL
);

-- =========================================================
-- RFQ ITEM
-- =========================================================

CREATE TABLE rfq_items (
id VARCHAR(50) PRIMARY KEY,
rfq_id VARCHAR(50) NOT NULL,
category_id VARCHAR(50) NOT NULL,
quantity DECIMAL(18,4) NOT NULL,
unit VARCHAR(30) NOT NULL,

    current_revision_id VARCHAR(50),

    created_at      TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP NOT NULL,

    FOREIGN KEY (rfq_id)
        REFERENCES rfqs(id)

);

-- =========================================================
-- REQUEST REVISION
-- Snapshot of requester requirements
-- =========================================================

CREATE TABLE rfq_item_revisions (
id VARCHAR(50) PRIMARY KEY,
rfq_item_id VARCHAR(50) NOT NULL,
revision_number INT NOT NULL,

    created_by      VARCHAR(50) NOT NULL,
    created_at      TIMESTAMP NOT NULL,

    UNIQUE (rfq_item_id, revision_number),

    FOREIGN KEY (rfq_item_id)
        REFERENCES rfq_items(id)

);

-- =========================================================
-- REQUEST ATTRIBUTES
-- Belong to a specific request revision
-- =========================================================

CREATE TABLE rfq_item_attributes (
id VARCHAR(50) PRIMARY KEY,
rfq_item_revision_id VARCHAR(50) NOT NULL,

    group_id            VARCHAR(50) NOT NULL,
    attribute_id        VARCHAR(50) NOT NULL,
    attribute_name      VARCHAR(255) NOT NULL,

    values              JSONB,

    FOREIGN KEY (rfq_item_revision_id)
        REFERENCES rfq_item_revisions(id)

);

-- =========================================================
-- SELLER QUOTE
-- Stable quote container
-- =========================================================

CREATE TABLE seller_quotes (
id VARCHAR(50) PRIMARY KEY,
rfq_item_id VARCHAR(50) NOT NULL,
seller_id VARCHAR(50) NOT NULL,
status VARCHAR(30) NOT NULL,

    current_revision_id VARCHAR(50),

    created_at          TIMESTAMP NOT NULL,
    updated_at          TIMESTAMP NOT NULL,

    FOREIGN KEY (rfq_item_id)
        REFERENCES rfq_items(id)

);

-- =========================================================
-- SELLER QUOTE REVISION
-- Each revision is based on a specific requester revision
-- =========================================================

CREATE TABLE seller_quote_revisions (
id VARCHAR(50) PRIMARY KEY,
seller_quote_id VARCHAR(50) NOT NULL,

    rfq_item_revision_id VARCHAR(50) NOT NULL,

    revision_number     INT NOT NULL,

    created_by          VARCHAR(50) NOT NULL,
    created_at          TIMESTAMP NOT NULL,

    UNIQUE (seller_quote_id, revision_number),

    FOREIGN KEY (seller_quote_id)
        REFERENCES seller_quotes(id),

    FOREIGN KEY (rfq_item_revision_id)
        REFERENCES rfq_item_revisions(id)

);

-- =========================================================
-- SELLER QUOTE ATTRIBUTES
-- Snapshot of seller's response to request attributes
-- =========================================================

CREATE TABLE seller_quote_attributes (
id VARCHAR(50) PRIMARY KEY,

    quote_revision_id   VARCHAR(50) NOT NULL,

    -- Reference to the request attribute
    item_attribute_id   VARCHAR(50) NOT NULL,

    group_id            VARCHAR(50) NOT NULL,
    attribute_id        VARCHAR(50) NOT NULL,
    attribute_name      VARCHAR(255) NOT NULL,

    offered_values      JSONB,

    FOREIGN KEY (quote_revision_id)
        REFERENCES seller_quote_revisions(id),

    FOREIGN KEY (item_attribute_id)
        REFERENCES rfq_item_attributes(id)

);

-- =========================================================
-- COMMENTS
-- Comments are attached to the seller quote attribute
-- =========================================================

CREATE TABLE seller_quote_comments (
id VARCHAR(50) PRIMARY KEY,

    seller_quote_id     VARCHAR(50) NOT NULL,

    quote_attribute_id  VARCHAR(50),

    comment             TEXT NOT NULL,

    sender              VARCHAR(30) NOT NULL,
    sender_id           VARCHAR(50) NOT NULL,

    created_at          TIMESTAMP NOT NULL,

    FOREIGN KEY (seller_quote_id)
        REFERENCES seller_quotes(id),

    FOREIGN KEY (quote_attribute_id)
        REFERENCES seller_quote_attributes(id)

);
