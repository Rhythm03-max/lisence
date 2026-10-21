# Mauritius Business Licensing Platform

A production implementation of the Mauritius National Electronic Licensing System (NELS) portal. The public interface mirrors the official Mauritius Business Licensing Platform while the underlying features are fully functional, backed by Supabase (PostgreSQL, Auth, Storage, Row Level Security).

## Features

**Public portal**
- Home, licensing catalogue (by category and by agency), individual permit pages with application steps, required documents and legislation links.
- Public permit search by permit number, issue date and holder name.
- Public permalink per permit at `/publicsearch/wp/<permit-number>` (e.g. `/publicsearch/wp/MOL-WP-2026-23794`), openable by anyone.
- Token-based permit verification (QR code) rendered on a dedicated verification page.
- News, FAQ's / Did You Know / Notices, Terms of Use and Privacy Policy.

**Applicant self-service**
- Email-link registration and password login.
- Editable profile that prefills applications.
- Guided application wizard: requirements, applicant photograph + document upload, details (business + permit holder), and declaration.
- Application tracking with status, reviewer notes, uploaded documents and an issued-permit summary.
- Downloadable PDF acknowledgement of the submitted application (all captured details).

**Administration**
- Dashboard with records, applications and user statistics.
- Permit record management: create, edit, archive, photo upload, verification-token rotation and print-ready QR codes.
- Application review with four decisions (approve & issue, request more information, mark under review, reject).
- On approval: the applicant photo is published, a professional permit certificate PDF is generated (with a QR code linking back to the online permit), and the applicant is emailed a copy.
- Generate/regenerate the permit certificate PDF for any record.
- User management: change role, enable/disable accounts.
- Content management for news and FAQ's/notices.

## Tech stack

- Next.js 16 (App Router, React 19, Turbopack), TypeScript
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`): Postgres, Auth, Storage, RLS, RPC
- `zod` for input validation, `qrcode` for verification QR codes
- `pdf-lib` for server-side PDF generation, `nodemailer` for outgoing mail (your own SMTP)
- Reference CSS ported verbatim for a pixel-identical look

## Getting started

### 1. Create a Supabase project

Create a project at https://supabase.com and note the Project URL and the anon (publishable) key.

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in the values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Outgoing mail (your own SMTP server). Leave SMTP_HOST empty to disable sending.
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
MAIL_FROM=
MAIL_FROM_NAME=National Electronic Licensing System
```

`NEXT_PUBLIC_SITE_URL` is used to build QR codes and verification links, and to construct the auth email redirect URLs.

### 3. Apply the database schema and seed data

Run the SQL in your Supabase project's SQL editor (or via the Supabase CLI):

1. `supabase/migrations/20260101000000_init.sql` — tables, helper functions, RPCs, RLS policies and storage buckets.
2. `supabase/migrations/20260102000000_documents_pdf.sql` — generated-document columns, the `permit-documents` bucket and updated public RPCs.
3. `supabase/seed.sql` — categories, agencies, permits, news and FAQ content.

With the Supabase CLI:

```bash
supabase link --project-ref your-project-ref
supabase db push
psql "$DATABASE_URL" -f supabase/seed.sql
```

### 4. Create an administrator

Register a user through the app, confirm the email, then promote the account in the SQL editor:

```sql
update public.profiles set role = 'admin' where email = 'admin@example.com';
```

### 5. Configure Auth redirect URLs

In Supabase Auth settings, add your site URL and the callback route to the allowed redirect URLs, for example:

- `http://localhost:3000/**`
- `http://localhost:3000/auth/callback`

### 6. Run the app

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check |

## Authentication flow

Registration uses `signInWithOtp` (email magic link). The link points at `/auth/callback`, which exchanges the code for a session and redirects to `/profile`, where the user sets a password. Subsequent logins use email and password. Password resets use `resetPasswordForEmail`.

Middleware (`middleware.ts`) refreshes the session on every request, guards the protected routes (`/admin`, `/dashboard`, `/apply`, `/applications`, `/profile`) and enforces the admin role gate on `/admin`.

## Storage

- `permit-photos` — public bucket; candidate photographs appear on public permit cards. Writes restricted to administrators.
- `application-documents` — private bucket; applicants can upload and read their own documents, administrators can read all. Also stores the acknowledgement PDF. Downloads use short-lived signed URLs.
- `permit-documents` — public bucket; issued permit certificate PDFs, downloadable by anyone with the direct URL (the permit search results link to them).

## Documents & notifications

- **On submit** the applicant gets an acknowledgement PDF (all captured details + document list) stored in the private bucket and downloadable from the application page.
- **On approval** the applicant photograph is copied to `permit-photos`, a professional certificate PDF is generated with an embedded QR code, stored in `permit-documents`, and the applicant is emailed a copy (subject to SMTP being configured).
- The QR code on the certificate links to `/search-permits?permitNumber=<number>`, which auto-runs the public search and shows the permit with a direct PDF download.
- Admins can generate or regenerate a certificate from any permit record page.
- Mail uses your own SMTP server (`nodemailer`). If `SMTP_HOST` is not set, mail is skipped and logged; approval still succeeds.

## Security

- All tables use Row Level Security. Privileged operations are implemented as `SECURITY DEFINER` RPCs that re-check `is_admin()` or ownership internally.
- Public permit data is exposed only through dedicated RPCs (`search_public_permit`, `verify_permit_by_token`) that return a limited column set and never expose database identifiers.
- Verification tokens match `^v1_[A-Za-z0-9_-]{43}$` and can be rotated, invalidating previous QR codes.

## Project structure

```
src/
  app/
    (site)/        Public + applicant pages (own root layout with header/footer)
    (admin)/       Administration area (own root layout + sidebar shell)
    (verify)/      QR verification (own root layout, verify styling)
    api/qr/        QR code image generator (PNG/SVG)
    auth/callback/ Supabase auth code exchange
  components/       UI components (header, cards, forms, admin widgets)
  lib/
    supabase/       Browser, server and middleware clients
    actions/        Server actions (auth, applicant, admin, content, public)
    data.ts         Public catalogue queries
    admin-data.ts   Admin queries (RPC-backed)
    portal.ts       Applicant queries
    pdf.ts          PDF builders (acknowledgement + certificate with QR)
    documents.ts    PDF generation/upload orchestration
    mail.ts         SMTP mail delivery
supabase/
  migrations/       Database schema
  seed.sql          Reference data
```
