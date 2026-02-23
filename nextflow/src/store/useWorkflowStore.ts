import { create } from 'zustand';
import {
    type Edge,
    type Node,
    type OnNodesChange,
    type OnEdgesChange,
    type OnConnect,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    type Connection,
    type Viewport,
} from '@xyflow/react';

export type RunStatus = 'idle' | 'queued' | 'running' | 'success' | 'failed';

export interface LogEntry {
    id: string;
    nodeId: string;
    name: string;
    status: RunStatus;
    ts: number;
    ms?: number;
    err?: string;
    out?: string;
}

export interface WfMeta {
    id: string;
    name: string;
    desc: string;
    created: number;
    modified: number;
    status: 'draft' | 'saved' | 'running' | 'done' | 'error';
}

// handle type map — defines what type each handle carries
export const HANDLE_TYPES: Record<string, Record<string, string>> = {
    text: { text: 'text' },
    uploadImage: { image: 'image' },
    uploadVideo: { video: 'video' },
    llm: { system_prompt: 'text', user_message: 'text', images: 'image', output: 'text' },
    cropImage: { image: 'image', output: 'image' },
    extractFrame: { video: 'video', output: 'image' },
};

export function getHandleType(nodeType: string, handleId: string): string {
    return HANDLE_TYPES[nodeType]?.[handleId] ?? 'any';
}

interface Store {
    nodes: Node[];
    edges: Edge[];
    vp: Viewport;
    selected: string[];
    selectedEdges: string[];
    runState: Record<string, RunStatus>;
    logs: LogEntry[];
    running: boolean;
    meta: WfMeta;
    sidebarOpen: boolean;
    historyOpen: boolean;
    query: string;

    handleNodesChange: OnNodesChange;
    handleEdgesChange: OnEdgesChange;
    handleConnect: OnConnect;
    setViewport: (vp: Viewport) => void;

    setNodes: (n: Node[]) => void;
    addNode: (n: Node) => void;
    removeNode: (id: string) => void;
    updateNode: (id: string, data: Partial<Record<string, unknown>>) => void;
    cloneNode: (id: string) => void;

    setEdges: (e: Edge[]) => void;
    dropEdge: (id: string) => void;

    handleSelectionChange: (p: { nodes: Node[]; edges: Edge[] }) => void;
    select: (ids: string[]) => void;
    deselect: () => void;

    setRunState: (id: string, s: RunStatus) => void;
    pushLog: (entry: Omit<LogEntry, 'id' | 'ts'>) => void;
    clearLogs: () => void;
    setRunning: (v: boolean) => void;
    resetRuns: () => void;

    patchMeta: (m: Partial<WfMeta>) => void;
    rename: (name: string) => void;

    toggleSidebar: () => void;
    toggleHistory: () => void;
    setQuery: (q: string) => void;
    nuke: () => void;
    deleteSelected: () => void;

    isHandleConnected: (nodeId: string, handleId: string, type: 'source' | 'target') => boolean;
}

const freshMeta = (): WfMeta => ({
    id: `wf-${Date.now()}`,
    name: 'Untitled Workflow',
    desc: '',
    created: Date.now(),
    modified: Date.now(),
    status: 'draft',
});

