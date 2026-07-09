# Stock Copy (Autopilot)

Next.js 16 V0 for the "GitHub for investing" idea: users discover fictional demo investors, inspect historical portfolio examples, replay allocation changes, follow read-only conviction updates, and enter through a Portfolio Roast funnel.

The app runs on seeded demo data out of the box. When Supabase environment variables are present, the marketplace pages read from Supabase and fall back to demo data if the database is empty or unavailable.

## Built

- Landing page with Portfolio Roast, Explore, creator, and replay CTAs
- Explore page with style filters and 10 fictional demo investors
- Investor profile with metrics, holdings, growth chart, replay, conviction alerts, and compliance notice
- Portfolio Roast page with score, roast copy, and share-card preview
- Demo Trust Score for investors based on verification status, returns, drawdown, volatility, consistency, and holdings transparency
- Portfolio Roast funnel that moves users from roast results into evidence-ranked investor comparison
- Beginner Mode panels and learning page for explaining core investing terms in plain language
- Creator connect flow for CAS upload or manual demo entry
- Supabase schema migrations in `supabase/migrations`
- Supabase-backed marketplace queries for the home, explore, investor, and conviction ticker views
- AI helper in `lib/ai.ts` that reads `KMICHI_API_*` env vars first

## Stubbed

- CAS upload accepts a file but does not parse it yet.
- Razorpay subscriptions are not wired yet.
- Broker sync is intentionally not built. Validate read-only broker access, broker ToS, and SEBI implications before starting it.

## Compliance posture

- All seeded profiles and holdings are fictional demo data.
- The app does not provide investment advice.
- The app does not copy trades, execute orders, manage funds, or request trading permissions.
- Follow means read-only portfolio-update notifications in this demo.

## Installation & Setup

Follow these steps to run the project locally:

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/stock-copy-autopilot.git
   cd stock-copy-autopilot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the app**
   Visit `http://localhost:3000` in your browser.

## kmichi API

Set these in `.env.local` when you wire live AI summaries:

```bash
KMICHI_API_URL=
KMICHI_API_KEY=
KMICHI_MODEL=
```

Generic aliases also work: `AI_API_URL`, `AI_API_KEY`, and `AI_MODEL`.

## Supabase deploy

Create a Supabase project, then run:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

For GitHub Actions, add these repository secrets:

```bash
SUPABASE_ACCESS_TOKEN=
SUPABASE_PROJECT_REF=
SUPABASE_DB_PASSWORD=
```

Then run the `Deploy Supabase migrations` workflow from GitHub Actions, or push changes under `supabase/`.

For the hosted app, set these Vercel environment variables from Supabase Project Settings > API:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Next Build Steps

1. Create the Supabase project and run the migrations.
2. Add production Supabase environment variables to Vercel.
3. Wire CAS parsing for V1 verification.
4. Add Razorpay subscription creation and webhooks.
5. Validate SEBI and broker ToS before any broker integration.
