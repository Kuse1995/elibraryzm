

# Plan: Sign Up Flow + Google Auth Integration

## Changes Overview

### 1. EbookDetail.tsx — Change CTA from "Sign In" to "Sign Up"
Update the button text and messaging to encourage new account creation rather than sign-in. Still links to `/auth` with redirect, but the messaging emphasizes creating an account.

### 2. Auth.tsx — Auto-show signup + Add Google Auth
- When `redirect` query param is present (coming from ebook page), default to signup view instead of login
- Add Google "Sign in with Google" button using Lovable Cloud managed auth
- After successful Google auth, redirect back to the ebook page

### 3. Create Lovable Cloud Auth Integration
Create `src/integrations/lovable/index.ts` with the Lovable Cloud auth client for Google OAuth using the managed solution (no custom credentials needed).

### 4. Add Google Icon
Import a Google icon for the auth button.

## Implementation Details

**EbookDetail.tsx:**
- Change button text from "Sign In to Purchase" → "Create Free Account to Purchase"
- Keep the redirect link to `/auth?redirect=/ebook/${id}`

**Auth.tsx:**
- Detect `redirect` query param on mount
- If redirect exists, default `isLogin` state to `false` (show signup)
- Add Google auth button below the email/password form
- Handle Google auth success by checking if user exists and redirecting

**src/integrations/lovable/index.ts:**
```typescript
import { lovable } from "@lovable.dev/cloud-auth-js";

export { lovable };
```

**vite.config.ts:**
- Add `/@lovable.dev/cloud-auth-js` to resolve alias if needed

**Package installation:**
- Add `@lovable.dev/cloud-auth-js` package

