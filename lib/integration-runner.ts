import {
  findScenario,
  type IntegrationRun,
  type IntegrationScenarioId,
  type IntegrationStep,
  type IntegrationWrite,
} from "@/lib/integration-data";
import { executeModelTask } from "@/lib/llm-runner";
import { defaultConfig, workspaceCopy, type LlmConfig } from "@/lib/support-data";

export type ScenarioRunRequest = {
  scenario: IntegrationScenarioId;
  ticketId?: string;
  dryRun?: boolean;
  config?: LlmConfig;
};

function step(
  id: string,
  label: string,
  detail: string,
  kind: IntegrationStep["kind"],
  durationMs: number,
): IntegrationStep {
  return { id, label, detail, kind, durationMs, status: "completed" };
}

function write(
  system: IntegrationWrite["system"],
  action: string,
  recordId: string,
  summary: string,
  dryRun: boolean,
): IntegrationWrite {
  return { system, action, recordId, summary, mode: dryRun ? "preview" : "sandbox" };
}

function identifier(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

export async function executeIntegrationScenario(body: ScenarioRunRequest): Promise<IntegrationRun> {
  const scenario = findScenario(body.scenario);
  if (!scenario) throw new Error("A valid integration scenario is required.");
  const dryRun = body.dryRun !== false;
  const config = body.config || defaultConfig;
  const startedAt = new Date().toISOString();

  if (scenario.id === "urgent_outage") {
    const incidentId = identifier("INC");
    const steps = [
      step("ingest", "Inbox event received", "SUP-1124 received from the status-page channel.", "connector", 42),
      step("guard", "Emergency rule matched", "Matched “production down” and “multiple users”. AI queue bypassed.", "rule", 3),
      step("route", "Incident route selected", "Severity 1 · EU production API · Incident response.", "rule", 4),
      step("page", "On-call escalation staged", `${incidentId} prepared for the primary incident responder.`, "write", 19),
    ];
    return {
      id: identifier("RUN"),
      scenario: scenario.id,
      title: scenario.title,
      status: "Escalated",
      startedAt,
      durationMs: steps.reduce((total, item) => total + item.durationMs, 0),
      source: "deterministic rules",
      summary: "Critical outage bypassed every AI component and was escalated immediately.",
      output: "SEV-1 · Incident response\nRoute: EU API on-call\nSLA: immediate\nReason: deterministic emergency keywords matched before queuing.",
      steps,
      writes: [write("On-call", "Create incident page", incidentId, "EU production API unavailable for multiple users.", dryRun)],
      sandbox: true,
    };
  }

  const task = scenario.task;
  if (!task) throw new Error("This scenario has no executable component.");
  const copy = workspaceCopy[task];
  const result = await executeModelTask({ task, input: copy.input, context: copy.context, config });
  const steps: IntegrationStep[] = [];
  const writes: IntegrationWrite[] = [];

  if (scenario.id === "policy_reply") {
    steps.push(
      step("ingest", "Ticket read", "SUP-1048 loaded from the shared inbox.", "connector", 37),
      step("triage", "Route and safety checks", "Billing support selected; no emergency keyword matched.", "rule", 5),
      step("context", "Current policy fetched", "Commercial policy v2026.08.18 attached to the run.", "connector", 24),
      step("skill", "Reply Skill executed", `Draft produced using ${result.source}.`, "skill", 780),
      step("write", "Ticket draft staged", "Reply saved as a reviewable draft; it was not sent.", "write", 18),
    );
    writes.push(write("Ticketing", "Create outbound draft", "DRAFT-SUP-1048", "Policy-grounded renewal response awaiting review.", dryRun));
  } else if (scenario.id === "retention_risk") {
    steps.push(
      step("billing", "Billing history fetched", "Two invoice records loaded for AC-204.", "connector", 41),
      step("usage", "Usage history fetched", "Weekly users and automation trends loaded.", "connector", 52),
      step("tickets", "Ticket history fetched", "Two recent support records loaded.", "connector", 39),
      step("agent", "Retention Agent executed", `Three-source brief produced using ${result.source}.`, "agent", 940),
      step("write", "CRM note staged", "Call briefing attached to the sandbox account timeline.", "write", 21),
    );
    writes.push(write("CRM", "Create retention note", "NOTE-AC-204", "One-page retention brief for the 25-minute renewal call.", dryRun));
  } else if (scenario.id === "new_bug") {
    steps.push(
      step("ingest", "Bug report read", "SUP-1117 and its redacted attachment metadata loaded.", "connector", 31),
      step("changelog", "Changelog searched", "Two near matches found; both contain material contradictions.", "connector", 46),
      step("agent", "Bug Agent executed", `New-issue handoff produced using ${result.source}.`, "agent", 860),
      step("branch", "New issue branch selected", "No known issue met the two-signal match threshold.", "rule", 6),
      step("write", "Engineering issue staged", "Repro steps and missing diagnostics copied to sandbox tracker.", "write", 23),
    );
    writes.push(write("Engineering", "Create issue", "ENG-4821", "Analytics CSV export stalls at 92% for ranges over 90 days.", dryRun));
  } else {
    steps.push(
      step("schedule", "Weekly schedule fired", "Monday 09:00 UTC rolling QA review started.", "rule", 2),
      step("sample", "Closed-ticket sample selected", "25 tickets selected using the fixed rolling-sample rule.", "connector", 63),
      step("skill", "QA Skill executed", `Rubric applied to the representative ticket using ${result.source}.`, "skill", 1120),
      step("patterns", "Failure patterns summarized", "Unsupported promises and weak ownership were the recurring themes.", "skill", 188),
      step("write", "QA summary persisted", "Weekly scorecard stored in the sandbox QA warehouse.", "write", 27),
    );
    writes.push(write("QA warehouse", "Create weekly report", "QA-2026-W35", "25 tickets sampled · 72 average · 2 recurring patterns.", dryRun));
  }

  return {
    id: identifier("RUN"),
    scenario: scenario.id,
    title: scenario.title,
    status: "Completed",
    startedAt,
    durationMs: steps.reduce((total, item) => total + item.durationMs, 0),
    source: result.source,
    summary: scenario.description,
    output: result.output,
    steps,
    writes,
    sandbox: true,
  };
}
