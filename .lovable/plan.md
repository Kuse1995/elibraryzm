

## Admin-Configurable Upsell Discount Percentage

Replace the hardcoded 50% discount with a value stored in the database that admins can change from the dashboard.

### Approach

Use a new `site_settings` table (key-value store) to hold the `upsell_discount_percent` setting. This is lightweight and extensible for future settings.

### Changes

| File | Change |
|------|--------|
| **Migration** | Create `site_settings` table with a single row for `upsell_discount_percent` (default 50). Public read, admin write. |
| `src/pages/Admin.tsx` | Add a "Settings" tab with a number input for the upsell discount percentage (1-99). Saves to `site_settings`. |
| `src/pages/EbookDetail.tsx` | Fetch discount percentage from `site_settings` instead of hardcoding 50. Use it in the price calc and display text. |
| `supabase/functions/initiate-payment/index.ts` | Read discount percentage from `site_settings` instead of `Math.floor(price / 2)`. Calculate as `Math.floor(price * (1 - percent/100))`. |

### Database

```sql
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- Seed with default
INSERT INTO site_settings (key, value) VALUES ('upsell_discount_percent', '50');
-- RLS: anyone can read, admins can update
```

### UI in Admin

A new "Settings" tab with a simple card:

```text
Upsell Discount
[  50  ] %        [Save]
```

### Price calculation change

Frontend and backend both switch from `price / 2` to `price * (100 - discountPercent) / 100`.

