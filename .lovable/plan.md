

## Two Issues Found + Fixes

### Issue 1: Payment Stuck on "Processing" (Published App)

**Root Cause**: Your latest purchase was a guest checkout (not logged in), so the order has `user_id = NULL`. The payment verification page polls the `orders` table, but the database security policy only allows reading orders where `auth.uid() = user_id`. Since `user_id` is NULL, the query returns nothing and the page never updates.

**Fix**: Create a new backend function `check-payment-status` that takes a payment reference and returns the order status server-side (bypasses security restrictions). Update `PaymentVerify.tsx` to call this function instead of querying the database directly.

- **New file**: `supabase/functions/check-payment-status/index.ts` — accepts `{ reference }`, queries orders using service role, returns `{ status }`.
- **Update**: `src/pages/PaymentVerify.tsx` — replace the direct database query with a call to the new function. On success, auto-redirect to `/my-library` after 2 seconds instead of showing a static success page.
- **Update**: `supabase/config.toml` — add `[functions.check-payment-status]` with `verify_jwt = false`.

### Issue 2: Direct "Buy Now" on Each Ebook Page

**Changes to `src/pages/EbookDetail.tsx`**:
- Remove cart-related logic (Add to Cart button, cart imports)
- Add inline payment form: phone number input, MTN/Airtel selector, email (for guests)
- Add "Buy Now" button that calls `initiate-payment` directly with a single item
- On success, navigate to `/payment-verify` as before

### Issue 3: Auto-Redirect to Downloads After Payment

**Update `src/pages/PaymentVerify.tsx`**:
- When status resolves to `completed`, auto-navigate to `/my-library` after a short delay (2 seconds) so users land directly on their downloads
- Still show the success message briefly so they know it worked

### Summary of Changes

| File | Change |
|---|---|
| `supabase/functions/check-payment-status/index.ts` | New — server-side status check |
| `supabase/config.toml` | Add JWT config for new function |
| `src/pages/PaymentVerify.tsx` | Use new function for polling; auto-redirect to My Library |
| `src/pages/EbookDetail.tsx` | Replace cart with inline Buy Now flow (phone, payment method, direct checkout) |

