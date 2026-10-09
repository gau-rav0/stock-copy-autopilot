<div align="center">
  <h1>Follow Verified Investors</h1>
  <p>Investor discovery for people who want evidence before they follow anyone's market updates.</p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  </p>
  
  <br/>
  
</div>

<br/>

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
- Razorpay one-time checkout and signed webhook activation are implemented for non-demo profiles. Recurring billing, refunds, cancellation and entitlement expiry are not implemented; this is not a launch-ready subscription system.

## Local Setup

```bash
npm ci
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

Payments (use test-mode keys during validation):

```bash
NEXT_PUBLIC_RAZORPAY_KEY_ID=
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
4. Test the authenticated admin reviewer and atomic creator approval against staging evidence.
5. Add payments only after SEBI/legal review approves the product model.

## Checks and audit

```bash
npm test
npm run lint
npm audit --omit=dev --audit-level=moderate
npm run build
```

`lint` checks generated Next.js types and TypeScript. Tests cover redirect safety,
CSV/market validation, alert provider failures, and PostgreSQL RLS/transaction
behavior using PGlite. CI runs these checks on pull requests and main pushes.
See [the October 2026 audit](docs/audit-2026-10-09.md) for findings and remaining gaps.

## Alert delivery configuration

Set `RESEND_API_KEY`, `ALERTS_EMAIL_FROM` (a verified sending address),
`UNSUBSCRIBE_SECRET`, `NEXT_PUBLIC_SITE_URL`, and `CRON_SECRET` in the server
hosting environment. `WEBHOOK_SECRET` protects the internal trigger endpoint;
`BROKER_WEBHOOK_SECRET` signs broker events. Use independent random secrets.

Alert recipients are queued in the database when a transaction is inserted.
Next.js `after()` starts delivery immediately; the retry cron handles interruptions.
Workers claim up to 500 recipients per transaction with a ten-minute lease,
re-check consent and follow membership, and stop after three claimed attempts.
Identical batches use Resend idempotency keys. The current Vercel cron runs once
per day at 09:00 UTC, so retries and overflow can be delayed by a day; change the
schedule and worker capacity for a paid hosting plan before promising timely alerts.

## Rollout of the October audit changes

Apply the five `20261009*` migrations before deploying the updated routes. They
add authenticated approval/broker RPCs, a durable alert queue, a private checkout
ledger, and entitlement checks. The code requires these migrations.

Drain any pre-upgrade checkout orders first. New webhooks accept only orders
recorded in `checkout_orders`; legacy in-flight orders need reconciliation from
trusted Razorpay records. Existing active subscription rows remain available for
restoring follows. Old alerts are not automatically re-enqueued, which avoids
sending historical alerts to newer followers. Inspect failed legacy deliveries
before restarting them.

Verify changes in staging with a real Supabase session and Razorpay test-mode
webhooks, then run the hosted checks above. The local audit does not migrate or
exercise production services.
