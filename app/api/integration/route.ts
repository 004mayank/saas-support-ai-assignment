import { NextResponse } from "next/server";
import {
  integrationScenarios,
  mockQueueTickets,
  type IntegrationScenarioId,
} from "@/lib/integration-data";
import { executeIntegrationScenario } from "@/lib/integration-runner";
import type { LlmConfig } from "@/lib/support-data";

type IntegrationRequest = {
  action: "poll" | "run";
  scenario?: IntegrationScenarioId;
  ticketId?: string;
  dryRun?: boolean;
  config?: LlmConfig;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as IntegrationRequest;
    if (body.action === "poll") {
      return NextResponse.json({
        tickets: mockQueueTickets,
        criticalCount: mockQueueTickets.filter((ticket) => ticket.priority === "Critical").length,
        polledAt: new Date().toISOString(),
        sandbox: true,
      });
    }
    if (body.action !== "run" || !body.scenario || !integrationScenarios.some((item) => item.id === body.scenario)) {
      return NextResponse.json({ error: "Invalid integration request." }, { status: 400 });
    }
    return NextResponse.json({
      run: await executeIntegrationScenario({
        scenario: body.scenario,
        ticketId: body.ticketId,
        dryRun: body.dryRun,
        config: body.config,
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The integration run failed.";
    const status = message.includes("required") || message.includes("valid") ? 400 : 502;
    return NextResponse.json({ error: message.slice(0, 600) }, { status });
  }
}
