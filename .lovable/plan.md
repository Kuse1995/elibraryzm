
Goal: fix the Admin dashboard showing 0 orders/customers after login (data exists), without weakening security.

What I found
- The data is still in the database:
  - orders: 18
  - order_items: 19
- Runtime failure is happening in the browser network calls:
  - GET /rest/v1/orders returns 500 with: `infinite recursion detected in policy for relation "orders"`.
- Root cause is RLS policy recursion introduced by author reporting policies:
  - `orders` author SELECT policy queries `order_items`
  - `order_items` SELECT policy queries `orders`
  - this creates a circular policy evaluation path.

Implementation plan

1) Database hotfix migration (primary fix)
- Replace recursive cross-table policy checks with SECURITY DEFINER helper functions.
- Add function `public.user_can_read_order(_order_id uuid, _uid uuid)`:
  - checks ownership/admin/author access internally (bypassing RLS safely).
- Add function `public.user_can_read_order_item(_order_id uuid, _ebook_id uuid, _uid uuid)`:
  - checks admin OR order owner OR author of ebook.
- Update policies:
  - `orders` SELECT policies call `user_can_read_order(...)` (no direct `order_items` subquery in policy).
  - `order_items` SELECT policies call `user_can_read_order_item(...)` (no direct recursive reference chain).
- Keep admin full visibility intact; keep authors limited to only their book-related sales.

2) Admin page resilience improvements
- In `src/pages/Admin.tsx`, stop silently masking failed queries as empty arrays.
- Add explicit query error handling for orders/customers:
  - show an error alert/toast (e.g., “Could not load orders”)
  - avoid rendering misleading 0 values when query failed.
- Keep existing successful behavior unchanged.

3) Author reporting validation (post-fix sanity)
- Verify `src/pages/AuthorDashboard.tsx` sales query still works with new policies.
- Ensure authors still only see sales tied to their own approved books.

4) Verification checklist (after apply)
- Admin user:
  - `/admin` stats show real order/customer/revenue counts
  - Orders tab loads rows
- Author user:
  - Sales tab only shows own book sales
- Non-admin/non-author user:
  - cannot access admin data
  - can only see own orders where applicable

Files that will be touched
- New migration in `supabase/migrations/*.sql` (functions + policy rewrites)
- `src/pages/Admin.tsx` (query error-state handling)

Why this approach
- Fixes the exact production failure (`infinite recursion`) at the source.
- Preserves strict access control (no broad public reads).
- Prevents future “false zero” UI states by surfacing query failures clearly.
