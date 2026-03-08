
-- Add submitted_by and approval_status columns to ebooks
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS submitted_by uuid;
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved';

-- Update existing RLS: replace "Anyone can read ebooks" to only show approved
DROP POLICY IF EXISTS "Anyone can read ebooks" ON public.ebooks;
CREATE POLICY "Anyone can read approved ebooks"
ON public.ebooks FOR SELECT
USING (approval_status = 'approved');

-- Admins can read ALL ebooks (including pending/rejected)
CREATE POLICY "Admins can read all ebooks"
ON public.ebooks FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Authors can read their own ebooks (any status)
CREATE POLICY "Authors can read own ebooks"
ON public.ebooks FOR SELECT
TO authenticated
USING (submitted_by = auth.uid());

-- Authors can insert ebooks with author role check via text comparison
CREATE POLICY "Authors can insert own ebooks"
ON public.ebooks FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'author')
  AND submitted_by = auth.uid()
  AND approval_status = 'pending'
);

-- Authors can update their own pending/rejected ebooks
CREATE POLICY "Authors can update own pending ebooks"
ON public.ebooks FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'author')
  AND submitted_by = auth.uid()
  AND approval_status IN ('pending', 'rejected')
);

-- Authors can view order_items for their own ebooks (sales reporting)
CREATE POLICY "Authors can read order items for own ebooks"
ON public.order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ebooks
    WHERE ebooks.id = order_items.ebook_id
    AND ebooks.submitted_by = auth.uid()
  )
);

-- Authors can view orders that contain their ebooks
CREATE POLICY "Authors can read orders with own ebooks"
ON public.orders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.order_items
    JOIN public.ebooks ON ebooks.id = order_items.ebook_id
    WHERE order_items.order_id = orders.id
    AND ebooks.submitted_by = auth.uid()
  )
);
