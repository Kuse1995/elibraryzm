
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_e164 TEXT NOT NULL,
  profile_name TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('in','out')),
  body TEXT NOT NULL DEFAULT '',
  intent TEXT NOT NULL DEFAULT 'other',
  media_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS whatsapp_messages_phone_idx ON public.whatsapp_messages (phone_e164, created_at DESC);
CREATE INDEX IF NOT EXISTS whatsapp_messages_created_idx ON public.whatsapp_messages (created_at DESC);

GRANT SELECT ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin read whatsapp messages"
ON public.whatsapp_messages FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.whatsapp_subscribers
  ADD COLUMN IF NOT EXISTS display_name TEXT;
