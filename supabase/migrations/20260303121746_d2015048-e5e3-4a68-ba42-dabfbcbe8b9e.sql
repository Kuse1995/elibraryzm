
-- ==================== EBOOKS ====================
DROP POLICY IF EXISTS "Anyone can read ebooks" ON public.ebooks;
DROP POLICY IF EXISTS "Admins can insert ebooks" ON public.ebooks;
DROP POLICY IF EXISTS "Admins can update ebooks" ON public.ebooks;
DROP POLICY IF EXISTS "Admins can delete ebooks" ON public.ebooks;

CREATE POLICY "Anyone can read ebooks" ON public.ebooks FOR SELECT USING (true);
CREATE POLICY "Admins can insert ebooks" ON public.ebooks FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update ebooks" ON public.ebooks FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete ebooks" ON public.ebooks FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- ==================== ORDERS ====================
DROP POLICY IF EXISTS "Admins can read all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

CREATE POLICY "Admins can read all orders" ON public.orders FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can read own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can create orders" ON public.orders FOR INSERT WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL AND auth.uid() IS NOT NULL));
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- ==================== ORDER_ITEMS ====================
DROP POLICY IF EXISTS "Admins can read all order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can read own order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated can insert order items" ON public.order_items;

CREATE POLICY "Admins can read all order items" ON public.order_items FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can read own order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Authenticated can insert order items" ON public.order_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

-- ==================== PROFILES ====================
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- ==================== USER_ROLES ====================
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
