-- user_ebook_access: permanent purchase grants so buyers can always reopen
-- their library (registered users by user_id, WhatsApp guests by email).

CREATE TABLE IF NOT EXISTS public.user_ebook_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_email TEXT,
  ebook_id UUID REFERENCES public.ebooks(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_ebook_access_owner CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS user_ebook_access_owner_ebook_idx
  ON public.user_ebook_access (COALESCE(user_id::text, 'guest:' || lower(guest_email)), ebook_id);

ALTER TABLE public.user_ebook_access ENABLE ROW LEVEL SECURITY;

-- Buyers can read their own grants (registered by user_id, guests by email claim).
CREATE POLICY "Users read own grants" ON public.user_ebook_access
  FOR SELECT USING (
    auth.uid() = user_id OR
    lower(guest_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );