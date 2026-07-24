## What's broken

Two independent problems, both currently unconfirmed at root cause — the plan starts by verifying each, then fixes.

**1. WhatsApp (Grace) — total silence.** No `whatsapp-webhook` invocations show up in edge logs at all, so Twilio is almost certainly not reaching our function (wrong URL in Twilio sandbox/sender, or the webhook is 500-ing before it can log). We need to confirm which.

**2. Web MTN/Airtel payment.** Two recent live tests (order `elib-1784906273927…` and `elib-1784906331417…`, both K1.00, MTN, number 0967254226) got a Lenco reference back — so Lenco *accepted* the collection request — but the orders ended `failed`. That means either (a) Lenco failed the STK server-side (wrong operator/limits/merchant) so no prompt ever fired, or (b) it fired, user entered PIN, and Lenco marked it failed. Right now the app just shows "failed" without the reason from Lenco.

Airtel path: same code, same story — PIN accepted then "failed" with no visible reason.

## Fix plan

### Step 1 — Diagnose (read-only, no code yet)
- Query Lenco `GET /collections/{lencoReference}` for the two failed orders to read the exact `reason`/`failureReason` field.
- Confirm the current Twilio WhatsApp webhook URL configured on the sender by asking you to paste what's in the Twilio Console (Sender → "When a message comes in"). Expected: `https://urevgkspvzyazikrfmvp.supabase.co/functions/v1/whatsapp-webhook`.
- Send a manual `curl` to the webhook to prove it responds and produces a log entry — if it does, Twilio config is the issue; if it doesn't, the function itself is failing on boot.

### Step 2 — Web payments: surface Lenco's real failure reason
In `supabase/functions/initiate-payment/index.ts` and `supabase/functions/check-payment-status/index.ts`:
- Store Lenco's `reason` / `failureReason` / `message` on the order (new nullable `failure_reason` column on `orders`).
- Return it to the client so `Cart.tsx` can toast the exact cause ("insufficient balance", "wrong operator", "user cancelled", etc.) instead of a generic "failed".
- In `Cart.tsx`, add a small client-side guard: reject 097/077 numbers when MTN is selected and 096/076 when Airtel is selected (Zambian prefix mapping) with a clear message *before* we hit Lenco.

### Step 3 — WhatsApp: unblock Grace
Depending on Step 1 result:
- **If Twilio URL is wrong / empty:** provide the exact URL to paste into the Twilio sender's inbound webhook (POST, form-encoded). No code change.
- **If the webhook is crashing on boot:** the most likely culprit is the Kimi timeout path or a Supabase call throwing before any reply. Add a top-level try/catch that always returns a TwiML "One moment…" reply, and log the error to `console.error` so it shows up in edge logs on the next inbound message. This guarantees Grace at least *says something* even when Kimi/Gemini/DB is slow.
- Add a `/health` early-return branch (`GET` returns 200 "ok") so we can smoke-test the deployed function directly from a browser.

### Step 4 — Verify end-to-end
- Retrigger a WhatsApp message from your number and confirm a log row appears and a reply comes back.
- Run a fresh K1 MTN test on the web and confirm the toast now shows the exact Lenco reason on failure (or succeeds).

## Technical details

- New migration: `alter table public.orders add column failure_reason text;` (nullable, no grant/policy changes needed — `orders` already has RLS + grants).
- Lenco status lookup: `GET https://api.lenco.co/access/v2/collections/{lencoReference}` with `Authorization: Bearer ${LENCO_API_TOKEN}`.
- Zambian prefix map used for client-side validation: MTN = `096`, `076`; Airtel = `097`, `077`; Zamtel = `095`, `075`. Accept `+260` prefix as well.
- WhatsApp health check: `if (req.method === "GET") return new Response("ok")` at the very top of the handler.

## Files touched
- `supabase/migrations/<new>.sql` — add `orders.failure_reason`.
- `supabase/functions/initiate-payment/index.ts` — persist + return Lenco reason.
- `supabase/functions/check-payment-status/index.ts` — same, on the polling path.
- `supabase/functions/whatsapp-webhook/index.ts` — health check + hardened top-level catch.
- `src/pages/Cart.tsx` — prefix validation + show real failure reason in the toast.

## Not in scope
- Rewriting the Grace AI persona / conversation state machine (unchanged).
- Switching payment providers.
- Any UI redesign outside the checkout error toast.
