"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  integrationConnectors,
  integrationScenarios,
  mockQueueTickets,
  type IntegrationRun,
  type IntegrationScenarioId,
  type QueueTicket,
} from "@/lib/integration-data";
import {
  defaultConfig,
  providerPresets,
  type LlmConfig,
  type LlmProvider,
} from "@/lib/support-data";

type OpsView = "control" | "queue" | "runs" | "connectors" | "settings";
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

const nav: Array<{ id: OpsView; label: string; icon: string; group?: string }> = [
  { id: "control", label: "Control room", icon: "⌂" },
  { id: "queue", label: "Live queue", icon: "▤", group: "Operations" },
  { id: "runs", label: "Runs & audit", icon: "◎" },
  { id: "connectors", label: "Connectors", icon: "⌁", group: "Integration" },
  { id: "settings", label: "Model & safety", icon: "⚙" },
];

function OpsLogo() {
  return (
    <div className="brand" aria-label="Support Lab Ops">
      <span className="brand-mark ops-brand-mark" aria-hidden="true"><i /><i /><i /></span>
      <span><strong>Support Lab Ops</strong><small>Personal integration build</small></span>
    </div>
  );
}

function OpsSidebar({ active, onChange }: { active: OpsView; onChange: (view: OpsView) => void }) {
  return (
    <aside className="sidebar ops-sidebar">
      <OpsLogo />
      <nav aria-label="Integration navigation">
        {nav.map((item, index) => (
          <div key={item.id}>
            {item.group ? <div className="nav-group">{item.group}</div> : null}
            <button className={`nav-item ${active === item.id ? "active" : ""}`} onClick={() => onChange(item.id)} type="button">
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </button>
            {index === 0 ? <div className="nav-rule" /> : null}
          </div>
        ))}
      </nav>
      <div className="sidebar-note ops-sidebar-note">
        <span className="note-mark" aria-hidden="true">◇</span>
        <div><strong>Mock sandbox</strong><p>Coordinator and writes are real code. External systems are simulated.</p></div>
      </div>
    </aside>
  );
}

function SandboxPill({ dryRun }: { dryRun: boolean }) {
  return <div className={`ops-mode-pill ${dryRun ? "preview" : "sandbox"}`}><span />{dryRun ? "Dry run · no writes" : "Sandbox writes enabled"}</div>;
}

