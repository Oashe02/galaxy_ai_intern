import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import type { extractFrameTask } from "@/trigger/extractFrame";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { videoUrl, timestamp, unit } = body;

        if (!videoUrl) {
            return NextResponse.json({ error: "videoUrl is required" }, { status: 400 });
        }

        const handle = await tasks.trigger<typeof extractFrameTask>("extract-frame", {
            videoUrl,
            timestamp: timestamp ?? 0,
            unit: unit ?? "sec",
        });

        return NextResponse.json({ id: handle.id, status: "triggered" });
    } catch (err: any) {
        console.error("Extract frame trigger error:", err);
        return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
    }
}
