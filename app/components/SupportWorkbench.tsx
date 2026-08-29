"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  defaultConfig,
  providerPresets,
  workspaceCopy,
  type LlmConfig,
  type LlmProvider,
  type WorkspaceId,
} from "@/lib/support-data";

type View = "overview" | WorkspaceId | "evidence" | "config";
type Theme = "light" | "dark";

const CONFIG_EVENT = "support-lab-config-change";
const THEME_EVENT = "support-lab-theme-change";

function subscribeToConfig(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(CONFIG_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(CONFIG_EVENT, listener);
  };
}

function getConfigSnapshot() {
  return `${window.localStorage.getItem("support-lab-config") || ""}\u241e${window.sessionStorage.getItem("support-lab-api-key") || ""}`;
}

function parseConfigSnapshot(snapshot: string): LlmConfig {
  const [saved, apiKey = ""] = snapshot.split("\u241e");
  if (!saved) return { ...defaultConfig, apiKey };
  try {
    return { ...defaultConfig, ...JSON.parse(saved), apiKey };
  } catch {
    return { ...defaultConfig, apiKey };
  }
}

function subscribeToTheme(listener: () => void) {
  window.addEventListener(THEME_EVENT, listener);
  return () => window.removeEventListener(THEME_EVENT, listener);
}

function getThemeSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

const navItems: Array<{ id: View; label: string; icon: string; group?: string }> = [
  { id: "overview", label: "Overview", icon: "⌂" },
  { id: "reply", label: "Reply studio", icon: "↗", group: "Skills" },
  { id: "qa", label: "QA grader", icon: "✓" },
  { id: "retention", label: "Retention brief", icon: "◎", group: "Agents" },
  { id: "bug", label: "Bug investigator", icon: "⌁" },
  { id: "evidence", label: "Test evidence", icon: "▦", group: "Submission" },
  { id: "config", label: "LLM settings", icon: "⚙" },
];

const decisionRows = [
  {
    index: "01",
    capability: "Ticket triage & emergency escalation",
    decision: "Neither",
    tone: "neutral",
    reason:
      "Safety-critical keywords and outage alerts belong in deterministic inbox rules, before any AI queue.",
  },
  {
    index: "02",
    capability: "Tone- and policy-safe outbound replies",
    decision: "Skill",
    tone: "skill",
    reason:
      "A repeatable, stateless procedure grounded in the current policy snapshot.",
  },
  {
    index: "03",
    capability: "At-risk customer briefing",
    decision: "Agent",
    tone: "agent",
    reason:
      "Reconciles three evidence sources, handles gaps, and builds a bounded call plan.",
  },
  {
    index: "04",
    capability: "Weekly ticket quality grading",
    decision: "Skill",
    tone: "skill",
    reason:
      "Consistent rubric application; scheduling and sample selection remain outside this submission.",
  },
  {
    index: "05",
    capability: "Known-issue check & bug handoff",
    decision: "Agent",
    tone: "agent",
    reason:
      "Runs a conditional investigation and produces a different result for known versus new issues.",
  },
];

function Logo() {
  return (
    <div className="brand" aria-label="Support Lab home">
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>
        <strong>Support Lab</strong>
        <small>AI architecture submission</small>
      </span>
    </div>
  );
}

function StatusPill({ config }: { config: LlmConfig }) {
  return (
    <div className={`provider-pill ${config.mode}`}>
      <span className="status-dot" />
      {config.mode === "demo"
        ? "Safe demo mode"
        : `${providerPresets[config.provider].label} · ${config.model}`}
    </div>
  );
}

function Sidebar({ active, onChange }: { active: View; onChange: (view: View) => void }) {
  return (
    <aside className="sidebar">
      <Logo />
      <nav aria-label="Primary navigation">
        {navItems.map((item, index) => (
          <div key={item.id}>
            {item.group ? <div className="nav-group">{item.group}</div> : null}
            <button
              className={`nav-item ${active === item.id ? "active" : ""}`}
              onClick={() => onChange(item.id)}
              type="button"
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
            {index === 0 ? <div className="nav-rule" /> : null}
          </div>
        ))}
      </nav>
      <div className="sidebar-note">
        <span className="note-mark" aria-hidden="true">◇</span>
        <div>
          <strong>No orchestration</strong>
          <p>Every workspace runs independently. No ticket mutations or hidden writes.</p>
        </div>
      </div>
    </aside>
  );
}

