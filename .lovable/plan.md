

# ELibrary — Christian Ebook Platform

A clean, welcoming Christian ebook marketplace where users can browse, purchase via Lenco checkout, and download ebooks. Includes an admin panel for catalog management.

---

## Pages & Layout

### Public Pages
- **Home/Landing** — Hero banner with tagline ("Your Christian Digital Library"), featured ebooks, and category browsing
- **Browse/Catalog** — Grid of ebook cards with cover image, title, author, price, and category filters (e.g., Devotionals, Bible Study, Fiction, Children)
- **Ebook Detail** — Full description, author info, preview excerpt, price, and "Buy Now" button
- **Cart** — Simple cart for multiple ebook purchases before checkout

### Auth Pages
- **Login / Sign Up** — Email-based authentication (optional for guest checkout)
- **My Library** — Logged-in users see their purchased ebooks with download links

### Admin Pages (protected)
- **Admin Dashboard** — Overview of sales and catalog stats
- **Manage Ebooks** — Add, edit, delete ebooks (title, author, description, price, cover image, PDF file, category)
- **Orders** — View all completed orders

---

## Core Features

### 1. Ebook Catalog
- Ebooks stored in database with metadata (title, author, description, price, cover image URL, file URL, category)
- Category filtering and search on the browse page
- Responsive card grid layout

### 2. Shopping & Checkout
- Add to cart functionality
- Guest checkout (email required) or logged-in checkout
- "Pay Now" redirects to Lenco hosted checkout page
- Webhook/callback to confirm payment and unlock download

### 3. Download Delivery
- After successful payment, show download link on a confirmation page
- Logged-in users can re-download from their "My Library" page
- Guest buyers see a one-time download page after payment

### 4. User Authentication
- Sign up / login with email and password via Supabase Auth
- User profiles to track purchases
- Optional — users can browse and buy as guests

### 5. Admin Panel
- Protected admin routes (role-based access)
- CRUD interface for managing ebooks (upload cover images and PDF files)
- View orders and payment status

---

## Backend (Supabase / Lovable Cloud)

- **Database tables**: ebooks, orders, profiles, user_roles
- **Storage**: Ebook cover images and PDF files in Supabase Storage
- **Edge Function**: Lenco payment integration — initiate checkout and handle payment confirmation
- **RLS policies**: Secure access to orders, admin-only write access to ebooks

---

## Design Direction
- Clean, modern design with warm, inviting colors (soft golds, whites, deep blues)
- Christian-themed branding with subtle cross or dove iconography
- Mobile-responsive layout throughout

