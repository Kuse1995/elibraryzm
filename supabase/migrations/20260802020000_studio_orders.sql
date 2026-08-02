-- studio_orders: concierge "idea to book" studio orders.
-- Customers send an idea (web form or WhatsApp); we write + illustrate the
-- book, publish it on elibrary.live and deliver the PDF to their phone.

CREATE TABLE IF NOT EXISTS public.studio_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL CHECK (tier IN ('standard', 'star', 'premium')),
  customer_name TEXT,
  phone TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'mtn' CHECK (payment_method IN ('mtn', 'airtel')),
  idea TEXT NOT NULL DEFAULT '',
  title TEXT,
  amount_ngwee INTEGER NOT NULL DEFAULT 25000,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'awaiting_payment', 'paid', 'in_production', 'delivered', 'failed', 'cancelled')),
  lenco_reference TEXT,
  notes TEXT,
  ebook_id UUID REFERENCES public.ebooks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS studio_orders_status_idx ON public.studio_orders (status, created_at);
CREATE INDEX IF NOT EXISTS studio_orders_phone_idx ON public.studio_orders (phone, created_at DESC);

GRANT SELECT ON public.studio_orders TO authenticated;
GRANT INSERT ON public.studio_orders TO anon, authenticated;
GRANT ALL ON public.studio_orders TO service_role;

ALTER TABLE public.studio_orders ENABLE ROW LEVEL SECURITY;

-- Only admins can read orders; guests can create (payment handled by edge fn),
-- and the service role (edge functions / swarm) manages status transitions.
CREATE POLICY "studio orders admin read"
ON public.studio_orders FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "studio orders guests insert"
ON public.studio_orders FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Admins (the store account the swarm signs in as) manage order lifecycle.
CREATE POLICY "studio orders admin update"
ON public.studio_orders FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Default studio fees (ngwee) + delivery window. Tweak in Admin or SQL anytime.
INSERT INTO public.site_settings (key, value) VALUES
  ('studio_standard_fee', '25000'),
  ('studio_star_fee', '30000'),
  ('studio_premium_fee', '80000'),
  ('studio_delivery_hours', '48'),
  ('studio_whatsapp_number', '+15557797636')
ON CONFLICT (key) DO NOTHING;
