-- ==============================================================================
-- Migration: 03_rls_policies.sql
-- Description:
-- 1. Enable Row Level Security (RLS) on all tables:
--    services, customers, transactions, transaction_items, settings, categories, payment_methods
-- 2. Add RLS policies allowing SELECT, INSERT, UPDATE for role `anon` (and `authenticated`)
--    Strictly NO DELETE policy is opened for anon.
-- 3. Create atomic transaction insert function `create_transaction_with_item` (PL/pgSQL)
-- ==============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- 2. RLS Policies for services
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

-- 3. Atomic Transaction Insert Function (create_transaction_with_item)
CREATE OR REPLACE FUNCTION create_transaction_with_item(
    p_invoice TEXT,
    p_customer_id UUID,
    p_total_weight NUMERIC,
    p_total_amount NUMERIC,
    p_payment_status TEXT DEFAULT 'unpaid',
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
    v_item_id UUID;
    v_result JSONB;
BEGIN
    -- Insert record ke transactions
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

    -- Insert record ke transaction_items jika service_id diberikan
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

    -- Return JSON transaksi yang baru dibuat
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

-- Berikan izin akses eksekusi ke anon dan authenticated
GRANT EXECUTE ON FUNCTION create_transaction_with_item TO anon, authenticated;
