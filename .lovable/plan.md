

## Problem

The current flow redirects to `/payment-verify` with a `status=pay-offline` URL parameter, but the polling/redirect logic isn't reliably moving users to the download page. The guest downloads page also requires a separate email verification step, adding friction.

## Solution: Unified Downloads Page

Replace the fragmented flow with a single `/downloads` page that handles both guests and logged-in users, and integrates payment polling directly so users never get stuck.

### How it works

1. **PaymentVerify becomes a thin redirect** — immediately sends users to `/downloads?reference=XXX` regardless of auth status. No more waiting on that page.

2. **New `/downloads` page** handles everything in one place:
   - Shows payment status (pending/polling → success → download links)
   - Polls `check-payment-status` until completed/failed
   - **Logged-in users**: automatically fetches their purchased ebooks via signed URLs
   - **Guest users**: asks for the email used at checkout, then calls `guest-download-links` to get signed URLs
   - Shows download buttons once payment is confirmed

3. **Keeps existing backend functions** — `check-payment-status` and `guest-download-links` edge functions stay as-is; only the frontend flow changes.

### Files to change

| File | Change |
|------|--------|
| `src/pages/PaymentVerify.tsx` | Simplify to immediately redirect to `/downloads?reference=XXX&status=YYY` |
| `src/pages/GuestDownloads.tsx` | **Replace** with new unified `Downloads.tsx` |
| `src/pages/Downloads.tsx` | **New** — combined polling + email verification + download UI |
| `src/App.tsx` | Replace `/guest-downloads` route with `/downloads`, keep `/payment-verify` |

### Downloads page behavior

```text
User lands on /downloads?reference=XXX
        │
        ├─ Payment pending? → Show spinner + poll check-payment-status
        │       │
        │       └─ Status becomes completed → continue below
        │       └─ Status becomes failed → show error + retry link
        │
        ├─ Payment completed + logged in? 
        │       └─ Fetch order_items with signed URLs → show downloads
        │
        └─ Payment completed + guest?
                └─ Show email input → call guest-download-links → show downloads
```

### Technical details

- The Downloads page will embed the polling logic currently in PaymentVerify (calling `check-payment-status` every 3s)
- Once status resolves to `completed`, it transitions to the download view
- For logged-in users, it queries `order_items` joined with `ebooks` filtered by `payment_reference` (using the existing signed URL generation pattern from MyLibrary)
- For guests, it calls the existing `guest-download-links` edge function
- PaymentVerify becomes a simple redirect component that extracts URL params and navigates to `/downloads`
- The cart is cleared on the Downloads page once payment is confirmed (moved from PaymentVerify)

