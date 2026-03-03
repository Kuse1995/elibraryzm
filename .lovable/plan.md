
## Problem: RLS Policies Blocking Payment Status Polling

The order IS completed in the database, but the frontend polling can't read it due to a **Row-Level Security misconfiguration**.

All SELECT policies on the `orders` table are set as **RESTRICTIVE** instead of **PERMISSIVE**. With restrictive policies, PostgreSQL requires ALL policies to pass simultaneously. So a regular user must satisfy both:
- "Admins can read all orders" (fails for non-admins)
- "Users can read own orders" (passes)

Since the admin check fails, the query returns no rows — the polling never sees the completed order.

The same issue affects **all tables** (`ebooks`, `order_items`, `profiles`, `user_roles`) — every policy is restrictive.

### Fix

Drop and recreate the SELECT policies on `orders`, `order_items`, `ebooks`, `profiles`, and `user_roles` as **PERMISSIVE** (the PostgreSQL default). This means any ONE matching policy grants access, which is the intended behavior.

**Database migration**:
- Drop all existing restrictive SELECT policies on these tables
- Recreate them as permissive with the same conditions
- Also fix INSERT/UPDATE/DELETE policies that should be permissive

This single change will fix both the payment verification polling and the My Library page for all users.
