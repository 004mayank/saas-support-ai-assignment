import { NextResponse } from "next/server";
import { executeModelTask, type ModelRunRequest } from "@/lib/llm-runner";
import { systemPrompts } from "@/lib/support-data";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ModelRunRequest;
    if (!body.config || !body.task || !(body.task in systemPrompts)) {
      return NextResponse.json({ error: "Invalid run request." }, { status: 400 });
    }
    return NextResponse.json(await executeModelTask(body));
  } catch (error) {
    const message = error instanceof Error ? error.message : "The model request failed.";
    return NextResponse.json({ error: message.slice(0, 600) }, { status: 502 });
  }
}
