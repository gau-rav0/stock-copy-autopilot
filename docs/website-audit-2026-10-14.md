# FVI website audit — 14 October 2026

Audited: https://fvi-ochre.vercel.app and the source tree corresponding to `main` commit `b981863c102eb85695022060245a8185fdec381a`.

The main opportunity is to make the working portfolio tool easy to try, accurately describe the marketplace's early-access state, and make every evidence claim dependable. The dark green identity can stay. Fixing correctness and reducing mobile friction should precede a broad visual redesign.

## Scope and confidence

- Inspected the live homepage, explore directory, roast, creator onboarding, investor detail, dashboard, and sign-in error behavior. Tested responsive layouts at 390×844 and 1440×900; used DOM measurements where the browser panel cropped screenshots.
- Checked 16 public URLs: principal public pages returned 200; a nonexistent investor returned 404; the anonymous dashboard redirected to sign-in; robots, sitemap, and the social image responded successfully.
- Ran a roast using only the site's fictional prefilled holdings, without an email or name. It completed using fallback market prices and deterministic copy.
- Ran controlled local calculations with stubbed market data to isolate duplicate-lot and trust-score defects. Inspected authentication, creator approval, capture, payment, schema, typography, and metadata code.
- Ran `npm audit --omit=dev` against the release checkout. Findings identify vulnerable package versions, not evidence of compromise or proof that every advisory is reachable on Vercel.
- Did not create real applications, send sign-in emails, change follows or account settings, approve creators, make payments, or test attacks against production. Production database policies, provider delivery, billing lifecycle, and real statement review remain to be validated in staging.
- No analytics account was inspected. CTR and conversion effects below are hypotheses to measure, not claimed uplift.

## Ranked bugs and risks

P1 = fix before expanding traffic or onboarding. P2 = next release. P3 = polish or optimization. “Code” means the defect follows from the checked source/schema; it was not exercised against production records.

