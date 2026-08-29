---
name: grade-support-quality
description: Grade one or more closed SaaS support tickets against a weighted QA rubric, cite transcript evidence, and summarize recurring failure patterns across a sample. Use for standalone ticket quality reviews, calibration, coaching notes, and weekly sample analysis.
---

# Grade support quality

1. Read the supplied rubric. Use `references/sample-rubric.md` only for the bundled demonstration.
2. Separate observable transcript evidence from inference. Do not award points for actions that are not shown.
3. Score every rubric dimension independently, then apply any explicit caps or automatic failures.
4. Cite one short transcript excerpt or event for each deduction. Never fabricate timestamps, actions, or customer outcomes.
5. For multiple tickets, compute the sample average and list a pattern only when it appears in at least two tickets or at least 20% of the sample, whichever is lower.
6. Run `scripts/validate_scorecard.py` when the result is saved as JSON. Correct schema or arithmetic errors before returning it.

## Output contract

Return a compact scorecard with ticket ID, dimension scores, total, rating, evidence-backed deductions, coaching action, and confidence. For a multi-ticket sample, append sample size, average score, and recurring patterns. State `insufficient evidence` instead of guessing.
