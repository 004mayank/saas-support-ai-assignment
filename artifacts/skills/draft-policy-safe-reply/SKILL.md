---
name: draft-policy-safe-reply
description: Draft customer-support replies in the Acme Cloud tone while grounding every refund, credit, discount, price, billing, and contractual claim in the supplied current policy. Use for composing or revising outbound email/chat replies where unsupported commercial promises must be prevented.
---

# Draft a policy-safe reply

1. Read `references/tone-guide.md` and the policy snapshot supplied by the user. Use `references/sample-policy.md` only for the bundled demonstration; do not treat it as live company policy.
2. Extract a private evidence ledger of allowed monetary and policy claims. Treat absent or ambiguous policy as unknown.
3. Draft the reply using the requested channel and the tone guide. Acknowledge the customer's actual concern, answer directly, and name one concrete next step.
4. Never invent, estimate, calculate, or imply a refund, price, discount, credit, eligibility window, SLA, or legal commitment. If the policy does not support a requested claim, omit the figure and request a policy check or human approval.
5. Run `scripts/validate_reply.py` with the policy and draft when files are available. Correct every error before returning the result.

## Output contract

Return exactly:

```markdown
## Customer reply
<send-ready reply>

## Grounding check
- Policy snapshot: <title/version/date or "not supplied">
- Monetary claims: <each claim and its supporting clause, or "none">
- Human review: <"not required" or a precise unresolved question>
```

Do not expose private reasoning or the evidence ledger. Keep email replies under 180 words unless the user asks otherwise.
