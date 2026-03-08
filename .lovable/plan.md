

## Author Portal — Self-Service Book Submissions & Sales Reports

This is a significant feature that adds a new user role ("author") with its own portal for submitting books, tracking approvals, and viewing sales data.

### New Role: `author`

Add `author` to the existing `app_role` enum. Authors are distinct from regular users and admins. They can sign up normally, then request author status (or an admin grants it).

### Database Changes

| Change | Detail |
|--------|--------|
| Add `author` to `app_role` enum | Enables role-based access for authors |
| Add `submitted_by` column to `ebooks` | UUID referencing the author's user ID (nullable for existing admin-uploaded books) |
| Add `approval_status` column to `ebooks` | Text: `pending`, `approved`, `rejected` (default `approved` for backward compat) |
| Update RLS on `ebooks` | Authors can INSERT their own books (status forced to `pending`), SELECT their own books, but only `approved` books visible publicly |
| Update RLS on `orders`/`order_items` | Authors can SELECT order items for their own ebooks (sales reporting) |

### New Pages & Components

| File | Purpose |
|------|---------|
| `src/pages/AuthorDashboard.tsx` | Main author portal with tabs: My Books, Submit Book, Sales Report |
| `src/pages/AuthorAuth.tsx` (optional) | Could reuse existing Auth page with an "Author signup" toggle, or just let authors use normal signup + request author role |

### Author Dashboard Tabs

1. **My Books** — List of author's submitted ebooks with status badges (pending/approved/rejected)
2. **Submit Book** — Form: title, description, category, price suggestion, cover upload, file upload. Inserts with `approval_status = 'pending'` and `submitted_by = auth.uid()`
3. **Sales Report** — Query `order_items` joined with `ebooks` where `submitted_by = author_id` and order status = `completed`. Show total sales count, total revenue, per-book breakdown

### Admin Side Changes

- Add **"Submissions"** tab to Admin page showing pending books with Approve/Reject buttons (updates `approval_status`)
- Optionally, an admin can grant `author` role to users from the Users tab

### Auth & Routing

- Add `/author` route to `App.tsx`
- Guard with `has_role(uid, 'author')` check
- Add "Author Portal" link in nav for users with author role
- Author signup: normal signup → then a button/page to "Apply as Author" which inserts their role (or admin approval flow)

### Security

- Authors can only see/edit their own submissions
- Authors cannot set `approval_status` to `approved` — only admins can
- Sales data filtered server-side to only show the author's own books
- Price and totals come from order records, not client calculations

### Summary of Files to Change

| File | Change |
|------|--------|
| Migration SQL | Alter enum, add columns, update RLS |
| `src/pages/AuthorDashboard.tsx` | New — author portal |
| `src/pages/Admin.tsx` | Add Submissions tab for approvals |
| `src/hooks/useAuth.tsx` | Add `isAuthor` check |
| `src/components/Layout.tsx` | Add Author Portal nav link |
| `src/App.tsx` | Add `/author` route |
| `src/pages/Browse.tsx` / queries | Filter to only show `approved` ebooks publicly |

