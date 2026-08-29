import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Support Lab application shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Support Lab/);
  assert.match(html, /Four focused AI tools/);
  assert.match(html, /Zero orchestration/);
  assert.match(html, /Policy-safe reply/);
  assert.match(html, /Retention brief agent/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("keeps standalone boundaries and provider support in source", async () => {
  const [component, route, mapping] = await Promise.all([
    readFile(new URL("app/components/SupportWorkbench.tsx", root), "utf8"),
    readFile(new URL("app/api/run/route.ts", root), "utf8"),
    readFile(new URL("artifacts/MAPPING.md", root), "utf8"),
  ]);
  assert.match(component, /No orchestration/);
  assert.match(component, /OpenAI-compatible endpoint/);
  assert.match(route, /runOpenAiCompatible/);
  assert.match(route, /runAnthropic/);
  assert.match(route, /runGoogle/);
  assert.match(mapping, /\| Neither \|/);
  assert.match(mapping, /\| Skill \|/);
  assert.match(mapping, /\| Agent \|/);
});

test("demo API returns verified standalone output", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("api-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/api/run", {
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
      })
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} }
  );
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.match(payload.output, /## Customer reply/);
  assert.equal(payload.source, "demo");
});
