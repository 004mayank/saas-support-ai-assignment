# Skill, Agent, or Neither

| Capability | Decision | Justification |
|---|---|---|
| Read, categorize, route, and immediately escalate tickets | Neither | Immediate outage/legal/security escalation is a deterministic safety control that belongs in inbox/ticketing rules and on-call alerts. An LLM may assist classification later, but it must not sit on the critical escalation path. |
| Draft outbound replies in voice and current policy | Skill | This is a repeatable, stateless procedure with stable tone and grounding guardrails. The caller supplies the current policy snapshot, so the Skill can be invoked independently without owning a workflow. |
| Build an at-risk customer briefing from three systems | Agent | It requires bounded multi-source synthesis, conflict handling, gap detection, and a call plan. Those are agentic decisions, even though this submission uses pasted mock records instead of live connectors. |
| Grade a rolling sample against a QA rubric | Skill | Grading is a consistent rubric application with a fixed output contract; sampling and weekly scheduling are separate orchestration concerns intentionally excluded here. |
| Check a bug against the changelog and prepare an engineering write-up | Agent | It is a conditional investigation: compare evidence, decide known vs new/uncertain, then produce the appropriate branch-specific handoff. The Agent is deliberately read-only. |

No coordinator, queue listener, scheduler, ticket mutation, or end-to-end workflow is included.
