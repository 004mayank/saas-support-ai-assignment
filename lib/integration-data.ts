import type { WorkspaceId } from "@/lib/support-data";

export type IntegrationScenarioId =
  | "urgent_outage"
  | "policy_reply"
  | "retention_risk"
  | "new_bug"
  | "weekly_qa";

export type QueueTicket = {
  id: string;
  customer: string;
  subject: string;
  received: string;
  channel: "Email" | "Chat" | "Status page";
  priority: "Critical" | "High" | "Normal";
  route: string;
  scenario: IntegrationScenarioId;
  signals: string[];
};

export type IntegrationConnector = {
  id: string;
  name: string;
  system: string;
  direction: "Read" | "Write" | "Read / write";
  scopes: string[];
  status: "Connected" | "Standby";
  note: string;
};

export type IntegrationStep = {
  id: string;
  label: string;
  detail: string;
  kind: "rule" | "connector" | "skill" | "agent" | "write";
  status: "completed" | "skipped";
  durationMs: number;
};

export type IntegrationWrite = {
  system: "On-call" | "Ticketing" | "CRM" | "Engineering" | "QA warehouse";
  action: string;
  recordId: string;
  mode: "preview" | "sandbox";
  summary: string;
};

export type IntegrationRun = {
  id: string;
  scenario: IntegrationScenarioId;
  title: string;
  status: "Escalated" | "Completed";
  startedAt: string;
  durationMs: number;
  source: string;
  summary: string;
  output: string;
  steps: IntegrationStep[];
  writes: IntegrationWrite[];
  sandbox: true;
};

export type ScenarioDefinition = {
  id: IntegrationScenarioId;
  title: string;
  description: string;
  task?: WorkspaceId;
  inputSource: string;
  trigger: string;
  accent: "critical" | "skill" | "agent" | "schedule";
};

export const integrationScenarios: ScenarioDefinition[] = [
  {
    id: "urgent_outage",
    title: "Live outage escalation",
    description: "Deterministic rules bypass the AI queue and page on-call immediately.",
    inputSource: "Shared inbox",
    trigger: "outage + production down",
    accent: "critical",
  },
  {
    id: "policy_reply",
    title: "Policy-safe reply flow",
    description: "Classify, draft with the Reply Skill, then stage the response in ticketing.",
    task: "reply",
    inputSource: "Inbox + policy store",
    trigger: "billing / refund",
    accent: "skill",
  },
  {
    id: "retention_risk",
    title: "At-risk account brief",
    description: "Fetch three account sources, run the Retention Agent, and log a CRM note.",
    task: "retention",
    inputSource: "Billing + usage + ticketing",
    trigger: "account risk flag",
    accent: "agent",
  },
  {
    id: "new_bug",
    title: "New bug handoff",
    description: "Compare the changelog, run the Bug Agent, and prepare an engineering issue.",
    task: "bug",
    inputSource: "Ticketing + changelog",
    trigger: "bug report",
    accent: "agent",
  },
  {
    id: "weekly_qa",
    title: "Weekly QA review",
    description: "Select the rolling sample, grade each ticket, and persist the pattern summary.",
    task: "qa",
    inputSource: "Ticketing + QA rubric",
    trigger: "Monday 09:00",
    accent: "schedule",
  },
];

export const mockQueueTickets: QueueTicket[] = [
  {
    id: "SUP-1124",
    customer: "Orbit Finance",
    subject: "Production API is down for all EU users",
    received: "2 min ago",
    channel: "Status page",
    priority: "Critical",
    route: "Incident response",
    scenario: "urgent_outage",
    signals: ["production down", "multiple users", "EU"],
  },
  {
    id: "SUP-1048",
    customer: "Mia Chen",
    subject: "Refund request after Growth renewal",
    received: "6 min ago",
    channel: "Email",
    priority: "Normal",
    route: "Billing support",
    scenario: "policy_reply",
    signals: ["refund", "renewal", "USD 149"],
  },
  {
    id: "AC-204",
    customer: "Northstar Labs",
    subject: "Renewal risk: sponsor departed",
    received: "18 min ago",
    channel: "Email",
    priority: "High",
    route: "Customer success",
    scenario: "retention_risk",
    signals: ["at risk", "usage decline", "renewal"],
  },
  {
    id: "SUP-1117",
    customer: "Lattice Works",
    subject: "Analytics CSV export stalls at 92%",
    received: "31 min ago",
    channel: "Chat",
    priority: "High",
    route: "Technical support",
    scenario: "new_bug",
    signals: ["bug", "3 of 3 attempts", "CSV export"],
  },
];

export const integrationConnectors: IntegrationConnector[] = [
  {
    id: "inbox",
    name: "Shared inbox",
    system: "Support mailbox",
    direction: "Read / write",
    scopes: ["tickets:read", "drafts:write", "routes:write"],
    status: "Connected",
    note: "Mock polling endpoint and response drafts.",
  },
  {
    id: "billing",
    name: "Billing",
    system: "Subscription ledger",
    direction: "Read",
    scopes: ["accounts:read", "invoices:read"],
    status: "Connected",
    note: "Read-only account and invoice fixtures.",
  },
  {
    id: "usage",
    name: "Product usage",
    system: "Event warehouse",
    direction: "Read",
    scopes: ["usage:read"],
    status: "Connected",
    note: "Read-only adoption snapshots.",
  },
  {
    id: "oncall",
    name: "On-call",
    system: "Incident paging",
    direction: "Write",
    scopes: ["incidents:create"],
    status: "Connected",
    note: "Pages are recorded inside the sandbox only.",
  },
  {
    id: "crm",
    name: "CRM",
    system: "Customer success",
    direction: "Write",
    scopes: ["notes:create"],
    status: "Connected",
    note: "Briefs become sandbox timeline notes.",
  },
  {
    id: "engineering",
    name: "Engineering tracker",
    system: "Issue management",
    direction: "Write",
    scopes: ["issues:create"],
    status: "Connected",
    note: "New issues are staged with repro evidence.",
  },
  {
    id: "policy",
    name: "Policy + changelog",
    system: "Knowledge store",
    direction: "Read",
    scopes: ["documents:read"],
    status: "Connected",
    note: "Versioned policy and release-note fixtures.",
  },
];

export function findScenario(id: IntegrationScenarioId) {
  return integrationScenarios.find((scenario) => scenario.id === id);
}
