import {
  demoOutputs,
  systemPrompts,
  type LlmConfig,
  type WorkspaceId,
} from "@/lib/support-data";

export type RunTask = WorkspaceId | "connection_test";

export type ModelRunRequest = {
  task: RunTask;
  input?: string;
  context?: string;
  config: LlmConfig;
};

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

async function readError(response: Response) {
  const body = await response.text();
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string }; message?: string };
    return parsed.error?.message || parsed.message || body;
  } catch {
    return body;
  }
}

function userPrompt(task: RunTask, input = "", context = "") {
  if (task === "connection_test") return "Confirm this provider connection.";
  return `INPUT\n${input}\n\nSUPPLIED CONTEXT\n${context || "None"}`;
}

export function validateModelConfig(config: LlmConfig) {
  if (config.mode === "demo") return;
  if (!config.baseUrl || !config.model) {
    throw new Error("Base URL and model are required for live mode.");
  }
  if (config.provider !== "ollama" && !config.apiKey) {
    throw new Error("An API key is required for this provider.");
  }
}

export async function runOpenAiCompatible(body: ModelRunRequest) {
  const { config, task, input, context } = body;
  const response = await fetch(joinUrl(config.baseUrl, "/chat/completions"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {}),
      ...(config.provider === "openrouter"
        ? { "HTTP-Referer": "https://support-lab.invalid", "X-Title": "Support Lab Ops" }
        : {}),
    },
    body: JSON.stringify({
      model: config.model,
      temperature: config.temperature,
      messages: [
        { role: "system", content: systemPrompts[task] },
        { role: "user", content: userPrompt(task, input, context) },
      ],
    }),
  });
  if (!response.ok) throw new Error(await readError(response));
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((part) => part.text || "").join("");
  throw new Error("The provider returned no text content.");
}

export async function runAnthropic(body: ModelRunRequest) {
  const { config, task, input, context } = body;
  const response = await fetch(joinUrl(config.baseUrl, "/messages"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 1800,
      temperature: config.temperature,
      system: systemPrompts[task],
      messages: [{ role: "user", content: userPrompt(task, input, context) }],
    }),
  });
  if (!response.ok) throw new Error(await readError(response));
  const data = (await response.json()) as { content?: Array<{ text?: string }> };
  const output = data.content?.map((part) => part.text || "").join("");
  if (!output) throw new Error("Anthropic returned no text content.");
  return output;
}

export async function runGoogle(body: ModelRunRequest) {
  const { config, task, input, context } = body;
  const endpoint = joinUrl(
    config.baseUrl,
    `/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`,
  );
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompts[task] }] },
      contents: [{ role: "user", parts: [{ text: userPrompt(task, input, context) }] }],
      generationConfig: { temperature: config.temperature, maxOutputTokens: 1800 },
    }),
  });
  if (!response.ok) throw new Error(await readError(response));
  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const output = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("");
  if (!output) throw new Error("Google returned no text content.");
  return output;
}

export async function executeModelTask(body: ModelRunRequest) {
  validateModelConfig(body.config);
  if (body.config.mode === "demo") {
    return { output: demoOutputs[body.task], source: "demo" };
  }

  let output: string;
  if (body.config.provider === "anthropic") output = await runAnthropic(body);
  else if (body.config.provider === "google") output = await runGoogle(body);
  else output = await runOpenAiCompatible(body);

  return { output, source: body.config.provider };
}
