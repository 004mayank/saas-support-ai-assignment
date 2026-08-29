import { NextResponse } from "next/server";
import {
  demoOutputs,
  systemPrompts,
  type LlmConfig,
  type WorkspaceId,
} from "@/lib/support-data";

type RunTask = WorkspaceId | "connection_test";

type RunRequest = {
  task: RunTask;
  input?: string;
  context?: string;
  config: LlmConfig;
};

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

async function readError(response: Response) {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text) as { error?: { message?: string }; message?: string };
    return parsed.error?.message || parsed.message || text;
  } catch {
    return text;
  }
}

function userPrompt(task: RunTask, input = "", context = "") {
  if (task === "connection_test") return "Confirm this provider connection.";
  return `INPUT\n${input}\n\nSUPPLIED CONTEXT\n${context || "None"}`;
}

async function runOpenAiCompatible(body: RunRequest) {
  const { config, task, input, context } = body;
  const response = await fetch(joinUrl(config.baseUrl, "/chat/completions"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {}),
      ...(config.provider === "openrouter"
        ? { "HTTP-Referer": "https://support-lab.invalid", "X-Title": "Support Lab" }
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

async function runAnthropic(body: RunRequest) {
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
  const text = data.content?.map((part) => part.text || "").join("");
  if (!text) throw new Error("Anthropic returned no text content.");
  return text;
}

async function runGoogle(body: RunRequest) {
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
  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("");
  if (!text) throw new Error("Google returned no text content.");
  return text;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RunRequest;
    if (!body.config || !body.task || !(body.task in systemPrompts)) {
      return NextResponse.json({ error: "Invalid run request." }, { status: 400 });
    }
    if (body.config.mode === "demo") {
      return NextResponse.json({ output: demoOutputs[body.task], source: "demo" });
    }
    if (!body.config.baseUrl || !body.config.model) {
      return NextResponse.json(
        { error: "Base URL and model are required for live mode." },
        { status: 400 },
      );
    }
    if (body.config.provider !== "ollama" && !body.config.apiKey) {
      return NextResponse.json(
        { error: "An API key is required for this provider." },
        { status: 400 },
      );
    }

    let output: string;
    if (body.config.provider === "anthropic") output = await runAnthropic(body);
    else if (body.config.provider === "google") output = await runGoogle(body);
    else output = await runOpenAiCompatible(body);

    return NextResponse.json({ output, source: body.config.provider });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The model request failed.";
    return NextResponse.json({ error: message.slice(0, 600) }, { status: 502 });
  }
}
