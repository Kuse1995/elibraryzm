-- Reader All-Access subscription (K10 / 30 days, K100 / 365 days).
-- Separate from the author subscription: grants NO roles, only library access.
-- Written 2026-08-16. Idempotent so a failed/partial deploy can be re-applied.

alter table public.profiles
  add column if not exists reader_expires_at timestamptz;

alter table public.profiles
  add column if not exists reader_last_sub_ref text;

insert into public.site_settings (key, value) values
  ('reader_subscription_fee_monthly', '1000'),
  ('reader_subscription_fee_yearly', '10000'),
  ('reader_subscription_days_monthly', '30'),
  ('reader_subscription_days_yearly', '365')
on conflict (key) do nothing;