

## 50% Upsell Offer on Ebook Detail Page

When a customer views an ebook and is about to buy, we show a "Add another book at 50% off" section with a checkbox. They can tick it to bundle a second book at half price, then pay for both in one transaction.

### Where it appears

On the **EbookDetail page** (`src/pages/EbookDetail.tsx`), between the description and the Buy Now form. This is the natural decision point before payment.

### How it works

1. **Fetch suggestion**: Query a random ebook from the same category (excluding the current one). If none in the same category, pick any other random ebook.
2. **Display upsell card**: Show a compact card with the suggested book's cover, title, author, original price crossed out, and the 50% price — with a checkbox to add it.
3. **Price update**: When checked, the "Buy Now" button text and total updates to reflect both books (full price + 50% price). The `items` array sent to `initiate-payment` includes both ebook IDs.
4. **Backend handling**: The `initiate-payment` edge function already calculates totals server-side from ebook prices. We need to pass a `discountItems` array (IDs at 50%) so the server applies the discount correctly rather than trusting client-side math.

### Files to change

| File | Change |
|------|--------|
| `src/pages/EbookDetail.tsx` | Add upsell query, checkbox UI, update items array sent to payment |
| `supabase/functions/initiate-payment/index.ts` | Accept `discountItems` param, apply 50% to those ebook prices when calculating total |

### UI sketch

```text
┌─────────────────────────────────────┐
│  📚 Special Offer — 50% Off!       │
│                                     │
│  ☐  Add "Book Title" by Author      │
│     ~~K80~~  K40                    │
│                                     │
└─────────────────────────────────────┘
```

### Backend discount logic

The `initiate-payment` function will accept an optional `discountItems` array of ebook IDs. For those IDs, the price is halved. This prevents clients from faking discounts — the server validates which items qualify.

```text
total = sum(full-price items) + sum(discount items at 50%)
```

The order's `items` JSON will store the actual price paid per item (including the discounted amount) for accurate records.

