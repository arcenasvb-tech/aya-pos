-- supabase/seed.sql
-- Insert default categories
INSERT INTO categories (name, slug, description, sort_order) VALUES
('Espresso', 'espresso', 'Coffee-based drinks', 1),
('Non-Coffee', 'non-coffee', 'Non-coffee beverages', 2),
('Frappe', 'frappe', 'Blended frozen drinks', 3),
('Refreshers', 'refreshers', 'Fruit-based refreshers', 4),
('Beverages', 'beverages', 'Bottled and canned drinks', 5),
('Pizza', 'pizza', 'Soft crust pizzas', 6);

-- Insert Espresso products
INSERT INTO products (category_id, name, description, has_variants, sort_order) 
SELECT id, 'Americano', 'A smooth shot of espresso with water', true, 1
FROM categories WHERE slug = 'espresso';

INSERT INTO products (category_id, name, description, has_variants, sort_order) 
SELECT id, 'Latte', 'Espresso with steamed milk', true, 2
FROM categories WHERE slug = 'espresso';

INSERT INTO products (category_id, name, description, has_variants, sort_order) 
SELECT id, 'Cappuccino', 'Espresso with foamy milk', true, 3
FROM categories WHERE slug = 'espresso';

INSERT INTO products (category_id, name, description, has_variants, sort_order) 
SELECT id, 'Spanish Latte', 'Espresso with condensed milk', true, 4
FROM categories WHERE slug = 'espresso';

INSERT INTO products (category_id, name, description, has_variants, sort_order) 
SELECT id, 'Caramel Macchiato', 'Espresso with caramel', true, 5
FROM categories WHERE slug = 'espresso';

INSERT INTO products (category_id, name, description, has_variants, sort_order) 
SELECT id, 'Honey Oat Latte', 'Espresso with honey and oat milk', true, 6
FROM categories WHERE slug = 'espresso';

INSERT INTO products (category_id, name, description, has_variants, sort_order) 
SELECT id, 'Pink Salt Latte', 'Espresso with pink salt', true, 7
FROM categories WHERE slug = 'espresso';

INSERT INTO products (category_id, name, description, has_variants, sort_order) 
SELECT id, 'Salted Caramel Latte', 'Espresso with salted caramel', true, 8
FROM categories WHERE slug = 'espresso';

INSERT INTO products (category_id, name, description, has_variants, sort_order) 
SELECT id, 'Dirty Matcha', 'Espresso with matcha', true, 9
FROM categories WHERE slug = 'espresso';

-- Add Oat Milk addon
DO $$
DECLARE
    product_record RECORD;
BEGIN
    FOR product_record IN 
        SELECT id FROM products 
        WHERE category_id = (SELECT id FROM categories WHERE slug = 'espresso')
    LOOP
        INSERT INTO product_addons (product_id, name, price) 
        VALUES (product_record.id, 'Sub Oat Milk', 30);
    END LOOP;
END $$;

-- Insert variants for Americano
DO $$
DECLARE
    product_id_val uuid;
BEGIN
    SELECT id INTO product_id_val FROM products WHERE name = 'Americano';
    INSERT INTO product_variants (product_id, name, size, temperature, price) VALUES
    (product_id_val, 'Iced Tall', 'Tall', 'Iced', 105),
    (product_id_val, 'Iced Grande', 'Grande', 'Iced', 120),
    (product_id_val, 'Hot Tall', 'Tall', 'Hot', 95),
    (product_id_val, 'Hot Grande', 'Grande', 'Hot', 120);
END $$;

-- Continue with all other products and variants...
-- (Full seed data available in the complete repository)