| ID | Priority | Finding and evidence | Recommended fix |
|---|---|---|---|
| B01 | P1 | **Sign-in return paths are unsafe and can crash.** Live `/auth?next=%25` displayed “Server meltdown.” Console: `URIError: URI malformed`. `app/auth/page.tsx:28` decodes an already-decoded query value and passes it directly to `location.replace`. External return targets are also unrestricted in this client path; that exposure is code-confirmed, not tested by navigating users off-site. | Use one shared validator for local return paths in both client and callback. Avoid double decoding; reject protocol-relative URLs, backslashes, control characters, and external targets. Return to a safe local default on malformed input. |
| B02 | P1 | **Dashboard can hide every followed investor.** `app/dashboard/page.tsx:58` orders followers by `created_at`; `supabase/migrations/0001_init.sql:70` defines `followed_at`. The query error is discarded and becomes an empty array. Alert queries also nest creator names under `portfolios.profiles`, while the declared/consumed shape expects `profiles` directly. Code/schema confirmed; no real following records were changed. | Order by `followed_at`, map the relation shape correctly, and display an explicit load failure instead of a false empty state. Cover this with a real follower/transaction fixture in staging. |
| B03 | P1 | **Duplicate stock rows change risk without changing the portfolio.** Controlled local test: 10 INFY units in one row → concentration 100%, risk 100, score 47. The identical position split into five 2-unit rows → concentration 20%, risk 40, score 69. `lib/portfolio.ts:60` preserves duplicate rows; concentration at line 189 uses the largest row, not total exposure per symbol. | Aggregate lots by symbol before exposure, concentration, count, and scoring. Preserve dates/costs for any lot-level analysis. The score must be invariant when a position is split into equivalent rows. |
| B04 | P1 | **Roast metrics are labelled more precisely than the calculation supports.** `lib/portfolio.ts:178` averages individual annualized returns, and line 183 weights each stock's separate maximum drawdown using current weights. Neither reconstructs a portfolio value/cash-flow series. Histories cover one year even when purchase dates are older. Benchmark duration uses average holding months. Code confirmed. | Label current outputs as estimates/proxies, and remove claims that they are realized portfolio CAGR or maximum drawdown. For portfolio metrics, implement aligned historical valuations and appropriate cash-flow-aware return calculations, then compare the same period. |
| B05 | P1 | **Fallback data warning disappears from the share card.** The live sample showed “Estimated: one or more live prices were unavailable…” in the full report, but the exportable card displayed return, drawdown, CAGR, and Nifty figures without that warning. `getBenchmarkHistory` also returns fallback values without propagating its source. | Carry data source, timestamp, coverage, and estimation labels into the modal, card, and export. Mark fallback values as illustrative; suppress unsupported live-performance conclusions. Track benchmark source separately. |
| B06 | P1 | **CAS review does not retain a reviewable original document.** The submission route keeps the filename, extracted text, and parsed rows, but no original private file reference. JSON submissions can set `method: "cas"` and provide parsable `holdingsText` with no file. Approval assigns a CAS badge from method + parse status. The admin view shows parsed JSON, not the original statement. Code confirmed; publishing still requires an admin, so this is not an automatic unauthenticated approval claim. | Require an actual statement for the CAS method. Store evidence privately with a checksum, owner/application binding, retention policy, and access audit. Require explicit reviewer evidence checks, review timestamp, and notes before granting the badge. Parsing success must remain separate from verification. |
| B07 | P1 | **Creator approval can leave partial state.** `app/api/admin/approve-creator/route.ts` updates the user role, creates profile/portfolio/holdings, then marks the application accepted through separate writes. A later failure leaves earlier writes committed; retry can create duplicates or get stuck. It can also overwrite an admin role with `creator`. | Use a transactional, idempotent approval operation with row locking, rollback, a unique approved-application reference, and preservation of admin roles. Existing PR #3 addresses this area; validate its migrations before rollout. |
| B08 | P1 | **Runtime dependencies have current advisories.** Production dependency audit reports affected packages including Next.js, sharp, Axios, and PostCSS. The installed Next.js is 16.2.12 and the audit flags critical advisories. Reachability varies by feature and hosting; for example, the AVIF advisory concerns image optimization. | Upgrade to patched compatible versions, inspect the actual image/payment paths, rebuild, and rerun the audit. Recheck PR #3's dependency updates against today's advisory data rather than relying on its earlier clean result. [Next.js advisory](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4). |
| B09 | P1 before paid launch | **Payment fulfillment lacks a durable checkout contract.** Checkout creates a provider order without storing the expected order/user/profile/amount locally. The webhook trusts signed event notes, does not compare amount/currency to an expected checkout record, and unconditionally upserts a follow on replay. A delayed duplicate event can restore a follow the user removed. Code confirmed; no payments were executed. | Persist expected checkout orders; validate provider order, amount, currency, user and profile; fulfill atomically and idempotently; distinguish payment access from notification-follow preference. Reconcile legacy orders before switching handlers. PR #3 includes work here. |
| B10 | P2 | **Trust Score changes between surfaces.** Arjun shows 58 on the directory card and 60 on detail. The local calculation reproduces this: cards pass top three holdings, detail passes all five. `components/InvestorCard.tsx:34`, `app/investor/[id]/page.tsx:53`. | Calculate once from the same complete input and share the result. Card truncation must not change score or ranking. |
| B11 | P2 | **Search and filters do not cover featured results.** On `/explore?from=roast&focus=trust`, searching “Arjun” reports “0 results” while Arjun remains visible above as Match 3. Featured entries are excluded from `shown` and never filtered by the query/style. Search also checks name/bio rather than the style field it promises, and uses an untrimmed query. | Apply search/filter to the full collection, then split visible results for display if necessary. Count all matching results. Normalize query and searchable style labels. |
| B12 | P2 | **Verification dates are invented for live records.** `app/investor/[id]/page.tsx:159` uses literal “June 2026” for every non-demo profile. “Last updated” derives from transactions/alerts, not an evidence review timestamp. | Store and display actual reviewed-at, statement-as-of, and published-at fields. Use “Not reviewed” or “Unavailable” when absent. |
| B13 | P2 | **Privacy and methodology copy contradict behavior.** Privacy says CAS parsing is not enabled, but the submission API parses documents. Methodology says personal financial details are redacted, but no redaction step is implemented before extracted text is stored. Privacy also speaks in internal requirements (“Production storage must…”, “Users should be able…”) rather than explaining current handling and an actionable support route. | Describe actual collection, storage, processors, retention, and deletion contact. Remove unsupported redaction promises or implement and test redaction. Keep roadmap requirements in internal documentation. This is a product accuracy finding, not a legal compliance determination. |
| B14 | P2 | **Result modal is inaccessible to keyboard/screen-reader users.** Live roast result has zero `dialog` roles. Escape does not close it. Source has no focus trap or restoration. Additional controls such as the alert toggle lack an accessible name; creator/waitlist inputs rely on placeholders. | Implement labelled dialog semantics, initial focus, trap, Escape, and focus restoration. Add persistent form labels, named toggles, and selected/expanded state semantics. |
| B15 | P2 | **White text on primary green buttons fails normal-text contrast.** Live primary roast button uses white on `#009D55`: calculated contrast 3.53:1. Many primary buttons use 14–16px text, below the large-text exemption. Low-opacity 11px labels deserve a separate composited-background check. | Use `#047857` with white (5.48:1), or mint `#34D399` with dark `#052E23` (7.68:1). Check hover, focus, loading and error states. WCAG AA requires 4.5:1 for normal text. [W3C guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). |
| B16 | P2 | **Roast lead capture can fail silently.** The API returns `leadStored: false` on capture errors, but `app/roast/page.tsx` does not inspect it. Repeated waitlist inserts can return a duplicate error and set false despite an existing signup. When write configuration is absent, `leadStored` remains true. Code confirmed; no test emails submitted. | Track result generation and signup capture separately. Treat already-subscribed as an acknowledged state, and show a retryable signup message when capture fails without hiding the roast. |
| B17 | P2 | **Repeat waitlist signup looks like a failure.** `/api/waitlist` returns 409 for an existing email and the form displays an error. This is the same interaction pattern that caused the creator confusion. Code confirmed. | Return/display “You're already on the list” as an acknowledged outcome, with a useful next action and no repeated submission loop. |
| B18 | P2 | **Resend cooldown runs twice.** The sign-in page has both `setTimeout` and `setInterval` decrementing the same state. The displayed minute can expire early. Code confirmed; no emails sent to reproduce it. | Keep a single deadline-based timer, and enforce provider limits server-side regardless of client UI. |

