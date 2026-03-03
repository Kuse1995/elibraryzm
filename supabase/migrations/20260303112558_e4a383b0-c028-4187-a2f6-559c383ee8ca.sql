
-- Allow guest orders (user_id IS NULL) to be inserted without auth
-- The edge function uses service role key, so this is mainly for completeness
-- Also allow guest order items insertion via service role

-- Drop and recreate the order insert policy to also allow service-role inserts for guests
DROP POLICY IF EXISTS "Authenticated can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Allow service role to insert order items for any order
DROP POLICY IF EXISTS "Authenticated can insert order items" ON public.order_items;
CREATE POLICY "Anyone can insert order items"
ON public.order_items
FOR INSERT
WITH CHECK (true);
