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

DROP POLICY IF EXISTS "design refs admin all" ON public.design_refs;
CREATE POLICY "design refs admin all"
ON public.design_refs FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_design_refs_updated ON public.design_refs;
CREATE TRIGGER trg_design_refs_updated BEFORE UPDATE ON public.design_refs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Admins can view design refs" ON storage.objects;
CREATE POLICY "Admins can view design refs" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'design-refs' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can upload design refs" ON storage.objects;
CREATE POLICY "Admins can upload design refs" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'design-refs' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update design refs" ON storage.objects;
CREATE POLICY "Admins can update design refs" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'design-refs' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete design refs" ON storage.objects;
CREATE POLICY "Admins can delete design refs" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'design-refs' AND public.has_role(auth.uid(), 'admin'));