## Database verification still required

The repository migrations retain public insert policies on creator applications and parsed creator holdings (`0003_capture_and_compliance.sql`, `0004_creator_parsing_and_destinations.sql`). That can bypass route validation if deployed policies and grants permit it. The production policy state was not inspected or attacked. Check the real RLS/grants in staging and production, and restrict review fields to server/admin writes. PR #3 contains policy hardening; it is still open as of this audit.

## Conversion and click-through improvements

### 1. Give each visitor one clear next action

The site presently combines a working portfolio tool, a fictional marketplace preview, creator recruitment, and future Pro pricing. The hero's three calls to action divide attention, and the header duplicates Explore. There are no public live creator profiles yet, so “Explore investors → Follow → Get alerted” promises a journey a new visitor cannot complete today.

For the current stage, use portfolio analysis as the primary acquisition path and early access as the conversion. Keep creator recruitment as a distinct secondary path.

Suggested homepage copy:

> **Find the weak spots in your stock portfolio.**
>
> Check concentration, sector exposure, and estimated risk from your NSE holdings. Get a free portfolio roast, then preview how FVI will help you inspect investor evidence.
>
> **Primary:** Try a sample roast
>
> **Secondary:** Join early access
>
> **Small link:** Apply as a creator
>
> No login required for the roast. Educational estimates; source quality is shown with each result.

Keep the evidence-focused positioning as a supporting section:

> **Before you follow a claim, inspect the record.**
>
> Preview holdings, drawdowns, published changes, and verification labels. These examples are fictional; the first real creator cohort is being reviewed.

An alternative hero to test for creator-focused campaigns:

> **Let your portfolio evidence do the talking.**
>
> Apply to the founding creator cohort. Submit a statement for review and choose what to publish.
>
> **Primary:** Apply for creator review

Do not route all audiences through the same three equally weighted choices.

### 2. Put the working tool near the top on mobile

At 390×844, the roast form began at approximately y=1,420 and the primary submit button at y=3,418. Five stacked stats/steps/input rows put substantial scrolling between interest and the result.

Move the form directly under a short headline. Collapse the four-step explanation into “How it works”; keep stats inline rather than stacked. Start with one blank row plus explicit “Try sample portfolio” and “Add holding” actions. Do not let demo prefilled holdings look like the visitor's own data. Put CSV import/paste into the public roast flow if supported, rather than only the account dashboard. Make email optional and ask for it after the user sees value.

Remove the forced 4.2-second minimum roast delay. Keep brief playful loading text while real work is happening, with an understandable timeout/retry state.

### 3. Make the roast-to-signup handoff relevant

The result currently promotes fictional “Trust Score matches” that are not personalized to the user's holdings. Make the next step honest and specific:

> **Want evidence-backed creator updates when they launch?**
>
> Join early access. We'll email you when reviewed creator profiles are available.
>
> **CTA:** Notify me at launch

Offer “Inspect an example record” as a quieter link. Do not imply that the fictional ranking is a personalized recommendation. Track signup after a completed roast separately from homepage signup.

### 4. Tighten the homepage

Recommended order: short hero → usable sample roast → what the result explains → one clearly labelled evidence-preview record → how review works → early-access form → concise FAQ → creator application link.

Move speculative pricing/features out of the main persuasion flow until available. Claims such as “Full holdings history (3+ yrs)”, “Monthly performance report”, “Every entry and exit”, and “Know who you can actually trust. In under 30 seconds” need evidence or more careful copy. Prefer “See what evidence is available, what it covers, and when it was reviewed.”

Remove internal product language such as “Acquisition loop” and “The roast gets attention”. It explains the business funnel instead of the visitor's benefit. Keep humor in the roast; use calm, specific language for privacy, review, payments, and failures. Replace “Server meltdown” with “We couldn't open this page. Return home or try again.”

