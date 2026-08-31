import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import test, { after, before } from "node:test";

const root = new URL("../", import.meta.url);
const baseUrl = "http://127.0.0.1:3197";
let server;

before(async () => {
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3197"], {
    cwd: new URL("..", import.meta.url),
    stdio: ["ignore", "pipe", "pipe"],
  });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // The server may still be binding its port; retry until the deadline.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Next.js production server did not start in time.");
});

after(() => {
  server?.kill("SIGTERM");
});

async function render(path = "/") {
  return fetch(`${baseUrl}${path}`, { headers: { accept: "text/html" } });
}

test("server-renders the integrated operations control room", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Support Lab Ops/);
  assert.match(html, /From shared inbox/);
  assert.match(html, /Five complete paths/);
  assert.match(html, /Mock sandbox/);
  assert.match(html, /Live outage escalation/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("keeps the original submission app accessible at standalone", async () => {
  const response = await render("/standalone");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Four focused AI tools/);
  assert.match(html, /Zero orchestration/);
  assert.match(html, /Policy-safe reply/);
  assert.match(html, /Retention brief agent/);
});

test("keeps standalone boundaries, integration contracts, and provider support in source", async () => {
  const [component, route, runner, integration, integrationRunner, mapping] = await Promise.all([
    readFile(new URL("app/components/SupportWorkbench.tsx", root), "utf8"),
    readFile(new URL("app/api/run/route.ts", root), "utf8"),
    readFile(new URL("lib/llm-runner.ts", root), "utf8"),
    readFile(new URL("app/api/integration/route.ts", root), "utf8"),
    readFile(new URL("lib/integration-runner.ts", root), "utf8"),
    readFile(new URL("artifacts/MAPPING.md", root), "utf8"),
  ]);
  assert.match(component, /No orchestration/);
  assert.match(component, /OpenAI-compatible endpoint/);
  assert.match(route, /executeModelTask/);
  assert.match(runner, /runOpenAiCompatible/);
  assert.match(runner, /runAnthropic/);
  assert.match(runner, /runGoogle/);
  assert.match(integration, /executeIntegrationScenario/);
  assert.match(integrationRunner, /Emergency rule matched/);
  assert.match(integrationRunner, /CRM note staged/);
  assert.match(integrationRunner, /Engineering issue staged/);
  assert.match(mapping, /\| Neither \|/);
  assert.match(mapping, /\| Skill \|/);
  assert.match(mapping, /\| Agent \|/);
});

test("demo API returns verified standalone output", async () => {
  const response = await fetch(`${baseUrl}/api/run`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        task: "reply",
        input: "example",
        context: "policy",
        config: {
          mode: "demo",
          provider: "openai",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4.1-mini",
          apiKey: "",
          temperature: 0.2
        }
      }),
    });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.match(payload.output, /## Customer reply/);
  assert.equal(payload.source, "demo");
});

test("integration API polls the mock inbox", async () => {
  const response = await fetch(`${baseUrl}/api/integration`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "poll" }),
  });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.sandbox, true);
  assert.equal(payload.criticalCount, 1);
  assert.equal(payload.tickets.length, 4);
});

test("critical outage bypasses the model and creates an immediate preview", async () => {
  const response = await fetch(`${baseUrl}/api/integration`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "run", scenario: "urgent_outage", dryRun: true }),
  });
  assert.equal(response.status, 200);
  const { run } = await response.json();
  assert.equal(run.status, "Escalated");
  assert.equal(run.source, "deterministic rules");
  assert.equal(run.writes[0].system, "On-call");
  assert.equal(run.writes[0].mode, "preview");
  assert.match(run.steps[1].detail, /AI queue bypassed/);
});

test("retention workflow reconciles sources and records a sandbox CRM write", async () => {
  const response = await fetch(`${baseUrl}/api/integration`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "run",
      scenario: "retention_risk",
      dryRun: false,
      config: {
        mode: "demo",
        provider: "openai",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4.1-mini",
        apiKey: "",
        temperature: 0.2,
      },
    }),
  });
  assert.equal(response.status, 200);
  const { run } = await response.json();
  assert.equal(run.status, "Completed");
  assert.equal(run.steps.filter((step) => step.kind === "connector").length, 3);
  assert.equal(run.writes[0].system, "CRM");
  assert.equal(run.writes[0].mode, "sandbox");
  assert.match(run.output, /Northstar Labs/);
});

test("weekly scheduler invokes the QA workflow in the sandbox", async () => {
  const response = await fetch(`${baseUrl}/api/cron/weekly-qa`);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.scheduled, true);
  assert.equal(payload.sandbox, true);
  assert.equal(payload.run.scenario, "weekly_qa");
  assert.equal(payload.run.writes[0].system, "QA warehouse");
  assert.equal(payload.run.writes[0].mode, "sandbox");
});
