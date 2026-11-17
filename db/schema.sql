CREATE TABLE IF NOT EXISTS suppliers (
 id SERIAL PRIMARY KEY,
 name VARCHAR(100) NOT NULL UNIQUE,
 contact_email VARCHAR(140) NOT NULL,
 city VARCHAR(60) NOT NULL
);
CREATE TABLE IF NOT EXISTS inventory_items (
 id SERIAL PRIMARY KEY,
 sku VARCHAR(36) NOT NULL UNIQUE,
 name VARCHAR(120) NOT NULL,
 category VARCHAR(70) NOT NULL,
 unit_price NUMERIC(12,2) NOT NULL CHECK(unit_price>=0),
 stock INTEGER NOT NULL DEFAULT 0 CHECK(stock>=0),
 reorder_level INTEGER NOT NULL DEFAULT 10 CHECK(reorder_level>=0),
 supplier_id INTEGER REFERENCES suppliers(id),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS inventory_movements (
 id BIGSERIAL PRIMARY KEY,
 item_id INTEGER NOT NULL REFERENCES inventory_items(id),
 action VARCHAR(10) NOT NULL CHECK(action IN('in','out')),
 quantity INTEGER NOT NULL CHECK(quantity>0),
 previous_stock INTEGER NOT NULL CHECK(previous_stock>=0),
 resulting_stock INTEGER NOT NULL CHECK(resulting_stock>=0),
 reason VARCHAR(160) NOT NULL DEFAULT '',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory_items(name);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_movements_created ON inventory_movements(created_at DESC);
