INSERT INTO public.social_accounts (platform, external_id, display_name, is_central, metadata)
VALUES ('whatsapp', '+15557797636', 'E Library WhatsApp (+1 555 779 7636)', true, '{"provider":"twilio"}'::jsonb)
ON CONFLICT DO NOTHING;