export const useWorkflowStore = create<Store>()(
    (set, get) => ({
        nodes: [],
        edges: [],
        vp: { x: 0, y: 0, zoom: 1 },
        selected: [],
        selectedEdges: [],
        runState: {},
        logs: [],
        running: false,
        meta: freshMeta(),
        sidebarOpen: true,
        historyOpen: true,
        query: '',

        handleNodesChange: (changes) => {
            set({ nodes: applyNodeChanges(changes, get().nodes) });
        },

        handleEdgesChange: (changes) => {
            set({ edges: applyEdgeChanges(changes, get().edges) });
        },

        handleConnect: (conn: Connection) => {
            // type-safe check before connecting
            const { nodes } = get();
            const src = nodes.find(n => n.id === conn.source);
            const tgt = nodes.find(n => n.id === conn.target);
            if (!src || !tgt || !conn.sourceHandle || !conn.targetHandle) return;

            const srcType = getHandleType(src.type ?? '', conn.sourceHandle);
            const tgtType = getHandleType(tgt.type ?? '', conn.targetHandle);
            if (srcType !== tgtType && srcType !== 'any' && tgtType !== 'any') return;

            set({
                edges: addEdge({
                    ...conn,
                    animated: true,
                    style: { stroke: '#8B5CF6', strokeWidth: 2.5 },
                    type: 'smoothstep',
                }, get().edges),
            });
        },

        setViewport: (vp) => set({ vp }),

        setNodes: (nodes) => set({ nodes }),

        addNode: (n) => {
            set((s) => ({
                nodes: [...s.nodes, n],
                meta: { ...s.meta, modified: Date.now() },
            }));
        },

        removeNode: (id) => {
            set((s) => {
                const rs = { ...s.runState };
                delete rs[id];
                return {
                    nodes: s.nodes.filter(n => n.id !== id),
                    edges: s.edges.filter(e => e.source !== id && e.target !== id),
                    selected: s.selected.filter(x => x !== id),
                    runState: rs,
                    meta: { ...s.meta, modified: Date.now() },
                };
            });
        },

        updateNode: (id, data) => {
            set((s) => ({
                nodes: s.nodes.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n),
                meta: { ...s.meta, modified: Date.now() },
            }));
        },

        cloneNode: (id) => {
            const { nodes } = get();
            const orig = nodes.find(n => n.id === id);
            if (!orig) return;
            const copy: Node = {
                ...orig,
                id: `${orig.type}-${Date.now()}`,
                position: { x: orig.position.x + 50, y: orig.position.y + 50 },
                selected: false,
                data: { ...orig.data },
            };
            set((s) => ({
                nodes: [...s.nodes, copy],
                meta: { ...s.meta, modified: Date.now() },
            }));
        },

        setEdges: (edges) => set({ edges }),

        dropEdge: (id) => {
            set((s) => ({
                edges: s.edges.filter(e => e.id !== id),
                meta: { ...s.meta, modified: Date.now() },
            }));
        },

        handleSelectionChange: ({ nodes, edges }) => {
            set({
                selected: nodes.map(n => n.id),
                selectedEdges: edges.map(e => e.id),
            });
        },

        select: (ids) => set({ selected: ids }),
        deselect: () => set({ selected: [], selectedEdges: [] }),

        setRunState: (id, status) => {
            set((s) => ({ runState: { ...s.runState, [id]: status } }));
        },

        pushLog: (entry) => {
            const log: LogEntry = {
                ...entry,
                id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                ts: Date.now(),
            };
            set((s) => ({ logs: [log, ...s.logs].slice(0, 100) }));
        },

        clearLogs: () => set({ logs: [] }),
        setRunning: (v) => set({ running: v }),

        resetRuns: () => {
            set((s) => ({
                runState: Object.keys(s.runState).reduce(
                    (acc, k) => ({ ...acc, [k]: 'idle' as const }),
                    {} as Record<string, RunStatus>
                ),
                running: false,
            }));
        },

        patchMeta: (m) => {
            set((s) => ({ meta: { ...s.meta, ...m, modified: Date.now() } }));
        },

        rename: (name) => {
            set((s) => ({ meta: { ...s.meta, name, modified: Date.now() } }));
        },

        toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
        toggleHistory: () => set((s) => ({ historyOpen: !s.historyOpen })),
        setQuery: (q) => set({ query: q }),

        nuke: () => {
            set({
                nodes: [], edges: [], selected: [], selectedEdges: [],
                runState: {}, logs: [], running: false, meta: freshMeta(),
            });
        },

        deleteSelected: () => {
            const s = get();
            const ids = new Set(s.selected);
            const rs = { ...s.runState };
            s.selected.forEach(id => delete rs[id]);
            set({
                nodes: s.nodes.filter(n => !ids.has(n.id)),
                edges: s.edges.filter(e => !ids.has(e.source) && !ids.has(e.target)),
                selected: [],
                runState: rs,
                meta: { ...s.meta, modified: Date.now() },
            });
        },

        isHandleConnected: (nodeId, handleId, type) => {
            const { edges } = get();
            if (type === 'target') {
                return edges.some(e => e.target === nodeId && e.targetHandle === handleId);
            }
            return edges.some(e => e.source === nodeId && e.sourceHandle === handleId);
        },
    })
);
