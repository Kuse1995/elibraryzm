
## Marketing & Social Selling Suite

Big feature. Phased so each piece is usable on its own.

### Data model (new tables)

- `social_accounts` — one row per connected account. Columns: `id`, `owner_user_id` (nullable = central/admin), `platform` (`facebook_page` | `instagram` | `whatsapp`), `external_id` (Page ID / IG ID / WA sender), `display_name`, `access_token` (encrypted), `token_expires_at`, `metadata` jsonb, `is_central` bool. RLS: owner or admin.
- `marketing_posts` — `id`, `owner_user_id`, `ebook_id` (nullable), `caption`, `image_urls` text[], `direction` (`sales` | `educational` | `entertainment` | `mixed`), `status` (`draft` | `scheduled` | `published` | `failed`), `scheduled_at`, `published_at`, `target_account_ids` uuid[], `platform_post_ids` jsonb, `error`.
- `post_schedules` — `id`, `owner_user_id`, `mode` (`mix` | `template`), `mix` jsonb (`{sales:50,educational:30,entertainment:20}`), `template` jsonb (`{mon:'sales',wed:'educational',fri:'entertainment'}`), `posts_per_week`, `active` bool.
- `whatsapp_subscribers` — `id`, `phone_e164`, `opted_in_at`, `opted_out_at`, `source`, `tags` text[].
- `whatsapp_conversations` — `id`, `phone_e164`, `state` jsonb (cart, awaiting-payment, etc.), `last_message_at`.

All get standard GRANTs + RLS (owner + admin).

### Secrets to add

- `GEMINI_API_KEY` (the value you pasted `AQ.Ab8…` — I'll store it via `add_secret`; confirm it's a Gemini API key, not an OAuth token).
- `META_APP_ID`, `META_APP_SECRET` (one shared Meta App you create at developers.facebook.com).
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` (central Twilio + WhatsApp sender).

### Edge functions

1. `meta-oauth-start` / `meta-oauth-callback` — Facebook Login flow, exchanges code for long-lived Page + IG Business tokens, stores rows in `social_accounts`.
2. `ai-generate-post` — calls your Gemini key: text (`gemini-2.5-flash`) for caption, image model (`gemini-3.1-flash-image`) for 1–N images. Inputs: `ebookId`, `direction`, `imageCount`, `styleHints`. Returns caption + base64 images which the client uploads to a new public `marketing-media` bucket.
3. `publish-post` — publishes a `marketing_posts` row to selected accounts:
   - Facebook Page: `/{page-id}/photos` (single) or `/{page-id}/feed` with attached_media (multi).
   - Instagram: create image containers → carousel container → publish.
   - WhatsApp: send template broadcast to opted-in `whatsapp_subscribers` via Twilio.
4. `scheduler-tick` — pg_cron every 15 min. For each active `post_schedules`, decides today's direction (from mix or template), calls `ai-generate-post`, creates a `marketing_posts` row, and calls `publish-post`.
5. `twilio-whatsapp-webhook` — inbound WA messages. Small AI sales agent that:
   - greets, lists books, answers questions (Gemini + ebook catalog context),
   - collects book choice + phone,
   - creates an `orders` row + Lenco payment link, replies with the link,
   - on webhook completion, sends the signed download link back over WhatsApp.
   Uses `whatsapp_conversations.state` for session.
6. `whatsapp-optin` — public endpoint the site + WA "SUBSCRIBE" keyword call to add rows to `whatsapp_subscribers`.

### Frontend

- New **Marketing** tab in `AuthorDashboard.tsx` and mirrored in `Admin.tsx` (admin sees central accounts + all authors):
  - "Connected accounts" panel — Connect Facebook/Instagram buttons (Meta OAuth) and a Twilio-central status row.
  - "Create post" — pick ebook (or free-form), pick direction (sales/educational/entertainment/mixed), image count (1–10 for FB/IG carousels), tone; preview generated caption + images; edit; pick target accounts; Publish now or Schedule.
  - "Content calendar" — list of scheduled + published posts with status.
  - "Auto-pilot" — toggle a `post_schedules` row, set mix % OR weekly template, posts-per-week.
- New **WhatsApp** subtab (admin): subscribers list, opt-in link/QR, broadcast composer, inbound-conversation viewer.
- `Layout.tsx` gets a small "Subscribe on WhatsApp" link in the footer that hits `whatsapp-optin`.

### Rollout order

1. Tables + secrets + `marketing-media` storage bucket.
2. `ai-generate-post` + Marketing tab (draft-only, no posting) — you can generate captions & images immediately.
3. Meta OAuth + FB Page + IG carousel publishing.
4. Manual publish + scheduler + auto-pilot.
5. Twilio broadcast to opted-in subscribers.
6. WhatsApp in-chat sales agent (Gemini + Lenco link) — the biggest sub-feature; ships last.

### Technical notes

- Meta App shared model: authors connect their own FB Page/IG through your one Meta App; tokens stored per row in `social_accounts`. Meta App must go through App Review for `pages_manage_posts`, `pages_read_engagement`, `instagram_content_publish`, `instagram_basic`, `business_management` before non-admin authors can connect — I'll note this in the Connect UI.
- IG multi-image posts require the carousel-container flow (up to 10 images).
- WhatsApp broadcasts require a Twilio-approved template until the user has messaged us in the last 24h; inbound-triggered replies (the sales agent) can be free-form.
- Gemini image calls stay server-side. The pasted key looks unusual for a Gemini API key (`AQ.Ab…` shape) — I'll wire it in as `GEMINI_API_KEY` but you may need to confirm it's the correct credential when the first call is made.
- No client ever sees Meta/Twilio/Gemini secrets.
