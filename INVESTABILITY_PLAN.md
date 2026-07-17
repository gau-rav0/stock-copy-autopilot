# FVI Investability Plan

## The financing objective

FVI should not raise on the claim that it is already a marketplace. It should raise after proving one narrow loop:

> A real creator submits evidence, FVI publishes a reviewed record, a user follows it, a genuine allocation change creates a read-only alert, and that alert brings the user back.

The pre-seed story is not “we built many finance features.” It is:

> Financial creators can publish wins without publishing a complete record. FVI is building the evidence and change-history layer between creators and retail investors.

## Non-negotiable credibility rules

1. Never count demo profiles, seeded followers, test accounts, or internal submissions as traction.
2. Never display a CAS/broker verification label unless a real record completed the stated review.
3. Never claim that a submitted document is impossible to forge. State what was reviewed and the limits of the review.
4. Never call a snapshot a historical track record. Historical claims require dated evidence across the claimed period.
5. Never publish an aggregate metric without a reproducible database query and a named owner.
6. Never describe broker sync as available until it is live, contractually permitted, and tested.
7. Never accept payment for a profile or alert product before securities counsel approves the exact flow.
8. Keep demo records visibly fictional at the card, profile, action, API, payment, and database layers.

## Fundraising readiness gate

Start a structured pre-seed process only when all minimum gates are true:

| Evidence | Minimum gate | Strong gate |
|---|---:|---:|
| Live reviewed creators | 10 | 25 |
| Creators refreshed on schedule | 80% | 95% |
| Weekly active users | 500 | 2,000 |
| Users who inspect 2+ records in week one | 30% | 45% |
| Profile-to-follow conversion | 15% | 25% |
| Four-week retained followers | 25% | 40% |
| Alert open rate | 35% | 50% |
| Alert-to-return-session rate | 15% | 30% |
| Completed portfolio roasts per week | 250 | 1,000 |
| Roast-to-email/founding-access conversion | 8% | 15% |
| Users completing a paid-intent interview | 30 | 100 |
| Users accepting a real price in a compliant pilot | 20 | 75 |
| Written legal product review | Complete | Complete plus operating controls |

Do not replace retention with waitlist size. A waitlist is demand evidence; repeated use is product evidence.

## Metric definitions

Use fixed definitions so deck numbers cannot drift.

- **Live reviewed creator:** a non-demo primary portfolio whose evidence was reviewed, whose owner consented to publication, and whose review date has not expired.
- **Verified creator:** a live reviewed creator whose displayed tier matches the reviewed evidence. Manual entry alone is never verified.
- **Activated follower:** a registered user who follows at least one live creator and views either a second profile or an alert within seven days.
- **Weekly active user:** a non-internal user with a meaningful action during the week: completed roast, profile inspection, follow, alert open, or dashboard return. Page views alone do not qualify.
- **Four-week retention:** the percentage of an activation cohort with a meaningful action in days 22–28.
- **Profile-to-follow conversion:** unique live-profile viewers who follow that creator within seven days divided by unique live-profile viewers.
- **Creator freshness:** live creators whose evidence was refreshed within the published review interval divided by all live creators.
- **Verification turnaround:** median time from complete evidence submission to an approved or rejected decision.
- **Alert delivery rate:** provider-confirmed sent alerts divided by eligible alert recipients.
- **Alert return rate:** recipients who open FVI within 72 hours of an alert divided by delivered recipients.
- **Roast conversion:** users who provide consented contact information after a completed roast divided by completed roasts.
- **Paid intent:** a user chooses a specific price/plan in a research flow. It is not revenue.

Exclude the founder, employees, contractors, demo rows, automated tests, duplicate emails, and seeded database records from investor metrics.

## Eight-week execution plan

### Week 1 — Establish truth and operating controls

Product:

- Deploy the demo/live separation migration.
- Confirm every seeded portfolio has `is_demo = true`, `verified = false`, zero followers, and zero subscription fee.
- Confirm direct follow, checkout, and webhook requests reject demo profiles.
- Confirm the homepage publishes no fallback traction.
- Create one admin user and verify `/admin/metrics` and `/admin/creators` are private.
- Run one creator application through CAS upload, parsing, manual review, approval, public profile, follow, alert, delivery, and dashboard return.

Operations:

