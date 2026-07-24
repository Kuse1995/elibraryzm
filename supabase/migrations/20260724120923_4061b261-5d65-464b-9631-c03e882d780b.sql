
-- social_accounts
CREATE TABLE public.social_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook_page','instagram','whatsapp')),
  external_id TEXT NOT NULL,
  display_name TEXT,
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_central BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_accounts TO authenticated;
GRANT ALL ON public.social_accounts TO service_role;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner or admin read social_accounts" ON public.social_accounts FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR (is_central AND public.has_role(auth.uid(),'admin')));
CREATE POLICY "owner insert social_accounts" ON public.social_accounts FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "owner update social_accounts" ON public.social_accounts FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "owner delete social_accounts" ON public.social_accounts FOR DELETE TO authenticated
  USING (owner_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_social_accounts_updated BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- marketing_posts
CREATE TABLE public.marketing_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ebook_id UUID REFERENCES public.ebooks(id) ON DELETE SET NULL,
  caption TEXT NOT NULL DEFAULT '',
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  direction TEXT NOT NULL DEFAULT 'sales' CHECK (direction IN ('sales','educational','entertainment','mixed')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','publishing','published','failed')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  target_account_ids UUID[] NOT NULL DEFAULT '{}',
  platform_post_ids JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_posts TO authenticated;
GRANT ALL ON public.marketing_posts TO service_role;
ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner or admin read posts" ON public.marketing_posts FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "owner insert posts" ON public.marketing_posts FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "owner update posts" ON public.marketing_posts FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "owner delete posts" ON public.marketing_posts FOR DELETE TO authenticated
  USING (owner_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_marketing_posts_updated BEFORE UPDATE ON public.marketing_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- post_schedules
CREATE TABLE public.post_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'mix' CHECK (mode IN ('mix','template')),
  mix JSONB NOT NULL DEFAULT '{"sales":50,"educational":30,"entertainment":20}'::jsonb,
  template JSONB NOT NULL DEFAULT '{}'::jsonb,
  posts_per_week INT NOT NULL DEFAULT 3,
  active BOOLEAN NOT NULL DEFAULT false,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_schedules TO authenticated;
GRANT ALL ON public.post_schedules TO service_role;
ALTER TABLE public.post_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner or admin manage schedules" ON public.post_schedules FOR ALL TO authenticated
  USING (owner_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (owner_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_post_schedules_updated BEFORE UPDATE ON public.post_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- whatsapp_subscribers
CREATE TABLE public.whatsapp_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_e164 TEXT NOT NULL UNIQUE,
  opted_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opted_out_at TIMESTAMPTZ,
  source TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_subscribers TO authenticated;
GRANT ALL ON public.whatsapp_subscribers TO service_role;
ALTER TABLE public.whatsapp_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage subscribers" ON public.whatsapp_subscribers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- whatsapp_conversations
CREATE TABLE public.whatsapp_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_e164 TEXT NOT NULL UNIQUE,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_conversations TO authenticated;
GRANT ALL ON public.whatsapp_conversations TO service_role;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage conversations" ON public.whatsapp_conversations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
