import { NextResponse } from "next/server";
import { executeIntegrationScenario } from "@/lib/integration-runner";
import { defaultConfig } from "@/lib/support-data";

export async function GET(request: Request) {
  const configuredSecret = process.env.CRON_SECRET;
  if (configuredSecret && request.headers.get("authorization") !== `Bearer ${configuredSecret}`) {
    return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  const run = await executeIntegrationScenario({
    scenario: "weekly_qa",
    dryRun: false,
    config: defaultConfig,
  });
  return NextResponse.json({ run, scheduled: true, sandbox: true });
}
