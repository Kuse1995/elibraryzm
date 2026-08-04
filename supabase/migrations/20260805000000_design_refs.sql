-- design_refs: style references for the WhatsApp AI design studio.
-- Customers/AI never see these as templates; the image model copies the
-- reference's style (colours, layout feel, mood) while text is composited
-- in code, so no reference text is ever copied.

CREATE TABLE IF NOT EXISTS public.design_refs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  storage_path TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'site',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS design_refs_active_idx ON public.design_refs (active, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.design_refs TO authenticated;
GRANT ALL ON public.design_refs TO service_role;

ALTER TABLE public.design_refs ENABLE ROW LEVEL SECURITY;

-- Only admins manage references (the store account the swarm signs in as
-- and the site owner's logged-in admin user).
CREATE POLICY "design refs admin all"
ON public.design_refs FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for reference images (public read, admin write)
INSERT INTO storage.buckets (id, name, public) VALUES ('design-refs', 'design-refs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view design refs" ON storage.objects
FOR SELECT USING (bucket_id = 'design-refs');

CREATE POLICY "Admins can upload design refs" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'design-refs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update design refs" ON storage.objects
FOR UPDATE USING (bucket_id = 'design-refs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete design refs" ON storage.objects
FOR DELETE USING (bucket_id = 'design-refs' AND public.has_role(auth.uid(), 'admin'));
