
-- Helper: check if a user can read an order (bypasses RLS)
CREATE OR REPLACE FUNCTION public.user_can_read_order(_order_id uuid, _uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = _order_id AND (
      user_id = _uid
      OR public.has_role(_uid, 'admin')
      OR EXISTS (
        SELECT 1 FROM public.order_items oi
        JOIN public.ebooks e ON e.id = oi.ebook_id
        WHERE oi.order_id = _order_id AND e.submitted_by = _uid
      )
    )
  )
$$;

-- Helper: check if a user can read an order item (bypasses RLS)
CREATE OR REPLACE FUNCTION public.user_can_read_order_item(_order_id uuid, _ebook_id uuid, _uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    public.has_role(_uid, 'admin')
    OR EXISTS (SELECT 1 FROM public.orders WHERE id = _order_id AND user_id = _uid)
    OR EXISTS (SELECT 1 FROM public.ebooks WHERE id = _ebook_id AND submitted_by = _uid)
  )
$$;

-- Drop recursive policies on orders
DROP POLICY IF EXISTS "Authors can read orders with own ebooks" ON public.orders;
DROP POLICY IF EXISTS "Admins can read all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;

-- Recreate orders SELECT policies using the helper function (no cross-table recursion)
CREATE POLICY "Users and admins can read orders"
  ON public.orders FOR SELECT TO authenticated
  USING (public.user_can_read_order(id, auth.uid()));

-- Drop recursive policies on order_items
DROP POLICY IF EXISTS "Authors can read order items for own ebooks" ON public.order_items;
DROP POLICY IF EXISTS "Admins can read all order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can read own order items" ON public.order_items;

-- Recreate order_items SELECT policy using the helper function
CREATE POLICY "Users and admins can read order items"
  ON public.order_items FOR SELECT TO authenticated
  USING (public.user_can_read_order_item(order_id, ebook_id, auth.uid()));