function OpsHeader({ active, dryRun, theme, onTheme, onSettings }: { active: OpsView; dryRun: boolean; theme: Theme; onTheme: () => void; onSettings: () => void }) {
  const label = nav.find((item) => item.id === active)?.label || "Control room";
  return (
    <header className="topbar ops-topbar">
      <div><span className="topbar-kicker">SaaS Support Operations</span><strong>{label}</strong></div>
      <div className="topbar-actions">
        <SandboxPill dryRun={dryRun} />
        <button className="icon-button theme-button" onClick={onTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>{theme === "light" ? "☾" : "☀"}</button>
        <button className="icon-button" onClick={onSettings} aria-label="Open model and safety settings">⚙</button>
      </div>
    </header>
  );
}

function RunButton({ scenario, running, onRun, compact = false }: { scenario: IntegrationScenarioId; running: string; onRun: (id: IntegrationScenarioId) => void; compact?: boolean }) {
  const busy = running === scenario;
  return (
    <button className={compact ? "ops-run-small" : "primary-button"} disabled={Boolean(running)} onClick={() => onRun(scenario)} type="button">
      {busy ? <><i className="spinner" /> Running</> : compact ? "Run flow →" : <>Run workflow <span>→</span></>}
    </button>
  );
}

function ControlRoom({ runs, running, dryRun, onRun, onView }: { runs: IntegrationRun[]; running: string; dryRun: boolean; onRun: (id: IntegrationScenarioId) => void; onView: (view: OpsView) => void }) {
  const latest = runs[0];
  return (
    <div className="page ops-page">
      <section className="ops-hero">
        <div>
          <span className="eyebrow">Integration control plane</span>
          <h1>From shared inbox<br /><em>to owned action.</em></h1>
          <p>The previously out-of-scope layer is now wired: polling, deterministic safety gates, bounded AI components, schedules, and audited sandbox writes.</p>
          <div className="hero-actions">
            <RunButton scenario="urgent_outage" running={running} onRun={onRun} />
            <button className="text-button" onClick={() => onView("queue")} type="button">Open live queue</button>
          </div>
        </div>
        <div className="ops-live-card">
          <div className="ops-live-head"><span><i /> SYSTEM STATUS</span><strong>All systems ready</strong></div>
          <div className="ops-route-map" aria-label="Integration flow">
            <span>Inbox</span><b>→</b><span>Safety gate</span><b>→</b><span>Coordinator</span><b>→</b><span>System of record</span>
          </div>
          <div className="ops-live-foot"><span>{dryRun ? "Previewing write intents" : "Recording sandbox writes"}</span><span>7 connectors</span></div>
        </div>
      </section>

      <section className="ops-metrics" aria-label="Integration statistics">
        <div><span className="ops-metric-icon critical">!</span><strong>1</strong><small>Immediate escalation</small></div>
        <div><span className="ops-metric-icon">▤</span><strong>4</strong><small>Queue items</small></div>
        <div><span className="ops-metric-icon">⌁</span><strong>7</strong><small>Mock connectors</small></div>
        <div><span className="ops-metric-icon">◎</span><strong>{runs.length}</strong><small>Runs this session</small></div>
      </section>

      <section className="ops-section">
        <div className="section-heading compact">
          <div><span className="eyebrow">Runnable playbooks</span><h2>Five complete paths, one safety model</h2></div>
          <p>Emergency controls execute before AI. Every other path invokes only the component it needs.</p>
        </div>
        <div className="ops-playbook-grid">
          {integrationScenarios.map((scenario) => (
            <article className={`ops-playbook ${scenario.accent}`} key={scenario.id}>
              <div><span className="ops-playbook-kind">{scenario.accent === "critical" ? "DETERMINISTIC" : scenario.task === "qa" || scenario.task === "reply" ? "SKILL FLOW" : "AGENT FLOW"}</span><i>{scenario.trigger}</i></div>
              <h3>{scenario.title}</h3>
              <p>{scenario.description}</p>
              <footer><span>{scenario.inputSource}</span><RunButton compact scenario={scenario.id} running={running} onRun={onRun} /></footer>
            </article>
          ))}
        </div>
      </section>

      <section className="ops-section ops-latest-section">
        <div className="section-heading compact"><div><span className="eyebrow">Latest activity</span><h2>{latest ? latest.title : "No workflow has run yet"}</h2></div>{latest ? <button className="text-button" onClick={() => onView("runs")} type="button">Inspect audit trail</button> : null}</div>
        {latest ? <RunSummary run={latest} compact /> : <div className="ops-empty"><span>◎</span><strong>The audit log is ready</strong><p>Run any playbook to see its decisions, model invocation, connector reads, and write intent.</p></div>}
      </section>
    </div>
  );
}

function QueueView({ tickets, polledAt, polling, running, onPoll, onRun }: { tickets: QueueTicket[]; polledAt: string; polling: boolean; running: string; onPoll: () => void; onRun: (id: IntegrationScenarioId) => void }) {
  return (
    <div className="page ops-page">
      <section className="workspace-intro ops-intro">
        <div><span className="eyebrow">Mock shared inbox</span><h1>Queue with a safety fast lane.</h1><p>Critical keywords are resolved by code before ordinary categorization or model work begins.</p></div>
        <button className="primary-button" onClick={onPoll} disabled={polling} type="button">{polling ? <><i className="spinner" /> Polling</> : <>Poll inbox <span>↻</span></>}</button>
      </section>
      <div className="ops-queue-note"><span className="status-dot" /><strong>Last poll</strong><span>{polledAt || "Ready for first poll"}</span><i>Mock connector · no background process</i></div>
      <section className="ops-ticket-list">
        {tickets.map((ticket) => (
          <article className={`ops-ticket ${ticket.priority.toLowerCase()}`} key={ticket.id}>
            <div className="ops-ticket-priority"><span>{ticket.priority === "Critical" ? "!" : ticket.priority === "High" ? "↑" : "—"}</span><small>{ticket.priority}</small></div>
            <div className="ops-ticket-main">
              <div><span className="ops-ticket-id">{ticket.id}</span><span>{ticket.channel}</span><span>{ticket.received}</span></div>
              <h2>{ticket.subject}</h2><p>{ticket.customer} · Route: {ticket.route}</p>
              <div className="ops-signals">{ticket.signals.map((signal) => <span key={signal}>{signal}</span>)}</div>
            </div>
            <div className="ops-ticket-action"><small>{ticket.priority === "Critical" ? "Bypasses AI queue" : "Coordinator ready"}</small><RunButton compact scenario={ticket.scenario} running={running} onRun={onRun} /></div>
          </article>
        ))}
      </section>
    </div>
  );
}

function RunSummary({ run, compact = false }: { run: IntegrationRun; compact?: boolean }) {
  return (
    <article className={`ops-run-card ${compact ? "compact" : ""}`}>
      <header><div><span className={`ops-run-status ${run.status.toLowerCase()}`}>{run.status}</span><span>{run.id}</span></div><span>{run.durationMs.toLocaleString()} ms · {run.source}</span></header>
      <div className="ops-run-title"><div><h3>{run.title}</h3><p>{run.summary}</p></div><time>{new Date(run.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div>
      <div className="ops-step-line">
        {run.steps.map((item, index) => <div key={item.id}><span className={`ops-step-dot ${item.kind}`}>{index + 1}</span><strong>{item.label}</strong><small>{item.durationMs} ms</small></div>)}
      </div>
      {!compact ? (
        <div className="ops-run-detail">
          <div><h4>Component output</h4><pre>{run.output}</pre></div>
          <aside><h4>Write ledger</h4>{run.writes.map((item) => <div className="ops-write-item" key={`${item.system}-${item.recordId}`}><span className={item.mode}>{item.mode}</span><strong>{item.system} · {item.action}</strong><p>{item.summary}</p><code>{item.recordId}</code></div>)}</aside>
        </div>
      ) : null}
    </article>
  );
}

function RunsView({ runs }: { runs: IntegrationRun[] }) {
  return (
    <div className="page ops-page">
      <section className="workspace-intro ops-intro"><div><span className="eyebrow">Observable by default</span><h1>Every decision leaves a trail.</h1><p>Rules, connector reads, AI execution, branches, and writes are preserved together for review.</p></div><div className="ops-run-count"><strong>{runs.length}</strong><span>session runs</span></div></section>
      {runs.length ? <section className="ops-run-list">{runs.map((run) => <RunSummary run={run} key={run.id} />)}</section> : <div className="ops-empty large"><span>◎</span><strong>No runs in this browser session</strong><p>Start a playbook from the control room or live queue. The newest audit trail will appear here.</p></div>}
    </div>
  );
}

function ConnectorsView() {
  return (
    <div className="page ops-page">
      <section className="workspace-intro ops-intro"><div><span className="eyebrow">Least-privilege adapters</span><h1>Only the scope each path needs.</h1><p>These connectors implement realistic contracts with fictional records; no third-party account is contacted.</p></div><span className="ops-sandbox-badge">SANDBOX · 7 / 7 READY</span></section>
      <section className="ops-connector-grid">{integrationConnectors.map((connector) => <article key={connector.id}><header><span>{connector.name.slice(0, 2).toUpperCase()}</span><div><h2>{connector.name}</h2><p>{connector.system}</p></div><i>{connector.status}</i></header><div className="ops-direction"><span>{connector.direction}</span>{connector.scopes.map((scope) => <code key={scope}>{scope}</code>)}</div><p>{connector.note}</p></article>)}</section>
      <section className="ops-boundary-banner"><span>⊘</span><div><strong>Hard boundary</strong><p>“Sandbox writes enabled” records a successful mutation in this demo’s audit ledger. It never sends email, pages a person, or changes a real CRM or engineering tracker.</p></div></section>
    </div>
  );
}

function SettingsView({ config, dryRun, onConfig, onDryRun }: { config: LlmConfig; dryRun: boolean; onConfig: (config: LlmConfig) => void; onDryRun: (value: boolean) => void }) {
  const [draft, setDraft] = useState(config);
  const [saved, setSaved] = useState(false);
  function setProvider(provider: LlmProvider) {
    const preset = providerPresets[provider];
    setDraft((current) => ({ ...current, provider, baseUrl: preset.baseUrl, model: preset.model }));
  }
  function save() {
    onConfig(draft); setSaved(true); window.setTimeout(() => setSaved(false), 1200);
  }
  return (
    <div className="page ops-page">
      <section className="workspace-intro ops-intro"><div><span className="eyebrow">Operator controls</span><h1>Model choice and write safety.</h1><p>The coordinator reuses the same provider-agnostic configuration as the standalone components.</p></div><a className="secondary-button" href="/standalone">Open standalone app ↗</a></section>
      <div className="ops-settings-grid">
        <section className="ops-settings-card">
          <div className="ops-settings-title"><span>01</span><div><h2>Execution mode</h2><p>Demo mode uses verified fixture outputs. Live mode calls the selected provider only when you run a workflow.</p></div></div>
          <div className="mode-switch"><button className={draft.mode === "demo" ? "active" : ""} onClick={() => setDraft({ ...draft, mode: "demo" })} type="button"><span>◇</span><strong>Verified demo</strong><small>No model request</small></button><button className={draft.mode === "live" ? "active" : ""} onClick={() => setDraft({ ...draft, mode: "live" })} type="button"><span>↗</span><strong>Live model</strong><small>Use my provider</small></button></div>
          <div className="ops-provider-row">{(Object.keys(providerPresets) as LlmProvider[]).map((provider) => <button className={draft.provider === provider ? "active" : ""} onClick={() => setProvider(provider)} key={provider} type="button">{providerPresets[provider].label}</button>)}</div>
          <div className="field-grid ops-field-grid"><label>Base URL<input value={draft.baseUrl} onChange={(event) => setDraft({ ...draft, baseUrl: event.target.value })} /></label><label>Model<input value={draft.model} onChange={(event) => setDraft({ ...draft, model: event.target.value })} /></label><label className="full-field">API key<input type="password" autoComplete="off" placeholder={providerPresets[draft.provider].keyHint} value={draft.apiKey} onChange={(event) => setDraft({ ...draft, apiKey: event.target.value })} /><small>Stored in session storage only.</small></label></div>
          <button className="primary-button ops-save" onClick={save} type="button">{saved ? "Saved ✓" : "Save model configuration"}</button>
        </section>
        <aside className="ops-safety-card">
          <span className="eyebrow">Write policy</span><h2>External side effects stay off.</h2><p>Choose whether a run previews its write intents or records them as completed in the local sandbox ledger.</p>
          <button className={`ops-safety-toggle ${!dryRun ? "active" : ""}`} onClick={() => onDryRun(!dryRun)} type="button"><span><i /></span><div><strong>{dryRun ? "Dry run" : "Sandbox writes"}</strong><small>{dryRun ? "Preview every mutation" : "Record simulated success"}</small></div></button>
          <ul><li><span>✓</span> Emergency rules never depend on an LLM</li><li><span>✓</span> Customer replies remain drafts</li><li><span>✓</span> Credentials never enter the repository</li><li><span>✓</span> No real person or system is contacted</li></ul>
        </aside>
      </div>
    </div>
  );
}

export default function IntegrationWorkbench() {
  const [active, setActive] = useState<OpsView>("control");
  const [mobileNav, setMobileNav] = useState(false);
  const [tickets, setTickets] = useState<QueueTicket[]>(mockQueueTickets);
  const [runs, setRuns] = useState<IntegrationRun[]>([]);
  const [running, setRunning] = useState("");
  const [polling, setPolling] = useState(false);
  const [polledAt, setPolledAt] = useState("");
  const [dryRun, setDryRun] = useState(true);
  const [error, setError] = useState("");
  const configSnapshot = useSyncExternalStore(subscribeToConfig, getConfigSnapshot, () => "");
  const config = useMemo(() => parseConfigSnapshot(configSnapshot), [configSnapshot]);
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, (): Theme => "light");
  const activeLabel = nav.find((item) => item.id === active)?.label || "Control room";

  function navigate(view: OpsView) { setActive(view); setMobileNav(false); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function toggleTheme() { const next = theme === "light" ? "dark" : "light"; document.documentElement.dataset.theme = next; window.localStorage.setItem("support-lab-theme", next); window.dispatchEvent(new Event(THEME_EVENT)); }
  function updateConfig(next: LlmConfig) { const safe = { ...next } as Partial<LlmConfig>; delete safe.apiKey; window.localStorage.setItem("support-lab-config", JSON.stringify(safe)); if (next.apiKey) window.sessionStorage.setItem("support-lab-api-key", next.apiKey); else window.sessionStorage.removeItem("support-lab-api-key"); window.dispatchEvent(new Event(CONFIG_EVENT)); }

  async function poll() {
    setPolling(true); setError("");
    try {
      const response = await fetch("/api/integration", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "poll" }) });
      const payload = (await response.json()) as { tickets?: QueueTicket[]; polledAt?: string; error?: string };
      if (!response.ok || !payload.tickets) throw new Error(payload.error || "Inbox poll failed.");
      setTickets(payload.tickets); setPolledAt(new Date(payload.polledAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (pollError) { setError(pollError instanceof Error ? pollError.message : "Inbox poll failed."); }
    finally { setPolling(false); }
  }

  async function runScenario(scenario: IntegrationScenarioId) {
    setRunning(scenario); setError("");
    try {
      const response = await fetch("/api/integration", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "run", scenario, dryRun, config }) });
      const payload = (await response.json()) as { run?: IntegrationRun; error?: string };
      if (!response.ok || !payload.run) throw new Error(payload.error || "Workflow failed.");
      setRuns((current) => [payload.run!, ...current]); setActive("runs"); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (runError) { setError(runError instanceof Error ? runError.message : "Workflow failed."); }
    finally { setRunning(""); }
  }

  return (
    <div className="app-shell ops-shell">
      <div className={`mobile-drawer ${mobileNav ? "open" : ""}`}><OpsSidebar active={active} onChange={navigate} /></div>
      {mobileNav ? <button className="drawer-backdrop" onClick={() => setMobileNav(false)} aria-label="Close navigation" /> : null}
      <OpsSidebar active={active} onChange={navigate} />
      <main className="main-shell">
        <div className="mobile-bar"><button onClick={() => setMobileNav(true)} aria-label="Open navigation">☰</button><strong>{activeLabel}</strong><div><button onClick={toggleTheme} aria-label="Toggle theme">{theme === "light" ? "☾" : "☀"}</button><button onClick={() => navigate("settings")} aria-label="Open settings">⚙</button></div></div>
        <OpsHeader active={active} dryRun={dryRun} theme={theme} onTheme={toggleTheme} onSettings={() => navigate("settings")} />
        {error ? <div className="ops-global-error"><strong>Workflow error</strong><span>{error}</span><button onClick={() => setError("")} type="button">×</button></div> : null}
        {active === "control" ? <ControlRoom runs={runs} running={running} dryRun={dryRun} onRun={runScenario} onView={navigate} /> : null}
        {active === "queue" ? <QueueView tickets={tickets} polledAt={polledAt} polling={polling} running={running} onPoll={poll} onRun={runScenario} /> : null}
        {active === "runs" ? <RunsView runs={runs} /> : null}
        {active === "connectors" ? <ConnectorsView /> : null}
        {active === "settings" ? <SettingsView config={config} dryRun={dryRun} onConfig={updateConfig} onDryRun={setDryRun} /> : null}
        <footer><span>Support Lab Ops · integration-layer branch</span><span>Mock connectors only · No production side effects</span></footer>
      </main>
    </div>
  );
}
