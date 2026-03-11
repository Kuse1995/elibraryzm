

# Fix: Require Account Before Purchase

## Problem
Customers pay via Mobile Money but miss the download page (close browser, lose the link, etc.). Since guest checkout doesn't tie purchases to a persistent account, there's no way for them to retrieve their books later. You end up manually sending files.

## Solution
**Require sign-in/sign-up before purchasing.** This way every purchase is linked to their account, and they can always return to **My Library** to re-download their books.

### Changes

**1. EbookDetail.tsx — Block purchase for guests**
- Instead of showing the payment form to unauthenticated users, show a "Sign in to purchase" prompt with a link to `/auth` (passing a redirect-back URL so they return to the ebook page after login).
- Remove the guest email input field entirely — no more guest checkout.

**2. initiate-payment edge function — Enforce userId**
- Reject requests where `userId` is null. This prevents any guest orders from being created server-side.

**3. Downloads page — Simplify**
- Remove the guest email verification flow. Since all buyers are authenticated, always use `user.id` to fetch downloads.
- Keep the page functional for existing guest orders (backward compatibility) but new purchases will always be tied to accounts.

**4. My Library page — Already works**
- The existing `/my-library` page already queries `order_items` by `user_id` and generates signed download URLs. No changes needed here — it already serves as the permanent library.

**5. Navigation / UX improvements**
- After successful payment on the Downloads page, add a prominent "Go to My Library" link so users know where to find their books in the future.
- Add a note on the My Library page: "All your purchased ebooks are available here forever."

### What this fixes
- Every purchase is permanently linked to a user account
- Customers can return to `/my-library` anytime to re-download
- No more manual file sending
- The Downloads page still works for post-payment confirmation, but My Library becomes the long-term access point

