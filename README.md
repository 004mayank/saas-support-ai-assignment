# Support Lab — SaaS Support AI Assignment

A single-user web application that demonstrates an evidence-led **Skill / Agent / Neither** architecture for five SaaS support capabilities. The app contains four independent workspaces, realistic mock fixtures, provider-agnostic LLM configuration, standalone evidence, and a downloadable submission PDF.

**Live application:** https://support-lab-saas-ai.vercel.app

## Architecture

| Capability | Decision | Built artifact |
|---|---|---|
| Ticket triage and immediate escalation | Neither | Decision record only; deterministic inbox/on-call rules are recommended |
| Policy-safe outbound replies | Skill | `artifacts/skills/draft-policy-safe-reply` |
| At-risk retention brief | Agent | `artifacts/agents/retention-brief-agent` |
| Closed-ticket QA grading | Skill | `artifacts/skills/grade-support-quality` |
| Known-issue check and bug handoff | Agent | `artifacts/agents/bug-investigator-agent` |

The count is an outcome of the decision rule, not a target. No coordinator, queue listener, scheduler, ticket mutation, or end-to-end workflow is included.

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by the development server. The application starts in deterministic demo mode and does not require an API key.

The production app uses native Next.js server routes on Vercel, so demo runs and optional live-provider requests use the same server-side execution boundary.

## Bring your own LLM

Open **LLM settings** and choose OpenAI, Anthropic, Google Gemini, OpenRouter, Ollama, or a custom OpenAI-compatible endpoint. The API key is retained in browser session storage only and is sent to the selected provider only when the user explicitly runs a workspace.

## Test

```bash
npm test
python3 artifacts/skills/draft-policy-safe-reply/scripts/validate_reply.py \
  --policy artifacts/skills/draft-policy-safe-reply/references/sample-policy.md \
  --reply artifacts/skills/draft-policy-safe-reply/tests/output.md
python3 artifacts/skills/grade-support-quality/scripts/validate_scorecard.py \
  --scorecard artifacts/skills/grade-support-quality/tests/output.json
```

## Submission artifacts

- `artifacts/MAPPING.md` — classification and justifications
- `artifacts/skills/` — standalone Skill packages
- `artifacts/agents/` — standalone Agent specifications and fixtures
- `artifacts/AI_USAGE.md` — AI-assisted and manually modified work
- `output/pdf/SaaS-Support-AI-Submission.pdf` — final report after generation
- `output/demo/Support-Lab-Demo.mp4` — narrated 6:58 standalone demo, captured from Chrome at 1080p

All organizations, policies, prices, customers, tickets, and logs are fictional mock data.

## Personal integration build

The `integration-layer` branch deliberately goes beyond the assignment boundary. Its `/` route is an operations control plane that wires the standalone artifacts into five runnable paths:

- deterministic live-outage escalation before any model call;
- inbox polling and policy-safe reply drafting;
- billing, usage, and ticket-history aggregation for retention;
- changelog investigation and engineering handoff;
- a weekly Vercel Cron QA run at 09:00 UTC each Monday.

All connectors implement realistic read/write contracts against mock records. **Dry run** previews mutations; **Sandbox writes** records simulated success in the run ledger. Neither mode contacts a real inbox, customer, on-call responder, CRM, or engineering tracker.

The original submission application remains unchanged in purpose and is available at `/standalone` on this branch. The production submission URL continues to deploy from `main`.

### Integration API

```bash
# Poll the mock inbox
curl -X POST http://localhost:3000/api/integration \
  -H 'content-type: application/json' \
  -d '{"action":"poll"}'

# Run deterministic emergency escalation
curl -X POST http://localhost:3000/api/integration \
  -H 'content-type: application/json' \
  -d '{"action":"run","scenario":"urgent_outage","dryRun":true}'
```

Set `CRON_SECRET` in the deployment to require Vercel’s bearer token on `/api/cron/weekly-qa`. Model keys remain browser-session-only; scheduled QA intentionally uses verified demo output so no persistent provider credential is required.
