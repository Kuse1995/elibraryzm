-- game_access: buyers unlock the games section forever.
-- Registered buyers are granted by user_id; WhatsApp/guest buyers by phone.
-- The site claims a phone grant from the Games page (game-access-check edge
-- function binds it to the signed-in account when possible).

CREATE TABLE IF NOT EXISTS public.game_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'book_purchase',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT game_access_owner CHECK (user_id IS NOT NULL OR phone IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS game_access_user_idx
  ON public.game_access (user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS game_access_phone_idx
  ON public.game_access (phone) WHERE user_id IS NULL AND phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS game_access_phone_search_idx
  ON public.game_access (phone) WHERE active;

ALTER TABLE public.game_access ENABLE ROW LEVEL SECURITY;

-- Buyers can read their own grant (registered accounts only; phone claims go
-- through the edge function which uses the service role).
CREATE POLICY "game access users read own"
  ON public.game_access FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins (the store account the swarm signs in as) manage the table.
CREATE POLICY "game access admin manage"
  ON public.game_access FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.game_access TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.game_access TO authenticated;
GRANT ALL ON public.game_access TO service_role;
