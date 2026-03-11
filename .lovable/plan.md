

# Integrate External Automation Platform

## Overview
Connect your eLibrary to your automation platform at `https://dzheddvoiauevcayifev.supabase.co/functions/v1/agent-api` so it can automate WhatsApp messages, Facebook/Instagram posts based on your catalog and sales.

## What This Enables
- **Catalog sync**: Push your ebook catalog to the platform so it can promote books on social media
- **Sale notifications**: When a purchase completes, notify the platform so it can send WhatsApp receipts/confirmations
- **Payment links**: Generate shareable payment links for WhatsApp/social media campaigns
- **Admin controls**: Manage sync and view automation status from the Admin dashboard

## Changes

### 1. Store API key securely
Use the secrets tool to store the `AUTOMATION_API_KEY` as an edge function secret.

### 2. Create edge function: `automation-sync`
**`supabase/functions/automation-sync/index.ts`** -- A backend function that proxies calls to your platform API with the x-api-key header. Supports three actions:
- `list_products` -- fetches catalog from your platform (for admin to verify sync)
- `record_sale` -- sends sale data (customer email, items, total) to your platform
- `generate_payment_link` -- creates a shareable link for WhatsApp/social campaigns

### 3. Auto-trigger on sale completion
**`supabase/functions/lenco-webhook/index.ts`** -- After marking an order as "completed", call the automation platform's `record_sale` action with order details (customer email, ebook titles, amount).

### 4. Admin automation tab
**`src/pages/Admin.tsx`** -- Add an "Automation" tab where admins can:
- Manually sync the full ebook catalog to the platform
- Generate payment links for specific ebooks (copy-paste for WhatsApp)
- See sync status/last synced time
- Toggle automation on/off via `site_settings`

### 5. Database
Add to `site_settings`:
- `automation_enabled` (true/false)
- `automation_last_sync` (timestamp)

No new tables needed.

### 6. Config
Add to `supabase/config.toml`:
```toml
[functions.automation-sync]
verify_jwt = false
```

