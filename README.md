# VISIT RWANDA: tourism website and booking platform

React + TypeScript + Tailwind + Framer Motion + Lucide on the front end. Supabase (PostgreSQL, Auth, Storage, RLS) as the backend. One Vercel serverless function (`/api/send-confirmation`) sends booking emails via Resend.

## 1. Supabase (5 minutes)
1. Create a project at supabase.com.
2. SQL Editor: run `supabase/schema.sql`, then `supabase/seed.sql` (demo content, all flagged *demo* and *awaiting verification*; no phone numbers, emails or fees are invented).
3. Authentication > URL Configuration: set Site URL to your Vercel URL and add `https://YOUR-APP.vercel.app/**` and `http://localhost:5173/**` to Redirect URLs.
4. Authentication > Providers: enable Email (keep "Confirm email" ON), and Google, Azure (Microsoft / Entra ID) and Apple with the credentials from each provider. Enterprise SSO (SAML) is configured under Authentication > SSO Providers (paid plan).
5. Authentication > Sessions: set a JWT expiry / inactivity timeout you are comfortable with (the admin console also logs out after 30 minutes of inactivity).
6. Create your first Super Admin: sign up on the website, then in the SQL Editor run:
   `update public.profiles set role = 'super_admin' where email = 'you@example.com';`
   Nobody can become an admin from the front end: a database trigger and RLS allow only a Super Admin (or the SQL editor) to change roles.
7. Storage: buckets `media` (public) and `avatars` are created by the schema. Free plan upload cap is 50 MB per file; compress hero videos (H.264 MP4, around 10-20 MB).

## 2. Deploy on Vercel
1. Push this folder to GitHub, then Vercel > Add New Project > import it. Framework preset: Vite (auto-detected through `vercel.json`).
2. Environment variables:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (public by design; RLS protects data)
   - `VITE_SITE_URL` = your production URL
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY` (for the email function)
   - `RESEND_API_KEY`, `EMAIL_FROM` (optional: without them bookings still work, emails are skipped)
3. Deploy. Never put the Supabase *service_role* key in any `VITE_` variable.

## 3. Local development
```
npm install
cp .env.example .env.local   # fill in values
npm run dev
```
`npm run typecheck` runs the TypeScript checker.

## What's included
- Public site: animated hero with admin-managed video, rotating words, scroll progress bar, 15 home sections, About Rwanda with map, destinations directory with filters, destination detail pages (carousel, video, map, contacts, fees, FAQ, reviews, related, floating BOOK NOW), packages, contact, newsletter.
- Booking: availability check, server-side pricing, capacity locking (no double booking), reference numbers, confirmation page and email, my bookings, history, cancellation within each attraction's policy window.
- Auth: email/password, Google, Microsoft, Apple, enterprise SSO, email verification, password reset, profile with photo.
- Admin (`/admin`): separate login with Entra ID / Google Workspace SSO, 15 sidebar sections, generic CRUD with image/video upload and preview, verification flags, publish/feature toggles, audit log, roles (super_admin, admin, content_manager, booking_manager, editor), 30-minute idle logout.
- Database: 16 tables, FKs, checks, indexes, RLS, audit triggers, storage policies.

## Before going live
- Replace demo content with verified information; flip attractions to *Verified* only after checking official sources.
- Set real prices (empty price = "price to be confirmed", total shown as TBC).
- Add real contact details, images and the hero video in the admin panel.