### 5. Clarify creator onboarding and status recovery

Put required name/email/evidence before the optional six-field social/profile section, and progressively disclose optional details. Add visible file limits and supported types before upload, inline file validation, labelled inputs, and a multiline textarea that is not forced to the `.input-field` 44px height.

The recently deployed existing-application screen is an improvement. Complete it with an authenticated application-status page, review date/notes where appropriate, and a secure requested-proof/update flow. Accepted creators should have a direct link to `/creator/dashboard`. A duplicate submitted for another email currently sends users to the general dashboard, which does not show that application's status.

## Color, typography, and layout

Keep the dark theme for the research product, but increase separation between canvas, cards, and interactive controls. Reduce the large blurred red/green glows behind forms; reserve red for losses/errors and mint for actions/positive values. Give demo labels a consistent neutral/amber treatment separate from verification badges.

| Token | Suggested value | Usage |
|---|---|---|
| Canvas | `#0B1210` | Page background |
| Surface | `#14201B` | Cards and input panels |
| Primary text | `#E8F0EB` | Headings and body |
| Secondary text | `#AAB8AF` | Supporting text |
| Accent | `#34D399` | Links, focus, selected states |
| Filled CTA | `#047857` + white | Normal-sized button text, 5.48:1 contrast |
| Alternative CTA | `#34D399` + `#052E23` | Mint button, 7.68:1 contrast |

Use 16px body text and 13–14px supporting/field labels. Keep monospaced uppercase text for short metadata. Use persistent labels rather than placeholder-only forms. Make primary mobile actions comfortably tappable; validate minimum target size and spacing rather than shrinking everything into pills. [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

Use one display/body font system. The roast references `--font-space-grotesk`, which is not defined in the checked layout/styles. Self-host/bundle the chosen fonts and avoid the external Google Fonts CSS `@import` blocking the first styled render. Retain tabular numerals for metrics.

A light/off-white theme could be tested for the creator upload flow if it improves perceived clarity; there is no evidence from this audit that a theme switch itself will improve conversion.

## Measurement, performance, and discoverability

- No CTA event instrumentation was found in the app source. External Vercel analytics configuration was not inspected. Add minimal events for hero CTA, sample start, roast start/success/error, result-to-preview click, waitlist success/already-subscribed, creator start, evidence validation failure, application submitted, and existing-application view. Do not put email addresses or holdings in analytics events.
- Compare CTA click-through, roast completion, waitlist conversion after roast, creator completion, and error rates. Judge the whole journey, not clicks alone. Test one meaningful change at a time; do not declare winners from a small early cohort.
- Measure real-user LCP, INP, and CLS at the 75th percentile on mobile and desktop. Target LCP ≤2.5s, INP ≤200ms, CLS ≤0.1. The HTTP audit observed homepage/directory/detail responses of several seconds, but these are single-run network timings, not Core Web Vitals or a representative latency distribution. Investigate repeated Supabase reads and safe public-data caching before claiming a performance cause. [Web Vitals guidance](https://web.dev/articles/vitals).
- Add page-specific titles/descriptions for waitlist and sign-in. No canonical link appeared in the checked public HTML. Set canonical URLs appropriately, especially for query-driven explore routes; use noindex for auth/account/admin pages and decide whether fictional profile pages should be indexed.
- The sitemap maps only `demo-data` profiles, so future live creator pages are omitted. Generate it from published records and use actual update timestamps rather than build time for every entry.
- The social image is an SVG. Use a raster OG image and validate actual WhatsApp, LinkedIn, and X previews; compatibility was not tested here. For the roast's viral loop, ensure source/estimate labels and a clean branded URL survive in exported cards.
- Footer currently emphasizes GitHub/LinkedIn; add readily available methodology, privacy, terms, and support links throughout the site, especially beside uploads/signup. Add a skip link and resolve nested `main` landmarks on the roast page.

## Recommended implementation order

1. **Correctness and trust:** safe sign-in redirects, dashboard queries, dependency patches, durable approval/payment workflows, CAS evidence handling, actual review dates, and database-policy verification. Reuse and revalidate relevant work in [existing PR #3](https://github.com/gau-rav0/stock-copy-autopilot/pull/3); it is not deployed merely because it exists.
2. **Working-tool quality:** aggregate duplicate lots, accurately label metric proxies/data sources, carry warnings to exports, fix trust-score consistency, search, waitlist acknowledgements, lead-capture feedback, contrast, and modal accessibility.
3. **Conversion experiments:** shorter mobile page, sample-first CTA, post-result waitlist capture, clearer launch-state copy, simplified homepage, and event measurement. Then evaluate theme and typography refinements using completion and signup outcomes.

This audit produced findings and recommendations only. No new application changes were merged or deployed during it.
