

# Fix: Sign Up Button Visibility on Homepage

## Problem
The "Sign Up Free" button in the hero section uses `variant="outline"` which defaults to `bg-background` (white background) and the text classes `text-primary-foreground` resolve to white on the dark primary hero background — but the outline variant's base styles override with white text/bg.

## Fix
**`src/pages/Index.tsx` line 52** — Remove `variant="outline"` and use explicit classes for a transparent button with visible white text and border:

```tsx
<Button size="lg" className="border border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 text-base px-8">
```

This ensures the button has no background fill, white text, and a subtle white border — fully visible on the dark hero.

