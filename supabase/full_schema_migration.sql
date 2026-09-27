-- ==============================================================================
-- Launderly Complete Schema Migration (01, 02, 03 + Seed Data)
-- Run this in Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Create Base Tables
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'kg',
    price NUMERIC NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    total_weight NUMERIC NOT NULL DEFAULT 0,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    order_status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    qty NUMERIC NOT NULL DEFAULT 1,
    subtotal NUMERIC NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outlet_name TEXT NOT NULL,
    outlet_phone TEXT,
    outlet_address TEXT,
    receipt_footer TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create Categories & Payment Methods
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add relations
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method_id ON transactions(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_service_id ON transaction_items(service_id);

-- 3. Enable RLS on all tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for services
DROP POLICY IF EXISTS "Allow anon select on services" ON services;
CREATE POLICY "Allow anon select on services"
    ON services FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow anon insert on services" ON services;
CREATE POLICY "Allow anon insert on services"
    ON services FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update on services" ON services;
CREATE POLICY "Allow anon update on services"
    ON services FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- RLS Policies for customers
DROP POLICY IF EXISTS "Allow anon select on customers" ON customers;
CREATE POLICY "Allow anon select on customers"
    ON customers FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow anon insert on customers" ON customers;
CREATE POLICY "Allow anon insert on customers"
    ON customers FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update on customers" ON customers;
CREATE POLICY "Allow anon update on customers"
    ON customers FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- RLS Policies for transactions
DROP POLICY IF EXISTS "Allow anon select on transactions" ON transactions;
CREATE POLICY "Allow anon select on transactions"
    ON transactions FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow anon insert on transactions" ON transactions;
CREATE POLICY "Allow anon insert on transactions"
    ON transactions FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update on transactions" ON transactions;
CREATE POLICY "Allow anon update on transactions"
    ON transactions FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- RLS Policies for transaction_items
DROP POLICY IF EXISTS "Allow anon select on transaction_items" ON transaction_items;
CREATE POLICY "Allow anon select on transaction_items"
    ON transaction_items FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow anon insert on transaction_items" ON transaction_items;
CREATE POLICY "Allow anon insert on transaction_items"
    ON transaction_items FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update on transaction_items" ON transaction_items;
CREATE POLICY "Allow anon update on transaction_items"
    ON transaction_items FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- RLS Policies for settings
DROP POLICY IF EXISTS "Allow anon select on settings" ON settings;
CREATE POLICY "Allow anon select on settings"
    ON settings FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow anon insert on settings" ON settings;
CREATE POLICY "Allow anon insert on settings"
    ON settings FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update on settings" ON settings;
CREATE POLICY "Allow anon update on settings"
    ON settings FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- RLS Policies for categories
DROP POLICY IF EXISTS "Allow anon select on categories" ON categories;
CREATE POLICY "Allow anon select on categories"
    ON categories FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow anon insert on categories" ON categories;
CREATE POLICY "Allow anon insert on categories"
    ON categories FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update on categories" ON categories;
CREATE POLICY "Allow anon update on categories"
    ON categories FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- RLS Policies for payment_methods
DROP POLICY IF EXISTS "Allow anon select on payment_methods" ON payment_methods;
CREATE POLICY "Allow anon select on payment_methods"
    ON payment_methods FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow anon insert on payment_methods" ON payment_methods;
CREATE POLICY "Allow anon insert on payment_methods"
    ON payment_methods FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update on payment_methods" ON payment_methods;
CREATE POLICY "Allow anon update on payment_methods"
    ON payment_methods FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 4. Atomic Transaction Insert Function
CREATE OR REPLACE FUNCTION create_transaction_with_item(
    p_invoice TEXT,
    p_customer_id UUID,
    p_total_weight NUMERIC,
    p_total_amount NUMERIC,
    p_payment_status TEXT,
    p_payment_method_id UUID DEFAULT NULL,
    p_order_status TEXT DEFAULT 'pending',
    p_notes TEXT DEFAULT NULL,
    p_created_at TIMESTAMPTZ DEFAULT now(),
    p_service_id UUID DEFAULT NULL,
    p_qty NUMERIC DEFAULT 1,
    p_subtotal NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tx_id UUID;
    v_item_id UUID := NULL;
    v_result JSONB;
BEGIN
    INSERT INTO transactions (
        invoice,
        customer_id,
        total_weight,
        total_amount,
        payment_status,
        payment_method_id,
        order_status,
        notes,
        created_at
    ) VALUES (
        p_invoice,
        p_customer_id,
        p_total_weight,
        p_total_amount,
        p_payment_status,
        p_payment_method_id,
        p_order_status,
        p_notes,
        COALESCE(p_created_at, now())
    )
    RETURNING id INTO v_tx_id;

    IF p_service_id IS NOT NULL THEN
        INSERT INTO transaction_items (
            transaction_id,
            service_id,
            qty,
            subtotal
        ) VALUES (
            v_tx_id,
            p_service_id,
            p_qty,
            p_subtotal
        )
        RETURNING id INTO v_item_id;
    END IF;

    SELECT jsonb_build_object(
        'id', v_tx_id,
        'invoice', p_invoice,
        'customer_id', p_customer_id,
        'total_weight', p_total_weight,
        'total_amount', p_total_amount,
        'payment_status', p_payment_status,
        'payment_method_id', p_payment_method_id,
        'order_status', p_order_status,
        'notes', p_notes,
        'created_at', COALESCE(p_created_at, now()),
        'item_id', v_item_id
    ) INTO v_result;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION create_transaction_with_item TO anon, authenticated;

-- 5. Seed Initial Data
INSERT INTO categories (name, is_active)
VALUES
    ('Kiloan', true),
    ('Satuan', true),
    ('Express', true),
    ('Setrika', true)
ON CONFLICT DO NOTHING;

INSERT INTO payment_methods (name, is_active)
VALUES
    ('Cash', true),
    ('Transfer Bank', true),
    ('QRIS', true),
    ('E-Wallet', true)
ON CONFLICT DO NOTHING;

INSERT INTO services (name, unit, price, is_active, category_id)
SELECT 'Cuci Komplit', 'kg', 8000, true, id FROM categories WHERE name = 'Kiloan' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO services (name, unit, price, is_active, category_id)
SELECT 'Cuci Kering', 'kg', 6000, true, id FROM categories WHERE name = 'Kiloan' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO services (name, unit, price, is_active, category_id)
SELECT 'Bed Cover', 'pcs', 25000, true, id FROM categories WHERE name = 'Satuan' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO settings (outlet_name, outlet_phone, outlet_address, receipt_footer)
VALUES
    ('Laundry Insight', '081234567890', 'Jl. Utama No. 123', 'Terima kasih telah mempercayakan pakaian Anda kepada kami.')
ON CONFLICT DO NOTHING;
