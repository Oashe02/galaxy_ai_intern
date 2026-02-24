import type { Node, Edge } from '@xyflow/react';
import { useWorkflowStore } from '@/store/useWorkflowStore';

const EXECUTABLE_TYPES = new Set(['llm', 'cropImage', 'extractFrame']);

const SOURCE_TYPES = new Set(['text', 'uploadImage', 'uploadVideo']);

interface NodeResult {
    nodeId: string;
    name: string;
    status: 'success' | 'failed';
    ms: number;
    output?: string;
    error?: string;
}

/**
 * Topologically sort the DAG and return execution layers.
 * Each layer contains nodes whose dependencies are all in previous layers.
 * Nodes within the same layer can be triggered in parallel.
 */
function getExecutionLayers(nodes: Node[], edges: Edge[]): Node[][] {
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();
    const nodeMap = new Map<string, Node>();

    for (const n of nodes) {
        inDegree.set(n.id, 0);
        adj.set(n.id, []);
        nodeMap.set(n.id, n);
    }

    for (const e of edges) {
        adj.get(e.source)?.push(e.target);
        inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
    }

    const layers: Node[][] = [];
    let queue = nodes.filter(n => (inDegree.get(n.id) ?? 0) === 0);

    while (queue.length > 0) {
        layers.push(queue);
        const nextQueue: Node[] = [];
        for (const n of queue) {
            for (const target of adj.get(n.id) ?? []) {
                const newDeg = (inDegree.get(target) ?? 1) - 1;
                inDegree.set(target, newDeg);
                if (newDeg === 0) {
                    const tNode = nodeMap.get(target);
                    if (tNode) nextQueue.push(tNode);
                }
            }
        }
        queue = nextQueue;
    }

    return layers;
}

/**
 * Wait for a node to reach a terminal state (success or failed).
 * Returns a promise that resolves when the node's runState changes.
 */
function waitForNode(nodeId: string): Promise<'success' | 'failed'> {
    return new Promise((resolve) => {
        const check = () => {
            const state = useWorkflowStore.getState().runState[nodeId];
            if (state === 'success') return resolve('success');
            if (state === 'failed') return resolve('failed');
            setTimeout(check, 500);
        };
        check();
    });
}

export type RunScope = 'full' | 'single' | 'partial';

export interface DagRunResult {
    success: boolean;
    status: 'success' | 'failed' | 'partial';
    runType: RunScope;
    duration: number;
    nodeResults: NodeResult[];
}

/**
 * Run all specified nodes through the DAG in topological order.
 * Source nodes (text, image, video) resolve instantly.
 * Executable nodes are triggered via a window CustomEvent that each node's useEffect listens for.
 * Nodes in the same layer run in parallel; the next layer waits for all current layer nodes.
 */
export async function runDAG(
    targetNodes: Node[],
    edges: Edge[],
    scope: RunScope,
): Promise<DagRunResult> {
    const store = useWorkflowStore.getState();
    const startTime = Date.now();

    store.setRunning(true);
    store.patchMeta({ status: 'running' });
    for (const n of targetNodes) {
        store.setRunState(n.id, 'idle');
    }

    const layers = getExecutionLayers(targetNodes, edges);
    const nodeResults: NodeResult[] = [];

    const promises = new Map<string, Promise<void>>();

    const executeNode = async (node: Node) => {
        const nodeStart = Date.now();
        const nodeLabel = (node.data?.label as string) || node.type || node.id;

        if (SOURCE_TYPES.has(node.type ?? '')) {
            store.setRunState(node.id, 'success');
            store.pushLog({ nodeId: node.id, name: nodeLabel, status: 'success', ms: 0 });
            nodeResults.push({
                nodeId: node.id,
                name: nodeLabel,
                status: 'success',
                ms: 0,
                output: (node.data?.text as string) || (node.data?.imageUrl as string) || (node.data?.videoUrl as string) || '',
            });
            return;
        }

        if (EXECUTABLE_TYPES.has(node.type ?? '')) {
            window.dispatchEvent(new CustomEvent('node:run', { detail: { id: node.id } }));
            const finalState = await waitForNode(node.id);
            const elapsed = Date.now() - nodeStart;

            const updatedNode = useWorkflowStore.getState().nodes.find(n => n.id === node.id);
            const output = (updatedNode?.data?.result as string) || '';

            store.pushLog({
                nodeId: node.id,
                name: nodeLabel,
                status: finalState,
                ms: elapsed,
                out: finalState === 'success' ? output.substring(0, 200) : undefined,
                err: finalState === 'failed' ? output : undefined,
            });

            nodeResults.push({
                nodeId: node.id,
                name: nodeLabel,
                status: finalState,
                ms: elapsed,
                output: finalState === 'success' ? output : undefined,
                error: finalState === 'failed' ? output : undefined,
            });
            return;
        }

        store.setRunState(node.id, 'success');
        nodeResults.push({ nodeId: node.id, name: nodeLabel, status: 'success', ms: 0 });
    };
    for (const layer of layers) {
        for (const node of layer) {
            const upstreams = edges
                .filter(e => e.target === node.id)
                .map(e => promises.get(e.source))
                .filter(Boolean) as Promise<void>[];
            const taskPromise = Promise.all(upstreams).then(() => executeNode(node));
            promises.set(node.id, taskPromise);
        }
    }

    await Promise.all(targetNodes.map(n => promises.get(n.id)));

    const totalDuration = Date.now() - startTime;
    const anyFailed = nodeResults.some(r => r.status === 'failed');
    const allFailed = nodeResults.filter(r => EXECUTABLE_TYPES.has('')).every(r => r.status === 'failed');
    const finalStatus = anyFailed ? (allFailed ? 'failed' : 'partial') : 'success';

    store.setRunning(false);
    store.patchMeta({ status: finalStatus === 'success' ? 'done' : 'error' });

    return {
        success: finalStatus === 'success',
        status: finalStatus,
        runType: scope,
        duration: totalDuration,
        nodeResults,
    };
}

export async function recordRunHistory(workflowId: string, result: DagRunResult) {
    try {
        await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                workflowId,
                status: result.status,
                runType: result.runType,
                duration: result.duration,
                nodes: result.nodeResults,
            }),
        });
    } catch (e) {
        console.error('Failed to record history:', e);
    }
}
