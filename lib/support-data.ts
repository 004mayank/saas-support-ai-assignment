export type WorkspaceId = "reply" | "qa" | "retention" | "bug";

export type LlmProvider =
  | "openai"
  | "anthropic"
  | "google"
  | "openrouter"
  | "ollama"
  | "custom";

export type LlmConfig = {
  mode: "demo" | "live";
  provider: LlmProvider;
  baseUrl: string;
  model: string;
  apiKey: string;
  temperature: number;
};

export const providerPresets: Record<
  LlmProvider,
  { label: string; baseUrl: string; model: string; keyHint: string }
> = {
  openai: {
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4.1-mini",
    keyHint: "sk-...",
  },
  anthropic: {
    label: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    model: "claude-sonnet-4-5",
    keyHint: "sk-ant-...",
  },
  google: {
    label: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    model: "gemini-2.5-flash",
    keyHint: "AIza...",
  },
  openrouter: {
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openai/gpt-4.1-mini",
    keyHint: "sk-or-...",
  },
  ollama: {
    label: "Ollama",
    baseUrl: "http://localhost:11434/v1",
    model: "llama3.2",
    keyHint: "Not required",
  },
  custom: {
    label: "Custom compatible API",
    baseUrl: "https://your-endpoint.example/v1",
    model: "your-model",
    keyHint: "Provider key",
  },
};

export const defaultConfig: LlmConfig = {
  mode: "demo",
  provider: "openai",
  ...providerPresets.openai,
  apiKey: "",
  temperature: 0.2,
};

export const workspaceCopy: Record<
  WorkspaceId,
  {
    eyebrow: string;
    title: string;
    description: string;
    badge: string;
    icon: string;
    scope: string;
    inputLabel: string;
    contextLabel: string;
    input: string;
    context: string;
  }
