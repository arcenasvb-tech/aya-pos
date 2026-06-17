ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_reference_number text,
ADD COLUMN IF NOT EXISTS payment_reference_image_url text;
