import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import type { runLLMTask } from "@/trigger/runLLM";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { model, systemPrompt, userMessage, images, temperature } = body;

        if (!userMessage) {
            return NextResponse.json({ error: "userMessage is required" }, { status: 400 });
        }

        const handle = await tasks.trigger<typeof runLLMTask>("run-llm", {
            model: model || "gemini-2.0-flash",
            systemPrompt,
            userMessage,
            images,
            temperature,
        });

        return NextResponse.json({ id: handle.id, status: "triggered" });
    } catch (err: any) {
        console.error("LLM trigger error:", err);
        return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
    }
}