> = {
  reply: {
    eyebrow: "Standalone skill 01",
    title: "Policy-safe reply",
    description:
      "Draft a send-ready answer in the support voice without inventing commercial terms.",
    badge: "Skill",
    icon: "↗",
    scope: "Reads ticket + supplied policy · writes draft only",
    inputLabel: "Customer ticket",
    contextLabel: "Current policy snapshot",
    input: `Ticket SUP-1048
Customer: Mia Chen
Channel: Email

Mia says her Growth plan renewed yesterday for USD 149. Her team stopped using Acme Cloud two months ago, and she wants the renewal refunded. Billing confirms the charge is neither duplicated nor caused by a billing error.`,
    context: `Acme Cloud commercial policy
Version: 2026.08.18 · Effective: 18 August 2026

REFUNDS
- A first monthly purchase may be refunded in full when cancellation is requested within 14 calendar days.
- Subscription renewals are non-refundable except for a verified duplicate charge or Acme Cloud billing error.
- Never promise a settlement date.

VOICE
Warm, calm, direct. Lead with the answer or owned next step. Avoid “as per policy” and “unfortunately.”`,
  },
  qa: {
    eyebrow: "Standalone skill 02",
    title: "Support QA grader",
    description:
      "Apply a weighted rubric, explain every deduction, and surface coaching patterns.",
    badge: "Skill",
    icon: "✓",
    scope: "Reads closed ticket + rubric · writes scorecard only",
    inputLabel: "Closed ticket transcript",
    contextLabel: "Quality rubric",
    input: `Ticket SUP-1082

Customer: Our import has failed three times with error E-17. Can you help?

Agent: Sorry about that! Clear your browser cache. If it fails again, engineering will fix it by tomorrow. We can also refund $200.

Customer: Cache did not help. What should I send you?

Agent: I have passed this to another team.`,
    context: `Resolution 30 · Accuracy and policy 25 · Communication 20 · Ownership 15 · Process and records 10

Cap total at 49 for an invented refund, credit, price, or binding timeline.
Ratings: 90–100 Excellent; 75–89 Meets standard; 60–74 Coaching needed; below 60 Fails standard.`,
  },
  retention: {
    eyebrow: "Standalone agent 01",
    title: "Retention brief agent",
    description:
      "Reconcile billing, product usage, and support signals into a call-ready one-pager.",
    badge: "Agent",
    icon: "◎",
    scope: "Reads supplied records · no writes, memory, or customer contact",
    inputLabel: "Account records (JSON)",
    contextLabel: "Optional call context",
    input: `{
  "account": {"id":"AC-204","name":"Northstar Labs","plan":"Growth","arr_usd":17880,"renewal_date":"2026-09-30","risk_flag":"Sponsor departed"},
  "billing": [
    {"id":"INV-883","date":"2026-08-01","status":"paid","days_late":12},
    {"id":"INV-841","date":"2026-07-01","status":"paid","days_late":0}
  ],
  "usage": [
    {"date":"2026-06-30","weekly_active_users":42,"automation_runs":1280},
    {"date":"2026-08-24","weekly_active_users":17,"automation_runs":410}
  ],
  "tickets": [
    {"id":"SUP-991","date":"2026-08-12","topic":"SSO lockouts","status":"closed","reopens":2,"csat":2},
    {"id":"SUP-944","date":"2026-07-22","topic":"Report export timeout","status":"closed","reopens":0,"csat":4}
  ]
}`,
    context:
      "The CSM has a 25-minute retention call. No discount or refund has been approved.",
  },
  bug: {
    eyebrow: "Standalone agent 02",
    title: "Bug investigator agent",
    description:
      "Compare a report with the provided changelog, then prepare the right handoff branch.",
    badge: "Agent",
    icon: "⌁",
    scope: "Reads report + changelog · cannot create or modify engineering tickets",
    inputLabel: "Bug report + changelog (JSON)",
    contextLabel: "Investigation notes",
    input: `{
  "report": {
    "id":"SUP-1117",
    "summary":"CSV export from Analytics stalls at 92% for date ranges over 90 days",
    "environment":{"plan":"Growth","browser":"Chrome 127","workspace_region":"EU","app_version":"web-2026.08.27"},
    "steps":["Open Analytics","Choose a 120-day range","Select Export CSV"],
    "expected":"CSV download starts",
    "actual":"Progress remains at 92% for at least 15 minutes; no file downloads",
    "frequency":"3 of 3 attempts",
    "attachments":["network-har-redacted.zip"]
  },
  "changelog": [
    {"id":"KI-224","title":"PDF exports can stall at 90% in Safari","status":"monitoring","affected":"Safari 17, PDF only"},
    {"id":"FIX-812","title":"Resolved CSV export timeout for ranges over one year","status":"fixed","fixed_in":"web-2026.07.14"}
  ]
}`,
    context:
      "Match only when at least two discriminating signals align and no material contradiction exists.",
  },
};