- Write a one-page evidence-review checklist.
- Write a creator consent form covering what is stored, published, refreshed, corrected, and deleted.
- Create a test-account exclusion list for metrics.
- Create a weekly metric snapshot with query date, value, definition, and owner.

Exit criterion: one end-to-end test passes with no demo data and every displayed label matches database state.

### Week 2 — Recruit the founding creator cohort

Target creators with 5,000–100,000 followers: large enough to bring users, small enough to answer personally.

Daily founder activity:

- Research 15 relevant Indian finance creators.
- Send 10 personalized messages.
- Ask for 3 calls.
- Conduct at least 2 calls.
- Record objections word-for-word.

Creator offer:

- Free founding verification.
- Private preview before publication.
- Control over which supported fields become public.
- A transparent review label, not an endorsement.
- A founder report showing profile inspections and follows.
- No trading access and no payment product during the pilot.

Interview questions:

1. How do followers challenge your performance claims today?
2. What evidence would you publish, and what would you never publish?
3. What is the reputational downside of showing exits and drawdowns?
4. How frequently could you refresh evidence?
5. Would verification help distribution, credibility, or monetization?
6. Who else must approve participation?
7. What would make you withdraw from the product?

Exit criterion: 20 conversations, 10 complete applications, and 3 creators willing to publish.

### Week 3 — Publish the smallest real marketplace

- Publish 3–5 real creators, not 30 incomplete profiles.
- Put live creators before demo examples.
- Show the evidence source, review date, history coverage, and limitations.
- Hide metrics that lack real evidence rather than filling them with zero or samples.
- Give each creator a shareable profile link with campaign attribution.
- Personally onboard the first 100 users from creator audiences.
- Watch at least 10 users inspect a profile without explaining the interface.

Exit criterion: 100 real users, 30 activated followers, and no user confusing a demo record for a live creator.

### Week 4 — Prove alerts create retention

- Have participating creators publish at least one genuine, consented update.
- Deliver the read-only alert.
- Measure delivery, open, return session, unfollow, and notification opt-out.
- Interview users who returned and users who ignored the alert.
- Remove alert copy that sounds like a recommendation.
- Create a creator refresh reminder and an expired-evidence state.

Exit criterion: at least 50 eligible recipients, 90% delivery, 35% opens, and 15% return sessions.

### Week 5 — Test willingness to pay without prematurely charging

Run three pricing interviews; do not ask “Would you pay?” Ask users to choose.

Test packages:

- Free: public evidence summary and limited roast.
- Research: full history, comparisons, and alert archive.
- Creator: verification operations and audience analytics.

Test price points separately, for example ₹199, ₹399, and ₹799 per month for users. Do not show all users all prices. Record choice, hesitation, rejected alternative, and purchase timing.

For creators, test annual or service pricing rather than assuming the user subscription is the only model. Also interview platforms that may pay for a verification API or evidence badge.

Exit criterion: 30 completed price-choice interviews and a clear segment with repeated willingness to transact, subject to legal approval.

### Week 6 — Find one repeatable distribution loop

Choose one primary loop:

1. Creator shares verified profile → followers inspect → users follow → creator sees evidence of demand.
2. User completes portfolio roast → receives shareable result → friends try roast → high-intent users inspect creators.
3. Evidence report or benchmark page earns search traffic → user inspects profile → joins founding access.

Measure each step. Do not call impressions distribution.

Exit criterion: one channel produces at least 100 activated users with a documented acquisition cost or founder-time cost.

### Week 7 — Complete legal, security, and data-room readiness

Obtain Indian securities counsel review of:

- Creator verification and profile publication.
- Rankings, scores, comparisons, and performance presentation.
- Read-only allocation-change alerts.
- Creator compensation and user subscriptions.
- Research Analyst and Investment Adviser implications.
- Advertising, testimonials, and performance claims.
- CAS handling, redaction, retention, and deletion.
- Broker API terms and whether each proposed integration is permitted.

Security and privacy:

- Document CAS retention and deletion.
- Encrypt stored artifacts or avoid storing them when possible.
- Restrict evidence access by role and log every review.
- Test RLS and service-role boundaries.
- Create incident, correction, and takedown procedures.
- Perform dependency and secret scanning.

Exit criterion: written counsel memo, product control list, privacy process, and no critical security finding.

### Week 8 — Prepare and run the raise

Build the raise around demonstrated progress:

