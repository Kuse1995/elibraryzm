
-- Fix permissive order_items insert policy - restrict to authenticated users with matching order
DROP POLICY "System can insert order items" ON public.order_items;
CREATE POLICY "Authenticated can insert order items" ON public.order_items 
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );
