

## Plan: Admin Enhancements, Currency Change, and Mobile Money Payments

### 1. Grant Admin Role to abkanyanta@gmail.com
The user `abkanyanta@gmail.com` (ID: `9a6d881d-24a0-4519-af98-0502b1e771b1`) currently has only the `user` role. We need to insert an `admin` role for this user.

**Action**: Insert admin role via database insert tool.

### 2. Currency: Naira (₦) to Kwacha (K)
All price displays currently use `₦`. Every occurrence across the app needs to change to `K` (Zambian Kwacha symbol).

**Files to update**:
- `src/components/EbookCard.tsx` — card price display
- `src/pages/EbookDetail.tsx` — detail page price
- `src/pages/Cart.tsx` — cart item prices + total + pay button
- `src/pages/Admin.tsx` — admin dashboard revenue, ebook table prices, price input label
- `src/pages/Index.tsx` — no direct currency, but verify

Also update the edge function `initiate-payment/index.ts` to use `ZMW` currency instead of `NGN`.

### 3. Admin Edit Ebook Functionality
Currently the admin can only add and delete ebooks. We need to add an **edit** capability so admins can change pricing, title, author, description, category, and featured status of existing ebooks.

**Changes to `src/pages/Admin.tsx`**:
- Add an edit dialog/modal that pre-fills with the selected ebook's data
- Add an `updateEbook` mutation that calls `supabase.from("ebooks").update(...)` 
- Wire up the existing Pencil icon button to open the edit form

### 4. Payment Method: Mobile Money (MTN & Airtel) Priority
Replace the current card-based checkout form with a mobile money-first approach:

**Cart.tsx changes**:
- Show payment method tabs: **MTN Mobile Money**, **Airtel Money**, **Bank Transfer (Coming Soon)**
- MTN/Airtel tabs show a phone number input field instead of card fields
- Remove the card detail fields (or move behind a "Card" tab if needed later)
- Bank Transfer tab shows a "Coming Soon" badge/message, disabled

**Edge function `initiate-payment/index.ts` changes**:
- Accept a `paymentMethod` field (`mtn`, `airtel`) instead of card data
- Use Lenco's mobile money collection endpoint instead of card collection
- Remove card encryption logic for mobile money flows
- Update currency to `ZMW`

### 5. Remove billing address fields
Since mobile money doesn't require billing address, simplify the checkout form to just: email (for guests), phone number, and payment method selection.

### Summary of file changes

| File | Change |
|------|--------|
| Database | Insert admin role for abkanyanta@gmail.com |
| `src/pages/Admin.tsx` | Add edit ebook modal, change ₦ to K |
| `src/components/EbookCard.tsx` | ₦ → K |
| `src/pages/EbookDetail.tsx` | ₦ → K |
| `src/pages/Cart.tsx` | Replace card form with mobile money tabs, ₦ → K |
| `supabase/functions/initiate-payment/index.ts` | Mobile money flow, ZMW currency |

