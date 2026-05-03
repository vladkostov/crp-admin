# OFM CRM Admin Dashboard

Clean, modern CRM/Admin dashboard starter for a small OnlyFans management team.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Database, Storage)
- Vercel deployment ready

## Implemented in this scaffold

- Authentication flow (email/password via Supabase)
- Protected dashboard routes (`/dashboard/*`)
- Responsive dashboard shell with:
  - Sidebar navigation (desktop)
  - Mobile drawer navigation
  - Dark/light mode toggle
- Dashboard home with overview cards and recent activity
- Feature route scaffolds:
  - Models
  - Social Media
  - Traffic & Engagement
  - Fans CRM
  - Messages
  - Content
  - Revenue
- Initial Supabase schema migration for CRM entities

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy env file:

   ```bash
   cp .env.example .env.local
   ```

3. Add your Supabase project values in `.env.local`:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Run database migration in Supabase SQL editor:

   - `supabase/migrations/0001_initial_schema.sql`

5. Start dev server:

   ```bash
   npm run dev
   ```

## Deploy to Vercel

1. Import project in Vercel.
2. Set the same environment variables from `.env.local`.
3. Deploy.
