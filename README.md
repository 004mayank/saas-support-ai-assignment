# Support Lab — SaaS Support AI Assignment

A single-user web application that demonstrates an evidence-led **Skill / Agent / Neither** architecture for five SaaS support capabilities. The app contains four independent workspaces, realistic mock fixtures, provider-agnostic LLM configuration, standalone evidence, and a downloadable submission PDF.

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
- `output/demo/Support-Lab-Demo.mp4` — narrated 6:49 standalone demo

All organizations, policies, prices, customers, tickets, and logs are fictional mock data.
