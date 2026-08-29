# AI use and manual modifications

## AI-assisted work

- Architecture classification and initial justification drafts.
- First drafts of Skill instructions, Agent instructions, mock fixtures, expected outputs, UI copy, and test scaffolding.
- Implementation of the provider adapters, standalone workspaces, and PDF generation code.

## Manual decisions and modifications

- Chose deterministic infrastructure for real-time escalation so an LLM is not on the safety-critical path.
- Split stateless policy/rubric procedures from bounded investigative Agents.
- Limited both Agents to read-only, no-memory operation and removed unnecessary tools.
- Defined the sample commercial policy, tone guide, QA weights, hard caps, schemas, risk evidence requirements, and known-issue match threshold.
- Reviewed every mock output against its source fixture and edited unsupported or ambiguous claims.
- Verified Skill structure, validator arithmetic, application builds, API behavior, and final PDF rendering.

All company names, customer data, prices, tickets, policies, and changelog entries in this project are fictional mock data.
