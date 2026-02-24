import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const workflowId = url.searchParams.get("workflowId");

        const history = await prisma.workflowRun.findMany({
            where: {
                userId,
                ...(workflowId ? { workflowId } : {})
            },
            include: {
                nodeRuns: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ history });
    } catch (err: any) {
        console.error("GET history error:", err);
        return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        // `runType` comes from old `recordRunHistory` payload, fallback to mapping it to `scope`
        const { workflowId, status, runType, scope, duration, nodes } = body;

        if (!workflowId) {
            return NextResponse.json({ error: "workflowId required" }, { status: 400 });
        }

        const runScope = scope || runType || 'full';

        const newRun = await prisma.workflowRun.create({
            data: {
                userId,
                workflowId,
                status: status || 'success',
                scope: runScope,
                duration: duration || 0,
                nodeRuns: {
                    create: (nodes || []).map((n: any) => ({
                        nodeId: n.nodeId,
                        nodeType: n.name, // The task is using `name` for type/label representation loosely
                        status: n.status,
                        duration: n.ms,
                        outputs: n.output ? { result: n.output } : null,
                        error: n.error || null
                    }))
                }
            },
            include: {
                nodeRuns: true
            }
        });

        return NextResponse.json({ success: true, run: newRun });
    } catch (err: any) {
        console.error("POST history error:", err);
        return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
    }
}
