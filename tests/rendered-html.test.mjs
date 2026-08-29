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
