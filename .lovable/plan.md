

# Welcome User + Admin Users Tab

## Overview
Three changes: (1) Show "Welcome, Name" instead of "Sign Up Free" on homepage when logged in, (2) Hide "Sign In" link in footer when logged in, (3) Add a "Users" tab in Admin showing all registered users with their names and activity.

## Changes

### 1. Homepage hero — conditional sign-up button
**`src/pages/Index.tsx`** — Import `useAuth`, get `user`. When logged in, replace "Sign Up Free" button with a greeting: "Welcome, {displayName}" (from `user.user_metadata.display_name`). When not logged in, keep existing button.

### 2. Layout footer — conditional sign-in link
**`src/components/Layout.tsx`** — Hide the "Sign In" footer link when `user` is present. Optionally show "My Library" instead.

### 3. Layout header — show user name
**`src/components/Layout.tsx`** — Next to the sign-out button, show user's display name from `user.user_metadata.display_name` in a small greeting text or avatar area.

### 4. Admin — Users tab with names and activity
**`src/pages/Admin.tsx`**:
- Add a new "Users" tab alongside existing tabs
- Query `profiles` table (admin can read all via RLS) to get all users with `display_name`, `email`, `created_at`
- Cross-reference with `orders` to show per-user activity: order count, total spent, last active date
- Cross-reference with `user_roles` to show each user's role badges
- Display in a table: Name, Email, Role(s), Orders, Total Spent, Joined Date

No database changes needed — existing RLS policies already allow admins to read all profiles and orders.

