

# Add "Free Resources" Category

## Overview
Add a "Free Resources" category so admins/authors can upload free downloadable content. Items with price=0 will show "Free" labels and direct download buttons instead of cart/payment flows.

## Changes

### 1. Add category to types
**`src/lib/types.ts`** — Add `"Free Resources"` to the `CATEGORIES` array.

### 2. EbookCard — Free item display
**`src/components/EbookCard.tsx`** — When `ebook.price === 0`:
- Show "Free" instead of "K0"
- Show a "Download" button (links to detail page) instead of "Add to Cart"

### 3. EbookDetail — Free download flow
**`src/pages/EbookDetail.tsx`** — When `ebook.price === 0`:
- Show "Free" instead of price
- Replace the "Buy Now" payment form with a "Download Free" button
- Logged-in users: generate a signed URL via the existing `guest-download-links` edge function (or directly via storage signed URL) and trigger download
- Not logged in: prompt to create account first (reuse existing pattern)
- Hide the upsell section for free items

### 4. Admin & Author forms
No changes needed — they already support price=0 and the new category will appear in the dropdown automatically since both use `CATEGORIES`.

### 5. Browse page
No changes needed — the new category will appear as a filter button automatically.

### 6. Index page
No changes needed — categories grid pulls from `CATEGORIES` automatically.