export const demoOutputs: Record<WorkspaceId | "connection_test", string> = {
  connection_test:
    "Connection ready. Demo mode is active, so no external provider was called.",
  reply: `## Customer reply

Hi Mia,

I checked the renewal details. Subscription renewals are not refundable unless the charge is duplicated or caused by an Acme Cloud billing error, and neither applies here.

I can still help you stop the next renewal and review whether a lower plan better fits your current usage. Reply with the option you prefer, and I’ll take the next step.

Best,
Acme Cloud Support

## Grounding check
- Policy snapshot: Acme Cloud commercial policy v2026.08.18
- Monetary claims: none
- Human review: not required`,
  qa: `# QA scorecard · SUP-1082

**41 / 100 · Fails standard**

| Dimension | Score | Evidence |
|---|---:|---|
| Resolution | 12 / 30 | Cache advice failed; no diagnostic next step followed. |
| Accuracy & policy | 5 / 25 | Invented a next-day fix and a $200 refund. |
| Communication | 15 / 20 | Polite and brief, but vague after the failed step. |
| Ownership | 5 / 15 | “Passed this to another team” gives no owner or follow-up. |
| Process & records | 4 / 10 | No job ID, logs, browser, or import-file details collected. |

**Commercial-claim cap applied:** yes (maximum 49).

### Coaching action
Collect the import job ID and logs, avoid unsupported promises, and retain ownership through escalation.

**Confidence:** high`,
  retention: `# Northstar Labs · retention brief

## Account snapshot
- Growth plan · USD 17,880 ARR · renews 30 September 2026.
- Risk flag followed the departure of the customer sponsor.

## Why the account is at risk
- Weekly active users fell from 42 to 17 between 30 June and 24 August.
- Automation runs fell from 1,280 to 410 over the same period.
- The latest invoice was paid 12 days late (INV-883, 1 August).
- A recent SSO issue reopened twice and received 2/5 CSAT (SUP-991, 12 August).

## Retention hypotheses
- Sponsor loss may have reduced internal ownership; confirm on the call.
- Repeated SSO lockouts may be suppressing adoption.
- Late payment may indicate process friction or lower commitment.

## Call plan
1. Confirm the new executive and operational owners.
2. Ask which teams stopped using automations and why.
3. Agree on an SSO recovery owner and adoption checkpoint before renewal.

## Open questions
- Was the decline driven by access friction, seasonality, or lower need?
- Who now owns the renewal decision?

**Confidence:** medium-high; all three sources are present, but motivations remain hypotheses.`,
  bug: `## Classification
**New or unmatched issue.** Neither changelog entry aligns on both export type and triggering range.

## Engineering title
Analytics CSV export stalls at 92% for ranges over 90 days in EU workspace

## Impact
- Customer cannot export a 120-day Analytics range after three attempts.
- Scope beyond this Growth-plan EU workspace is unknown.

## Environment
Web app web-2026.08.27 · Chrome 127 · EU workspace · Growth plan

## Reproduction steps
1. Open Analytics.
2. Choose a 120-day date range.
3. Select **Export CSV**.

## Expected vs actual
- **Expected:** CSV download starts.
- **Actual:** progress remains at 92% for at least 15 minutes; no file downloads.

## Evidence
- Frequency: 3 of 3 attempts.
- Attachment supplied: network-har-redacted.zip.
- KI-224 conflicts on browser and format; FIX-812 concerns ranges over one year and is fixed.

## Missing diagnostics
Workspace ID, export job ID, exact timestamps, dataset size, and console errors.

## Duplicate-search terms
analytics csv export 92% EU · csv export 120 day timeout`,
};

export const systemPrompts: Record<WorkspaceId | "connection_test", string> = {
  connection_test:
    "Reply with exactly: Connection ready. Do not add anything else.",
  reply: `You are a policy-safe SaaS support reply specialist. Use only the supplied current policy for refunds, credits, pricing, timing, and eligibility. Never infer an unsupported commercial figure or promise. Write in a warm, calm, direct voice. Return exactly two Markdown sections: ## Customer reply and ## Grounding check. In the grounding check list the policy snapshot, every monetary claim with its clause, and whether human review is required. Keep the customer reply under 180 words.`,
  qa: `You are a support QA grader. Apply only the supplied weighted rubric. Cite transcript evidence for each deduction. Never award points for actions not shown. Enforce all caps. Return Markdown with ticket ID, dimension score table, total, rating, deductions, one coaching action, and confidence.`,
  retention: `You are a read-only SaaS Retention Brief Agent. Reconcile only the supplied billing, usage, and ticket records. Never invent missing facts or recommend unapproved commercial terms. Distinguish observations from hypotheses and cite record IDs or dates for risk statements. Return a one-page Markdown brief with Account snapshot; Why the account is at risk; Evidence; Retention hypotheses; Call plan; Open questions; Confidence.`,
  bug: `You are a read-only Bug Investigator Agent. Search only the supplied changelog. A known-issue match requires at least two discriminating aligned signals and no material contradiction; keywords alone are insufficient. Never claim unsupplied reproduction. For known issues return classification, match evidence, customer guidance, and missing diagnostics. For new or uncertain issues return classification, engineering title, impact, environment, repro steps, expected vs actual, evidence, missing diagnostics, and duplicate-search terms.`,
};
