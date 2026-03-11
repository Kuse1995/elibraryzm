

# Brand Website with E Library Logo

## Overview
Copy the uploaded logo to `src/assets/` and replace every instance of the `<Book>` icon + "ELibrary" text branding with the actual logo image across the site. Also fix the existing build error.

## Build Error Fix
The `@lovable.dev/cloud-auth-js` module error is from the auto-generated `src/integrations/lovable/index.ts`. Since the package is already in `package.json`, this should resolve on next install. No manual changes needed to that file.

## Logo Placement (4 locations)

### 1. Copy logo to project
Copy `user-uploads://96a5fe8b-6a18-41c1-936f-eec90defba7e.png` → `src/assets/elibrary-logo.png`

### 2. Layout.tsx — Header logo
Replace `<Book>` icon + "ELibrary" text with:
```tsx
import logo from "@/assets/elibrary-logo.png";
// ...
<img src={logo} alt="E Library" className="h-8" />
```

### 3. Layout.tsx — Footer logo
Same replacement in the footer section.

### 4. Auth.tsx — Auth page branding (2 spots)
Replace `<Book>` icon on both the signed-in view and the login/signup form header with the logo image.

### 5. index.html — Favicon
Copy logo to `public/favicon.png` and update the favicon link in `index.html`.

### 6. Update text references
- "ELibrary" → "E Library" in Layout footer copyright, Admin page, Auth page description

