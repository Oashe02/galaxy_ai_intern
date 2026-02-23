import { NextRequest, NextResponse } from "next/server";
import { runs } from "@trigger.dev/sdk/v3";

export async function GET(req: NextRequest) {
    try {
        const runId = req.nextUrl.searchParams.get("id");
        if (!runId) {
            return NextResponse.json({ error: "id param required" }, { status: 400 });
        }

        const run = await runs.retrieve(runId);

        return NextResponse.json({
            id: run.id,
            status: run.status,
            output: run.output,
            finishedAt: run.finishedAt,
        });
    } catch (err: any) {
        console.error("Run status error:", err);
        return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
    }
}