function PageHeader({
  active,
  config,
  onSettings,
  theme,
  onTheme,
}: {
  active: View;
  config: LlmConfig;
  onSettings: () => void;
  theme: "light" | "dark";
  onTheme: () => void;
}) {
  const title =
    active === "overview"
      ? "Architecture overview"
      : active === "evidence"
        ? "Standalone test evidence"
        : active === "config"
          ? "LLM configuration"
          : workspaceCopy[active].title;
  return (
    <header className="topbar">
      <div>
        <span className="topbar-kicker">SaaS Support AI</span>
        <strong>{title}</strong>
      </div>
      <div className="topbar-actions">
        <StatusPill config={config} />
        <button className="icon-button theme-button" onClick={onTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
          {theme === "light" ? "☾" : "☀"}
        </button>
        <button className="icon-button" onClick={onSettings} aria-label="Open LLM settings">
          ⚙
        </button>
      </div>
    </header>
  );
}

function Overview({ onOpen }: { onOpen: (view: View) => void }) {
  return (
    <div className="page overview-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Decision before implementation</span>
          <h1>
            Four focused AI tools.
            <br />
            <em>Zero orchestration.</em>
          </h1>
          <p>
            Each capability is classified by the behavior it actually needs—not by a quota.
            The result is a small, auditable surface that can be tested one piece at a time.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => onOpen("reply")} type="button">
              Try a standalone tool <span>→</span>
            </button>
            <button className="text-button" onClick={() => onOpen("evidence")} type="button">
              View test evidence
            </button>
          </div>
        </div>
        <div className="architecture-orbit" aria-label="Architecture summary">
          <div className="orbit-line one" />
          <div className="orbit-line two" />
          <div className="orbit-core">
            <small>DECISION</small>
            <strong>Right tool</strong>
            <span>for each job</span>
          </div>
          <span className="orbit-node node-a">Skill<span>02</span></span>
          <span className="orbit-node node-b">Agent<span>02</span></span>
          <span className="orbit-node node-c">Neither<span>01</span></span>
        </div>
      </section>

      <section className="metrics-row" aria-label="Project statistics">
        <div><strong>5</strong><span>Capabilities assessed</span></div>
        <div><strong>4</strong><span>Standalone AI tools</span></div>
        <div><strong>0</strong><span>Write-enabled integrations</span></div>
        <div><strong>100%</strong><span>Mock-data test coverage</span></div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">The mapping</span>
            <h2>One decision rule, applied consistently</h2>
          </div>
          <p>Deterministic controls stay deterministic. Skills encode reusable procedure. Agents own bounded investigation.</p>
        </div>
        <div className="decision-table">
          <div className="decision-head">
            <span>Capability</span><span>Decision</span><span>Why</span>
          </div>
          {decisionRows.map((row) => (
            <div className="decision-row" key={row.index}>
              <div className="capability-cell">
                <span>{row.index}</span>
                <strong>{row.capability}</strong>
              </div>
              <div><span className={`type-badge ${row.tone}`}>{row.decision}</span></div>
              <p>{row.reason}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-block tool-section">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Built and testable</span>
            <h2>Open any component on its own</h2>
          </div>
        </div>
        <div className="tool-grid">
          {(Object.keys(workspaceCopy) as WorkspaceId[]).map((id) => {
            const item = workspaceCopy[id];
            return (
              <button key={id} className="tool-card" onClick={() => onOpen(id)} type="button">
                <span className={`tool-icon ${item.badge.toLowerCase()}`}>{item.icon}</span>
                <span className={`type-badge ${item.badge.toLowerCase()}`}>{item.badge}</span>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
                <span className="card-link">Open workspace <b>→</b></span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Workspace({ id, config }: { id: WorkspaceId; config: LlmConfig }) {
  const copy = workspaceCopy[id];
  const [input, setInput] = useState(copy.input);
  const [context, setContext] = useState(copy.context);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function run() {
    setRunning(true);
    setError("");
    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ task: id, input, context, config }),
      });
      const payload = (await response.json()) as { output?: string; error?: string };
      if (!response.ok || !payload.output) throw new Error(payload.error || "Run failed.");
      setOutput(payload.output);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Run failed.");
    } finally {
      setRunning(false);
    }
  }

  async function copyOutput() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1300);
  }

  return (
    <div className="page workspace-page">
      <section className="workspace-intro">
        <div>
          <span className="eyebrow">{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
        </div>
        <div className="workspace-meta">
          <span className={`type-badge ${copy.badge.toLowerCase()}`}>{copy.badge}</span>
          <span className="scope-pill">{copy.scope}</span>
        </div>
      </section>

      <section className="run-grid">
        <div className="input-card">
          <div className="card-header">
            <div><span className="step-number">01</span><strong>Provide the input</strong></div>
            <button
              className="reset-button"
              onClick={() => {
                setInput(copy.input);
                setContext(copy.context);
                setOutput("");
                setError("");
              }}
              type="button"
            >
              Reset example
            </button>
          </div>
          <label htmlFor={`${id}-input`}>{copy.inputLabel}</label>
          <textarea id={`${id}-input`} value={input} onChange={(event) => setInput(event.target.value)} />
          <label htmlFor={`${id}-context`}>{copy.contextLabel}</label>
          <textarea
            className="context-area"
            id={`${id}-context`}
            value={context}
            onChange={(event) => setContext(event.target.value)}
          />
          <div className="run-footer">
            <span><i className={`mode-light ${config.mode}`} />{config.mode === "demo" ? "Runs with verified mock output" : `Runs on ${config.model}`}</span>
            <button className="primary-button run-button" onClick={run} disabled={running || !input.trim()} type="button">
              {running ? <><i className="spinner" /> Running</> : <>Run independently <span>→</span></>}
            </button>
          </div>
        </div>

        <div className={`output-card ${output ? "has-output" : ""}`}>
          <div className="card-header">
            <div><span className="step-number">02</span><strong>Review the result</strong></div>
            {output ? (
              <button className="reset-button" onClick={copyOutput} type="button">
                {copied ? "Copied" : "Copy output"}
              </button>
            ) : null}
          </div>
          {error ? <div className="error-box"><strong>Run failed</strong><p>{error}</p></div> : null}
          {!output && !error ? (
            <div className="empty-output">
              <span className={`large-tool-icon ${copy.badge.toLowerCase()}`}>{copy.icon}</span>
              <strong>Ready for a standalone run</strong>
              <p>The result will appear here. This workspace does not call any other Skill or Agent.</p>
              <div className="boundary-list">
                <span>✓ Independent input</span>
                <span>✓ Fixed output contract</span>
                <span>✓ No side effects</span>
              </div>
            </div>
          ) : null}
          {output ? <pre className="result-output">{output}</pre> : null}
        </div>
      </section>
    </div>
  );
}

function Evidence() {
  const tests = [
    { label: "Policy-safe reply", detail: "Numeric grounding + output shape", result: "PASS" },
    { label: "QA grader", detail: "Score ranges + cap + arithmetic", result: "PASS" },
    { label: "Retention brief", detail: "3-source traceability + no invented terms", result: "PASS" },
    { label: "Bug investigator", detail: "Known/new branch + evidence threshold", result: "PASS" },
  ];
  return (
    <div className="page evidence-page">
      <section className="workspace-intro">
        <div>
          <span className="eyebrow">Submission evidence</span>
          <h1>Every component tested alone.</h1>
          <p>Realistic mock inputs, expected outputs, validator checks, and no hidden coordinator.</p>
        </div>
        <div className="evidence-actions">
          <a className="secondary-button" href="/Support-Lab-Demo.mp4" target="_blank">Watch 6:49 demo <span>▶</span></a>
          <a className="primary-button download-button" href="/SaaS-Support-AI-Submission.pdf" download>
            Download PDF <span>↓</span>
          </a>
        </div>
      </section>

      <section className="evidence-summary">
        <div className="evidence-score"><strong>4/4</strong><span>standalone cases pass</span></div>
        <div className="evidence-bars">
          {tests.map((test) => (
            <div key={test.label}>
              <span>{test.label}</span><i><b /></i><strong>{test.result}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="test-grid">
        {tests.map((test, index) => (
          <article className="test-card" key={test.label}>
            <div><span>TC-0{index + 1}</span><strong className="pass-badge">✓ Passed</strong></div>
            <h2>{test.label}</h2>
            <p>{test.detail}</p>
            <ul>
              <li>Realistic fixture included</li>
              <li>Expected output captured</li>
              <li>Scope boundary verified</li>
            </ul>
          </article>
        ))}
      </section>

      <section className="boundary-panel">
        <div><span className="boundary-icon">⊘</span><div><strong>Explicitly out of scope</strong><p>Coordinator, queue polling, weekly scheduler, CRM writes, engineering-ticket creation, and end-to-end wiring.</p></div></div>
        <div className="artifact-links">
          <a href="https://github.com/004mayank/saas-support-ai-assignment" target="_blank" rel="noreferrer">Source repository ↗</a>
          <a href="/Support-Lab-Demo.mp4" target="_blank">Demo video ↗</a>
          <a href="/SaaS-Support-AI-Submission.pdf" target="_blank">Submission PDF ↗</a>
        </div>
      </section>
    </div>
  );
}

function ConfigPage({ config, onChange }: { config: LlmConfig; onChange: (next: LlmConfig) => void }) {
  const [draft, setDraft] = useState(config);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState("");

  function setProvider(provider: LlmProvider) {
    const preset = providerPresets[provider];
    setDraft((current) => ({ ...current, provider, baseUrl: preset.baseUrl, model: preset.model }));
    setTestResult("");
  }

  function save() {
    onChange(draft);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  }

  async function testConnection() {
    setTesting(true);
    setTestResult("");
    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ task: "connection_test", config: draft }),
      });
      const payload = (await response.json()) as { output?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "Connection failed.");
      setTestResult(payload.output || "Connection ready.");
    } catch (testError) {
      setTestResult(testError instanceof Error ? testError.message : "Connection failed.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="page config-page">
      <section className="workspace-intro">
        <div>
          <span className="eyebrow">Single-user configuration</span>
          <h1>Bring the model you trust.</h1>
          <p>Choose a preset or point the app at any OpenAI-compatible endpoint. The four tools share this one local setting.</p>
        </div>
      </section>

      <div className="config-layout">
        <section className="config-card">
          <div className="config-section">
            <span className="config-index">01</span>
            <div>
              <h2>Run mode</h2>
              <p>Start safely with deterministic demo results, then switch to your own provider.</p>
              <div className="mode-switch" role="group" aria-label="Run mode">
                <button className={draft.mode === "demo" ? "active" : ""} onClick={() => setDraft({ ...draft, mode: "demo" })} type="button">
                  <span>◇</span><strong>Demo</strong><small>No API call</small>
                </button>
                <button className={draft.mode === "live" ? "active" : ""} onClick={() => setDraft({ ...draft, mode: "live" })} type="button">
                  <span>↗</span><strong>Live model</strong><small>Use your key</small>
                </button>
              </div>
            </div>
          </div>

          <div className="config-section">
            <span className="config-index">02</span>
            <div>
              <h2>Provider</h2>
              <p>Presets select the expected request format. Custom uses OpenAI-compatible chat completions.</p>
              <div className="provider-grid">
                {(Object.keys(providerPresets) as LlmProvider[]).map((provider) => (
                  <button className={draft.provider === provider ? "active" : ""} key={provider} onClick={() => setProvider(provider)} type="button">
                    <span>{provider === "openai" ? "◎" : provider === "anthropic" ? "A" : provider === "google" ? "✦" : provider === "openrouter" ? "↗" : provider === "ollama" ? "◒" : "<>"}</span>
                    {providerPresets[provider].label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="config-section last">
            <span className="config-index">03</span>
            <div className="field-section">
              <h2>Connection details</h2>
              <div className="field-grid">
                <label>Base URL<input value={draft.baseUrl} onChange={(event) => setDraft({ ...draft, baseUrl: event.target.value })} /></label>
                <label>Model<input value={draft.model} onChange={(event) => setDraft({ ...draft, model: event.target.value })} /></label>
                <label className="full-field">API key<input type="password" autoComplete="off" placeholder={providerPresets[draft.provider].keyHint} value={draft.apiKey} onChange={(event) => setDraft({ ...draft, apiKey: event.target.value })} /><small>Kept in this browser session only; never written to the project database.</small></label>
                <label>Temperature <span>{draft.temperature.toFixed(1)}</span><input type="range" min="0" max="1" step="0.1" value={draft.temperature} onChange={(event) => setDraft({ ...draft, temperature: Number(event.target.value) })} /></label>
              </div>
            </div>
          </div>
          <div className="config-actions">
            <button className="secondary-button" onClick={testConnection} disabled={testing} type="button">{testing ? "Testing…" : "Test connection"}</button>
            <button className="primary-button" onClick={save} type="button">{saved ? "Saved ✓" : "Save configuration"}</button>
          </div>
          {testResult ? <div className="test-result"><span>●</span>{testResult}</div> : null}
        </section>

        <aside className="privacy-card">
          <span className="privacy-icon">⌁</span>
          <h2>Scoped by design</h2>
          <p>Your configuration changes how each standalone component runs. It does not connect them together.</p>
          <ul>
            <li><span>✓</span> Key stays in session storage</li>
            <li><span>✓</span> Requests run only when you click</li>
            <li><span>✓</span> No background polling</li>
            <li><span>✓</span> No external system writes</li>
          </ul>
          <div className="privacy-note"><strong>Local provider?</strong><p>Use Ollama with an OpenAI-compatible `/v1` endpoint. Your browser must be able to reach it.</p></div>
        </aside>
      </div>
    </div>
  );
}

export default function SupportWorkbench() {
  const [active, setActive] = useState<View>("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const configSnapshot = useSyncExternalStore(subscribeToConfig, getConfigSnapshot, () => "");
  const config = useMemo(() => parseConfigSnapshot(configSnapshot), [configSnapshot]);
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, (): Theme => "light");

  const activeLabel = useMemo(
    () => navItems.find((item) => item.id === active)?.label || "Overview",
    [active],
  );

  function updateConfig(next: LlmConfig) {
    const safeConfig = { ...next } as Partial<LlmConfig>;
    delete safeConfig.apiKey;
    window.localStorage.setItem("support-lab-config", JSON.stringify(safeConfig));
    if (next.apiKey) window.sessionStorage.setItem("support-lab-api-key", next.apiKey);
    else window.sessionStorage.removeItem("support-lab-api-key");
    window.dispatchEvent(new Event(CONFIG_EVENT));
  }

  function navigate(view: View) {
    setActive(view);
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("support-lab-theme", next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <div className="app-shell">
      <div className={`mobile-drawer ${mobileNav ? "open" : ""}`}>
        <Sidebar active={active} onChange={navigate} />
      </div>
      {mobileNav ? <button className="drawer-backdrop" onClick={() => setMobileNav(false)} aria-label="Close navigation" /> : null}
      <Sidebar active={active} onChange={navigate} />
      <main className="main-shell">
        <div className="mobile-bar">
          <button onClick={() => setMobileNav(true)} aria-label="Open navigation">☰</button>
          <strong>{activeLabel}</strong>
          <div>
            <button onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>{theme === "light" ? "☾" : "☀"}</button>
            <button onClick={() => navigate("config")} aria-label="Open LLM settings">⚙</button>
          </div>
        </div>
        <PageHeader active={active} config={config} onSettings={() => navigate("config")} theme={theme} onTheme={toggleTheme} />
        {active === "overview" ? <Overview onOpen={navigate} /> : null}
        {active === "reply" || active === "qa" || active === "retention" || active === "bug" ? <Workspace key={active} id={active} config={config} /> : null}
        {active === "evidence" ? <Evidence /> : null}
        {active === "config" ? <ConfigPage config={config} onChange={updateConfig} /> : null}
        <footer><span>Support Lab · AI architecture submission</span><span>Mock data only · Built for independent evaluation</span></footer>
      </main>
    </div>
  );
}
