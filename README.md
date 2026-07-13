# Follow Verified Investors

Investor discovery for people who want evidence before they follow anyone's market updates.

The app is a Next.js 16 demo for a read-only investor marketplace: users can roast a portfolio, compare fictional seeded investor profiles, inspect holdings and replay history, and submit creator verification applications. It is intentionally educational and evidence-first. It does not provide investment advice, copy trades, execute orders, manage funds, or request trading permissions.

## What Is Built

- Home page with Portfolio Roast, Explore, creator onboarding, and replay paths
- Explore page with style filters and 10 fictional demo investors
- Investor profile pages with metrics, holdings, growth chart, replay timeline, conviction alerts, trust score, and compliance notices
- Portfolio Roast funnel that scores holdings and routes users into evidence-ranked investor comparison
- Beginner Mode panels and a learning page for plain-language investing terms
- Creator verification flow with CAS PDF/text upload or manual holdings entry
- Server-side CAS text extraction and conservative holdings parsing for reviewer checks
- Supabase schema migrations for marketplace seed data, lead capture, creator review, parsed holdings, deletion requests, and outbound delivery audit rows
- Supabase-backed marketplace queries for home, explore, investor, and conviction ticker views
- Optional CRM webhook and operations email notifications for roast leads, follow intents, and creator applications
- AI helper in `lib/ai.ts` that reads `KMICHI_API_*` env vars first, with generic OpenAI-compatible aliases as fallbacks

## Current Boundaries

- Seeded investor profiles and holdings are fictional demo data.
- CAS parsing extracts recognizable equity rows and keeps every application in pending human review.
- Broker connection requests are now stored as read-only metadata; provider authorization remains pending until a broker-specific OAuth or server-to-server adapter is configured. No broker password, API key, access token, or order permission is stored by the app.
- Paid creator/follower features are not launch-ready until legal and SEBI review is complete.
- Payments and Razorpay subscriptions are not wired yet.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

CRM and operations notifications:

```bash
CRM_WEBHOOK_URL=
CRM_WEBHOOK_SECRET=
CRM_EMAIL_TO=
OPERATIONS_EMAIL_TO=
OPERATIONS_EMAIL_FROM=
RESEND_API_KEY=
WEBHOOK_SECRET=
BROKER_WEBHOOK_SECRET=
```

`CRM_WEBHOOK_URL` receives JSON events for `roast_lead`, `follow_intent`, and `creator_application`. `RESEND_API_KEY` plus an operations email destination sends a plain-text alert for the same events.

## Broker trade-webhook contract

The integration endpoint is `POST /api/integrations/broker/trades`. It only accepts a signed, server-to-server payload from a provider adapter; it does not accept brokerage credentials from a browser. Sign the exact JSON request body with HMAC-SHA256 using `BROKER_WEBHOOK_SECRET` and send the hex digest as `x-fvi-signature`.

```json
{
  "creatorUserId": "<Supabase auth user UUID>",
  "broker": "zerodha",
  "externalTradeId": "provider-fill-id",
  "ticker": "INFY",
  "action": "add",
  "price": 1512.5,
  "allocationBefore": 8.2,
  "allocationAfter": 12.7,
  "occurredAt": "2026-07-13T10:30:00.000Z"
}
```

The creator must be verified and have an `active` read-only connection before events are accepted. A provider OAuth callback or managed adapter is responsible for changing a reviewed connection from `awaiting_authorization` to `active`. Accepted events create a portfolio update and trigger follower email alerts, subject to each follower's email preference. This is alerting only: FVI never executes, copies, or recommends trades.

AI summaries:

```bash
KMICHI_API_URL=
KMICHI_API_KEY=
KMICHI_MODEL=
```

Generic aliases also work: `AI_API_URL`, `AI_API_KEY`, `AI_MODEL`, `OPENAI_API_KEY`, `OPENAI_MODEL`, and `OPENAI_BASE_URL`.

Payments placeholder:

```bash
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

## Supabase Deploy

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

The `Deploy Supabase migrations` workflow runs on pushes that change `supabase/**` and can also be triggered manually.

## Hosted App Verification

Before treating production as ready:

1. Confirm Vercel has the Supabase, CRM/email, and AI variables needed for the selected features.
2. Run the Supabase migration workflow or `npx supabase db push` against the production project.
3. Verify GitHub Actions completed successfully for the migration commit.
4. Open the deployed Vercel URL and test home, roast, explore, creator onboarding, and an investor profile on mobile and desktop.
5. Submit one test creator application and confirm the Supabase row, parsed holdings, CRM webhook, and operations email destinations.

## Compliance Posture

- Follow means read-only portfolio-update notifications in this demo.
- Verification labels must show whether a profile is demo, CAS-reviewed, or broker-reviewed.
- User-facing copy should avoid advice, recommendations, guaranteed outcomes, or automatic trade language.
- Paid creator/follow features and India/NSE positioning require qualified legal review, including SEBI implications, before launch.

## Next Build Steps

1. Apply migrations to the production Supabase project and verify tables in the dashboard.
2. Configure production CRM/email destinations and test delivery failure handling.
3. Expand CAS parsing with real sample statements from supported providers.
4. Add authenticated reviewer tooling for approving parsed creator applications.
5. Add payments only after SEBI/legal review approves the product model.
