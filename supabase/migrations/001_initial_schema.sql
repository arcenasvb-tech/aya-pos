-- supabase/migrations/001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'staff')),
    phone TEXT,
    address TEXT,
    avatar_url TEXT,
    hourly_rate DECIMAL(10,2),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    has_variants BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_available BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product variants (size/temperature options)
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., "Iced Tall", "Hot Grande"
    size TEXT, -- Tall, Grande
    temperature TEXT, -- Iced, Hot
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product add-ons (like Oat Milk substitution)
CREATE TABLE product_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number SERIAL UNIQUE,
    staff_id UUID REFERENCES profiles(id),
    processed_by UUID REFERENCES profiles(id),
    customer_name TEXT,
    payment_method TEXT CHECK (payment_method IN ('cash', 'gcash', 'qrph', 'bank', 'other')),
    subtotal DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'voided', 'refunded')),
    void_reason TEXT,
    voided_by UUID REFERENCES profiles(id),
    voided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order item add-ons
CREATE TABLE order_item_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    addon_id UUID REFERENCES product_addons(id),
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time entries (clock in/out)
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES profiles(id) NOT NULL,
    clock_in TIMESTAMPTZ NOT NULL,
    clock_out TIMESTAMPTZ,
    clock_in_photo_url TEXT,
    clock_out_photo_url TEXT,
    hours_worked DECIMAL(5,2),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll periods
CREATE TABLE payroll_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    pay_frequency TEXT CHECK (pay_frequency IN ('weekly', 'biweekly', 'bimonthly', 'monthly')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid')),
    total_amount DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll entries
CREATE TABLE payroll_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_period_id UUID REFERENCES payroll_periods(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES profiles(id),
    total_hours DECIMAL(5,2) NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    gross_pay DECIMAL(10,2) NOT NULL,
    deductions DECIMAL(10,2) DEFAULT 0,
    net_pay DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory items
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    category TEXT,
    unit TEXT NOT NULL, -- kg, pieces, liters, etc.
    current_quantity DECIMAL(10,2) DEFAULT 0,
    minimum_quantity DECIMAL(10,2) DEFAULT 0,
    cost_per_unit DECIMAL(10,2),
    supplier TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory transactions
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('addition', 'deduction', 'adjustment')),
    quantity DECIMAL(10,2) NOT NULL,
    reference_type TEXT, -- 'purchase', 'waste', 'adjustment'
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff schedules
CREATE TABLE staff_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
    start_time TIME,
    end_time TIME,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_staff_id ON orders(staff_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_time_entries_staff_id ON time_entries(staff_id);
CREATE INDEX idx_time_entries_status ON time_entries(status);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_inventory_transactions_item ON inventory_transactions(item_id);

-- Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Owners can view all profiles"
    ON profiles FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'
    ));

CREATE POLICY "Owners can insert profiles"
    ON profiles FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'
    ));

CREATE POLICY "Owners can update profiles"
    ON profiles FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'
    ));

-- Products policies
CREATE POLICY "Anyone can view active products"
    ON products FOR SELECT
    USING (is_active = true OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'
    ));

CREATE POLICY "Owners can manage products"
    ON products FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'
    ));

-- Orders policies
CREATE POLICY "Staff can view all orders"
    ON orders FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Staff can create orders"
    ON orders FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Staff can update their orders"
    ON orders FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid()
    ));

-- Time entries policies
CREATE POLICY "Staff can view own time entries"
    ON time_entries FOR SELECT
    USING (staff_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'
    ));

CREATE POLICY "Staff can create own time entries"
    ON time_entries FOR INSERT
    WITH CHECK (staff_id = auth.uid());

CREATE POLICY "Staff can update own time entries"
    ON time_entries FOR UPDATE
    USING (staff_id = auth.uid());

-- Functions
CREATE OR REPLACE FUNCTION calculate_hours_worked()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.clock_out IS NOT NULL THEN
        NEW.hours_worked = EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 3600;
        NEW.status = 'completed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_hours
    BEFORE UPDATE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION calculate_hours_worked();

-- Function to update profile timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();