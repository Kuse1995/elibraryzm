

## Problem
The payment flow works: Lenco processes payment → webhook updates order to `completed`. But the `PaymentVerify` page only reads the `status` from the URL query parameter (`?status=pending`) and never checks the database for updates. So the user is stuck on "Processing Payment..." forever.

## Solution: Add Payment Status Polling

Update `src/pages/PaymentVerify.tsx` to poll the `orders` table every 3 seconds when the status is pending, using the `reference` from the URL. Once the order status changes to `completed` or `failed`, update the UI accordingly and clear the cart on success.

### Changes

**`src/pages/PaymentVerify.tsx`**:
- Add a `useEffect` that polls `supabase.from("orders").select("status").like("payment_reference", reference + "%")` every 3 seconds when status is pending
- When a `completed` status is found, update local state to show success UI, clear cart
- When `failed` is found, show failure UI
- Clean up interval on unmount or when status resolves
- Add a manual "Check Payment Status" button as fallback

This means users will automatically see the success screen within ~3-6 seconds of approving payment on their phone, without needing to refresh.

