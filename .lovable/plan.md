
Root cause identified:
- In `src/pages/PaymentVerify.tsx`, guest payments are intentionally redirected to `/browse` (`const destination = user ? "/my-library" : "/browse";`), so guests never reach a download page.
- Also, download links in `MyLibrary` currently use raw `file_url` (storage path), not signed URLs, which can break actual file access for private ebook files.
- Your current flow already stores guest email in `orders.guest_email` (good for Admin Customers reporting), and no file is sent by email (already aligned with your request).

Implementation plan (approved-scope fix):
1) Make post-payment redirect go to a real download page for guests
- Update `PaymentVerify` success redirect:
  - Logged-in user: keep `/my-library`
  - Guest user: redirect to `/guest-downloads?reference=<payment_reference>`
- Keep the success state short (2–2.5s), then redirect automatically.

2) Add a dedicated Guest Downloads page
- Create `src/pages/GuestDownloads.tsx` and route `/guest-downloads`.
- UI behavior:
  - Show reference (from URL)
  - Ask guest to enter the same email used at checkout
  - On submit, fetch purchased ebooks and show download buttons
- This keeps email collection active while removing any “send via email” delivery behavior.

3) Add secure backend function for guest download retrieval
- Create backend function (e.g. `guest-download-links`) with JWT disabled.
- Validate:
  - `reference` is present
  - `email` is present
  - Order exists, is `completed`, and `guest_email` matches (case-insensitive, trimmed)
- Return purchased ebook metadata + short-lived signed download URLs for files in private storage.
- This avoids exposing private files while allowing legitimate guest access.

4) Fix authenticated My Library download links
- Update `src/pages/MyLibrary.tsx` to use signed URLs (instead of raw `file_url`) for download buttons.
- Ensures logged-in users can reliably download from private storage too.

5) Keep admin customer reporting as requested
- No email delivery logic will be added.
- Continue storing checkout email on guest orders.
- Admin Customers + estimated earnings stays based on `orders` data (already present); only small display polish if needed (email normalization).

Files to update:
- `src/pages/PaymentVerify.tsx` (guest redirect target)
- `src/pages/MyLibrary.tsx` (signed download URLs)
- `src/App.tsx` (new `/guest-downloads` route)
- `src/pages/GuestDownloads.tsx` (new)
- `supabase/functions/guest-download-links/index.ts` (new backend function)
- `supabase/config.toml` (function JWT config)

Technical notes:
- Keep existing `check-payment-status` for status polling.
- New guest download function should enforce strict matching on `reference + email + completed status`.
- Signed URLs should be short-lived (e.g., 5–15 minutes) and generated server-side for guests.

Validation checklist after implementation:
- Guest checkout → payment success → auto-redirects to `/guest-downloads`
- Enter guest email + reference context → purchased ebook appears with working download button
- Logged-in checkout → redirect to `/my-library` with working download button
- Admin “Customers” still shows guest emails and earnings totals correctly