- Problem insight.
- Narrow product loop.
- Creator supply evidence.
- User retention evidence.
- Distribution loop.
- Compliance posture.
- Why the resulting data network becomes harder to copy.

Create a focused investor list of fintech, consumer marketplace, creator-economy, and India specialists. Seek warm introductions first. Run meetings in a compressed three-week window so feedback and momentum compound.

Do not raise merely because week eight arrived. If the minimum gate is not met, continue operating and send monthly progress updates instead.

## Pitch deck structure

1. **Title:** FVI — the evidence layer for investor track records.
2. **Problem:** screenshots and public posts omit dates, exits, drawdowns, and complete history.
3. **Why now:** creator-led finance is large, users are skeptical, and evidence workflows are becoming technically possible.
4. **Product:** show the real verify → publish → follow → alert loop in four screens.
5. **Trust model:** evidence tiers, review limits, refresh policy, correction process.
6. **Traction:** only query-backed live metrics with dates and cohort definitions.
7. **User behavior:** activation, four-week retention, alert open, alert return.
8. **Creator behavior:** applications, publication conversion, refresh rate, distribution contribution.
9. **Business model:** present research results and the first compliant transaction evidence.
10. **Market:** bottom-up users × plausible annual revenue; avoid a vague global wealth-management TAM.
11. **Moat:** longitudinal reviewed histories, creator network, workflow data, compliance operations, and distribution.
12. **Team and raise:** founder advantage, amount, 18-month milestones, and use of funds.

The demo should take under three minutes and use a real consented creator record.

## Data room checklist

Company:

- Incorporation documents and cap table.
- Founder and contractor IP assignments.
- Current budget, bank balance, and monthly burn.
- Proposed option pool and hiring plan.

Product and traction:

- Metric dictionary from this document.
- Read-only KPI export with query dates.
- Weekly cohort retention table.
- Creator funnel and user funnel.
- Product roadmap and incident log.
- Architecture and data-flow diagram.

Legal and compliance:

- Counsel memo.
- Terms, privacy policy, creator consent, and evidence-review policy.
- Broker terms analysis.
- Data retention/deletion policy.
- Security review and remediation list.

Commercial:

- Creator interview notes.
- User interview notes.
- Pricing experiment results.
- Signed pilot or design-partner letters.
- Channel experiments with conversion and cost.

## Investor update format

Send a concise monthly update before fundraising:

1. One-sentence product milestone.
2. Five query-backed metrics with prior-month comparison.
3. What users or creators did, not what they said.
4. Biggest failure and what changed.
5. Next month’s measurable goals.
6. Two specific asks: introductions, legal expertise, creator leads, or hiring.

## Use of funds framework

Raise enough for roughly 18 months to reach a seed-quality milestone, not to fund broad feature development.

Suggested allocation:

- 35% engineering and data reliability.
- 25% creator operations and verification.
- 15% compliance, privacy, and security.
- 15% distribution experiments.
- 10% contingency and company operations.

The seed milestone should be a repeatable network with retained users and fresh creator evidence, not a longer feature list.

## Weekly founder scorecard

Every Friday record:

- Creator prospects contacted.
- Creator calls completed.
- Complete applications.
- Profiles approved/rejected.
- Live reviewed creators.
- Median verification turnaround.
- Evidence refresh rate.
- Completed roasts.
- New registered users.
- Activated followers.
- Weekly active users.
- Profile-to-follow conversion.
- Alert delivery/open/return.
- Week-one and week-four retention.
- Pricing interviews.
- Cash balance and runway.

For every metric include the exact date range, source query, exclusions, and owner.

## Immediate deployment checklist

1. Review and apply `20260717090000_separate_demo_from_live_traction.sql` to production Supabase.
2. Deploy the application after the migration is ready.
3. Confirm demo cards say “Demo … example,” show zero real followers, and route to founding access.
4. Attempt a direct demo follow and demo checkout; confirm both are rejected.
5. Sign in as an admin and open `/admin/metrics`.
6. Remove internal/test accounts from any exported investor metrics.
7. Run one real creator through the full workflow before recruiting broadly.
8. Do not announce “verified creators” publicly until at least one real non-demo record is reviewed and live.

This plan is an operating framework, not legal advice. Product launch and monetization decisions involving securities activity should follow written advice from qualified Indian counsel.
