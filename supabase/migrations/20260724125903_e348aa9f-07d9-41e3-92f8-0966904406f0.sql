ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_whatsapp_phone ON public.orders(whatsapp_phone) WHERE whatsapp_phone IS NOT NULL;