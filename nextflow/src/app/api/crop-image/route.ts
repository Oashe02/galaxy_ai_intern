import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import type { cropImageTask } from "@/trigger/cropImage";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { imageUrl, x, y, w, h } = body;

        if (!imageUrl) {
            return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
        }

        const handle = await tasks.trigger<typeof cropImageTask>("crop-image", {
            imageUrl,
            x: x ?? 0,
            y: y ?? 0,
            w: w ?? 100,
            h: h ?? 100,
        });

        return NextResponse.json({ id: handle.id, status: "triggered" });
    } catch (err: any) {
        console.error("Crop trigger error:", err);
        return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
    }
}
