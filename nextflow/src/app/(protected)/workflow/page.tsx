'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import WorkflowCanvas from '@/components/canvas/WorkflowCanvas';
import { useWorkflowStore, type LogEntry } from '@/store/useWorkflowStore';
import { useSearchParams } from 'next/navigation';
import { 
  Search, Play, History, Type, Image as ImageIcon, Video, Layers, Settings, 
  Crop, Share2, Plus, SlidersHorizontal, Maximize2, Sparkles, 
  Box, Workflow, Wand2, Scissors, Home, Pen, Film, Zap, Save, Loader2,
  ChevronDown, ChevronRight, Clock, CheckCircle2, XCircle, AlertTriangle,
  Download, Upload as UploadIcon, RefreshCw
} from 'lucide-react';
import { ReactFlowProvider } from '@xyflow/react';
import Link from 'next/link';
import { runDAG, recordRunHistory, type DagRunResult } from '@/lib/dagRunner';
import { toast } from 'sonner';

const NODE_TYPES = [
  { name: 'Text Node', icon: Type, type: 'text', color: 'text-blue-400' },
  { name: 'Upload Image', icon: ImageIcon, type: 'uploadImage', color: 'text-green-400' },
  { name: 'Upload Video', icon: Video, type: 'uploadVideo', color: 'text-red-400' },
  { name: 'Run Any LLM', icon: Play, type: 'llm', color: 'text-purple-400' },
  { name: 'Crop Image', icon: Crop, type: 'cropImage', color: 'text-orange-400' },
  { name: 'Extract Frame', icon: Share2, type: 'extractFrame', color: 'text-cyan-400' },
];

type View = 'dashboard' | 'canvas';


export function WorkflowContent() {
  const [view, setView] = useState<View>('dashboard');
  const [prompt, setPrompt] = useState('');
  const addNode = useWorkflowStore(s => s.addNode);
  const wfMeta = useWorkflowStore(s => s.meta);
  const renameFn = useWorkflowStore(s => s.rename);
  const nodes = useWorkflowStore(s => s.nodes);
  const edges = useWorkflowStore(s => s.edges);
  const isRunning = useWorkflowStore(s => s.running);
  const logs = useWorkflowStore(s => s.logs);
  const clearLogs = useWorkflowStore(s => s.clearLogs);
  const selected = useWorkflowStore(s => s.selected);

  const [isSaving, setIsSaving] = useState(false);
  const patchMeta = useWorkflowStore(s => s.patchMeta);

  const setNodes = useWorkflowStore(s => s.setNodes);
  const setEdges = useWorkflowStore(s => s.setEdges);
  const nuke = useWorkflowStore(s => s.nuke);
  const pushLog = useWorkflowStore(s => s.pushLog);

  // Persistent history from DB
  const [dbHistory, setDbHistory] = useState<any[]>([]);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt');
  const [hasIngestedPrompt, setHasIngestedPrompt] = useState(false);

  useEffect(() => {
    if (initialPrompt && !hasIngestedPrompt) {
      addNode({
        id: `prompt-${Date.now()}`,
        type: 'text',
        position: { x: 400, y: 300 },
        data: { 
          text: initialPrompt, 
          label: 'Prompt from Landing' 
        }
      });
      setHasIngestedPrompt(true);
      setView('canvas');
    }
  }, [initialPrompt, hasIngestedPrompt, addNode]);

  // Load existing workflow + history on mount
  useEffect(() => {
    async function loadData() {
      try {
        const wfRes = await fetch('/api/workflows');
        const wfData = await wfRes.json();
        const latestWf = wfData.workflows?.[0];

        if (latestWf) {
           patchMeta({ id: latestWf.id, name: latestWf.name, desc: latestWf.desc || '', status: 'saved' });
           setNodes(latestWf.nodes || []);
           setEdges(latestWf.edges || []);
        } else {
           patchMeta({ id: 'wf-default', name: 'Product Marketing Kit Generator', desc: 'Auto-generated multimodal flow demonstrating parallel node execution', status: 'draft' });
           setNodes([
             // Branch A: Image + Text -> LLM #1
             { id: 'img-product', type: 'uploadImage', position: { x: 50, y: 50 }, data: { label: 'Upload Product Photo' } },
             { id: 'crop-product', type: 'cropImage', position: { x: 350, y: 50 }, data: { label: 'Crop Photo', cropX: 10, cropY: 10, cropW: 80, cropH: 80 } },
             { id: 'txt-sys-desc', type: 'text', position: { x: 50, y: 250 }, data: { label: 'System Prompt', text: 'You are a professional marketing copywriter. Generate a compelling one-paragraph product description.' } },
             { id: 'txt-user-desc', type: 'text', position: { x: 50, y: 400 }, data: { label: 'Product Details', text: 'Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design.' } },
             { id: 'llm-desc', type: 'llm', position: { x: 700, y: 150 }, data: { label: 'Generate Description (LLM #1)', model: 'gemini-2.5-flash', temperature: 0.7 } },
             
             // Branch B: Video -> Extract Frame
             { id: 'vid-product', type: 'uploadVideo', position: { x: 50, y: 650 }, data: { label: 'Upload Demo Video' } },
             { id: 'ext-frame', type: 'extractFrame', position: { x: 350, y: 650 }, data: { label: 'Extract Frame from Video', timestamp: 50, timestampUnit: 'pct' } },

             // Convergence: LLM #2
             { id: 'txt-sys-post', type: 'text', position: { x: 700, y: 600 }, data: { label: 'System Promo', text: 'You are a social media manager. Create a tweet-length marketing post based on the product image and video frame.' } },
             { id: 'llm-post', type: 'llm', position: { x: 1150, y: 350 }, data: { label: 'Final Marketing Summary (LLM #2)', model: 'gemini-2.5-flash', temperature: 0.8 } }
           ]);
           setEdges([
             // Branch A edges
             { id: 'e-img-crop', source: 'img-product', target: 'crop-product', sourceHandle: 'image', targetHandle: 'image', animated: true },
             { id: 'e-sys-desc', source: 'txt-sys-desc', target: 'llm-desc', sourceHandle: 'text', targetHandle: 'system_prompt', animated: true },
             { id: 'e-usr-desc', source: 'txt-user-desc', target: 'llm-desc', sourceHandle: 'text', targetHandle: 'user_message', animated: true },
             { id: 'e-crop-desc', source: 'crop-product', target: 'llm-desc', sourceHandle: 'output', targetHandle: 'images', animated: true },

             // Branch B edges
             { id: 'e-vid-ext', source: 'vid-product', target: 'ext-frame', sourceHandle: 'video', targetHandle: 'video', animated: true },

             // Convergence edges
             { id: 'e-sys-post', source: 'txt-sys-post', target: 'llm-post', sourceHandle: 'text', targetHandle: 'system_prompt', animated: true },
             { id: 'e-desc-post', source: 'llm-desc', target: 'llm-post', sourceHandle: 'output', targetHandle: 'user_message', animated: true },
             { id: 'e-crop-post', source: 'crop-product', target: 'llm-post', sourceHandle: 'output', targetHandle: 'images', animated: true },
             { id: 'e-ext-post', source: 'ext-frame', target: 'llm-post', sourceHandle: 'output', targetHandle: 'images', animated: true }
           ]);
        }

        const hRes = await fetch('/api/history');
        const hData = await hRes.json();
        if (hData.history) setDbHistory(hData.history);
      } catch (e) {}
    }
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshHistory = useCallback(async () => {
    try {
      const hRes = await fetch('/api/history');
      const hData = await hRes.json();
      if (hData.history) setDbHistory(hData.history);
    } catch (e) {}
  }, []);

  const handleSaveWorkflow = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: wfMeta.id.startsWith('wf-') ? undefined : wfMeta.id,
          name: wfMeta.name,
          desc: wfMeta.desc,
          nodes,
          edges,
        })
      });
      const data = await res.json();
      if (data.workflow) {
        patchMeta({ id: data.workflow.id, status: 'saved' });
      }
    } catch (err) {
      patchMeta({ status: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // === DAG Execution Handlers ===
  const autoSaveBeforeRun = async (): Promise<string | undefined> => {
    let wfId = wfMeta.id;
    try {
      const isDraft = wfId.startsWith('wf-');
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: isDraft ? undefined : wfId,
          name: wfMeta.name, 
          desc: wfMeta.desc, 
          nodes, 
          edges 
        }),
      });
      const data = await res.json();
      if (data.workflow) {
        if (isDraft) patchMeta({ id: data.workflow.id, status: 'saved' });
        wfId = data.workflow.id;
      }
    } catch (err) {
      console.error('Failed to auto-save workflow prior to run:', err);
    }
    return wfId.startsWith('wf-') ? undefined : wfId;
  };

  const handleRunWorkflow = useCallback(async () => {
    if (nodes.length === 0) return;
    try {
      const result = await runDAG(nodes, edges, 'full');
      const wfId = await autoSaveBeforeRun();
      if (wfId) {
        await recordRunHistory(wfId, result);
        refreshHistory();
      }
      if (result.success) {
        toast.success("Workflow completed successfully!");
      } else {
        toast.error("Workflow encountered errors. Check history.");
      }
    } catch (err: any) {
      toast.error(`Workflow execution failed: ${err.message}`);
    }
  }, [nodes, edges, wfMeta, patchMeta, refreshHistory]);

  const handleRunSelected = useCallback(async () => {
    const selectedNodes = nodes.filter(n => selected.includes(n.id));
    const relevantEdges = edges.filter(e => selected.includes(e.source) && selected.includes(e.target));
    if (selectedNodes.length === 0) return;
    const scope = selectedNodes.length === 1 ? 'single' : 'partial';
    
    try {
      const result = await runDAG(selectedNodes, relevantEdges, scope);
      const wfId = await autoSaveBeforeRun();
      if (wfId) {
        await recordRunHistory(wfId, result);
        refreshHistory();
      }
      if (result.success) {
        toast.success(`${scope === 'single' ? 'Node' : 'Nodes'} executed successfully!`);
      } else {
        toast.error(`Execution failed for selected nodes.`);
      }
    } catch (err: any) {
      toast.error(`Execution failed: ${err.message}`);
    }
  }, [nodes, edges, selected, wfMeta, patchMeta, refreshHistory]);

  // === Export / Import JSON ===
  const handleExport = useCallback(() => {
    const cleanNodes = nodes.map((n: any) => {
      const d = { ...n.data };
      if (typeof d.imageUrl === 'string' && d.imageUrl.startsWith('data:')) { d.imageUrl = null; d.hadImage = true; }
      if (typeof d.videoUrl === 'string' && d.videoUrl.startsWith('data:')) { d.videoUrl = null; d.hadVideo = true; }
      if (typeof d.result === 'string' && d.result.startsWith('data:')) { d.result = null; d.hadResult = true; }
      return { ...n, data: d };
    });

    const data = { nodes: cleanNodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        if (data.nodes) setNodes(data.nodes);
        if (data.edges) setEdges(data.edges);
        
        // Generate a new ID so imported flows don't overwrite existing db items
        patchMeta({ 
          id: `wf-import-${Date.now()}`, 
          name: data.name || 'Imported Workflow', 
          status: 'draft' 
        });
        
        setView('canvas');
      } catch (err) {
        console.error('Invalid JSON file');
      }
    };
    input.click();
  }, [setNodes, setEdges, renameFn, patchMeta]);

  const handleAddNode = (nodeName: string, type: string) => {
    const id = `${type}-${Date.now()}`;
    addNode({
      id,
      type: type,
      position: { x: 400 + Math.random() * 100, y: 300 + Math.random() * 100 },
      data: { label: nodeName, text: '' },
    });
    setView('canvas');
  };

  if (view === 'canvas') {
    return (
      <ReactFlowProvider>
        <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-gradient-to-br from-[#0c0a15] via-black to-[#050505] text-white selection:bg-purple-500/30">
          <aside className="w-64 border-r border-white/5 flex flex-col bg-black/40 backdrop-blur-3xl shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-20">
            <div className="p-4 space-y-4">
              <button 
                onClick={() => setView('dashboard')}
                className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors mb-2"
              >
                <Home className="w-3.5 h-3.5" />
                Back to Dashboard
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Search nodes..." 
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all duration-300 placeholder:text-zinc-600 shadow-inner"
                />
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1 mb-3">Quick Access</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {NODE_TYPES.map((node) => (
                      <button 
                        key={node.name}
                        onClick={() => handleAddNode(node.name, node.type)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300 text-sm font-medium group text-zinc-300 hover:text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] hover:-translate-y-0.5"
                      >
                        <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center group-hover:bg-purple-500/10 group-hover:border-purple-500/30 transition-all duration-300 shadow-inner">
                          <node.icon className={`w-4 h-4 ${node.color} opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300`} />
                        </div>
                        {node.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-auto p-4 border-t border-white/5 text-[10px] text-zinc-500 font-medium tracking-widest bg-black/20 backdrop-blur-sm">
              NEXTFLOW v0.1.0 • ALPHA
            </div>
          </aside>

          <main className="flex-1 relative flex flex-col min-w-0">
            <div className="h-14 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-6 z-10 shadow-lg">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={wfMeta.name}
                  onChange={(e) => renameFn(e.target.value)}
                  className="text-sm font-semibold tracking-tight text-zinc-200 bg-transparent border-none outline-none focus:ring-1 focus:ring-purple-500 rounded px-1 -ml-1 max-w-[200px]"
                />
                <div className="h-4 w-px bg-white/5" />
                <span className={`text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full border transition-all duration-500 shadow-sm ${
                  wfMeta.status === 'running' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20 animate-pulse' :
                  wfMeta.status === 'done' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                  wfMeta.status === 'error' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                  'text-zinc-500 bg-white/5 border-white/5'
                }`}>
                  {wfMeta.status.toUpperCase()}
                </span>
                <span className="text-[10px] text-zinc-500 font-medium tracking-tight bg-white/5 px-2 py-1 rounded-lg border border-white/5">{nodes.length} nodes • {edges.length} edges</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={nuke}
                  className="px-4 py-1.5 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-zinc-200 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 shadow-sm hover:translate-y-[-1px]"
                  title="Create New Workflow"
                >
                  <Plus className="w-3.5 h-3.5 text-purple-400" />
                  New
                </button>
                <button 
                  onClick={handleExport}
                  className="p-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-full transition-colors"
                  title="Export JSON"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                </button>
                <button 
                  onClick={handleImport}
                  className="p-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-full transition-colors"
                  title="Import JSON"
                >
                  <UploadIcon className="w-3.5 h-3.5 text-zinc-400" />
                </button>
                <button 
                  onClick={handleSaveWorkflow}
                  disabled={isSaving}
                  className="px-5 py-1.5 bg-zinc-200 hover:bg-white text-black rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {isSaving ? 'Synchronizing...' : 'Save Draft'}
                </button>
                {selected.length > 0 && (
                  <button 
                    onClick={handleRunSelected}
                    disabled={isRunning}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full text-xs font-bold transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {isRunning ? <Loader2 className="w-3 h-3 animate-spin text-white" /> : <Play className="w-3 h-3 fill-current" />}
                    {isRunning ? 'Running...' : `Run ${selected.length === 1 ? 'Node' : `${selected.length} Nodes`}`}
                  </button>
                )}
                <button 
                  onClick={handleRunWorkflow}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-purple-500/10 active:scale-95 disabled:opacity-50"
                  disabled={isRunning || nodes.length === 0}
                >
                  {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  {isRunning ? 'Running...' : 'Run Workflow'}
                </button>
                <button className="p-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-full transition-colors">
                  <Settings className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
            </div>

            <div className="flex-1">
              <WorkflowCanvas />
            </div>
          </main>

          <aside className="w-[280px] border-l border-white/5 flex flex-col bg-black/40 backdrop-blur-3xl z-20 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <History className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-[13px] font-black text-white uppercase tracking-[0.1em]">History</h3>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Audit Log</p>
                </div>
              </div>
              <button 
                onClick={refreshHistory}
                className="p-2 hover:bg-white/5 rounded-lg transition-all text-zinc-500 hover:text-white"
                title="Refresh History"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin text-purple-400' : ''}`} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-premium">
              {/* DB-persisted history */}
              {dbHistory.length === 0 && logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
                  <div className="w-16 h-16 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6 shadow-inner">
                    <History className="w-7 h-7 text-zinc-700" />
                  </div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Matrix Empty</p>
                  <p className="text-[10px] max-w-[180px] mt-2 text-zinc-600 font-medium leading-relaxed">
                    Awaiting initial workflow execution protocol.
                  </p>
                </div>
              ) : (
                <>
                  {/* In-memory logs from current session */}
                  {logs.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-purple-400/80 uppercase tracking-[0.2em]">Live Stream</span>
                        <button onClick={clearLogs} className="text-[9px] text-zinc-600 hover:text-rose-400 font-bold uppercase transition-colors">Clear</button>
                      </div>
                      <div className="space-y-2">
                        {logs.map((log: LogEntry) => (
                          <div key={log.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl group/log hover:bg-white/[0.04] transition-all duration-300">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-bold text-zinc-300 group-hover/log:text-white transition-colors">{log.name}</span>
                              <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                  log.status === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                  log.status === 'failed' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                                  'bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                                }`} />
                                <span className={`text-[9px] font-black uppercase tracking-widest ${
                                  log.status === 'success' ? 'text-emerald-400' :
                                  log.status === 'failed' ? 'text-rose-400' :
                                  'text-purple-400'
                                }`}>{log.status}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">
                              <span>{new Date(log.ts).toLocaleTimeString()}</span>
                              {log.ms !== undefined && (
                                <>
                                  <span className="opacity-30">•</span>
                                  <span className="text-zinc-500">{(log.ms / 1000).toFixed(2)}s</span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Persisted DB runs */}
                  {dbHistory.length > 0 && (
                    <div className="space-y-4">
                      <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Archive</span>
                      <div className="space-y-2.5">
                        {dbHistory.map((run: any) => {
                          const isExpanded = expandedRun === run.id;
                          const statusIcon = run.status === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> :
                                            run.status === 'failed' ? <XCircle className="w-3.5 h-3.5 text-rose-400" /> :
                                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
                          
                          const scopeLabel = run.scope === 'full' ? 'Core Execution' :
                                            run.scope === 'single' ? 'Atomic Run' :
                                            'Partial Chain';

                          return (
                            <div key={run.id} className={`group/run border rounded-2xl overflow-hidden transition-all duration-500 ${
                              isExpanded ? 'bg-white/5 border-white/10 shadow-2xl' : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                            }`}>
                              <button
                                onClick={() => setExpandedRun(isExpanded ? null : run.id)}
                                className="w-full p-4 flex items-center justify-between text-left"
                              >
                                <div className="flex items-center gap-3.5">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 ${
                                    isExpanded ? 'bg-white/10 scale-110' : 'bg-black/40 border border-white/5'
                                  }`}>
                                    {statusIcon}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="text-[11px] font-black text-white uppercase tracking-wider">{scopeLabel}</span>
                                      {run.status === 'partial' && (
                                        <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] font-black px-1.5 py-0.5 rounded-lg uppercase tracking-widest">Partial</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">
                                      <span>{new Date(run.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                      <span className="opacity-30">•</span>
                                      <span>{new Date(run.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      <span className="opacity-30">•</span>
                                      <span className="text-zinc-400">{(run.duration / 1000).toFixed(1)}s</span>
                                    </div>
                                  </div>
                                </div>
                                <div className={`transition-transform duration-500 ${isExpanded ? 'rotate-180 text-white' : 'text-zinc-600'}`}>
                                  <ChevronDown className="w-4 h-4" />
                                </div>
                              </button>
                              
                              <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                <div className="overflow-hidden">
                                  <div className="px-4 pb-4 space-y-1.5">
                                    <div className="h-px bg-white/5 mb-3" />
                                    {(run.nodeRuns as any[])?.map((nr: any, i: number) => (
                                      <div key={i} className="flex flex-col p-2.5 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-all group/nr">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2.5">
                                            {nr.status === 'success' ? 
                                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> : 
                                              <XCircle className="w-2.5 h-2.5 text-rose-500" />
                                            }
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${nr.status === 'success' ? 'text-zinc-400 group-hover/nr:text-zinc-200' : 'text-rose-400'} transition-colors`}>
                                              {nr.nodeType || 'Processor'}
                                            </span>
                                          </div>
                                          <span className="text-[9px] font-mono text-zinc-600">{(nr.duration / 1000).toFixed(2)}s</span>
                                        </div>
                                        {nr.status === 'failed' && nr.error && (
                                          <p className="mt-2 text-[9px] text-rose-400 font-medium bg-rose-500/5 p-2 rounded-lg border border-rose-500/10 leading-relaxed">
                                            {nr.error}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                    {(!run.nodeRuns || run.nodeRuns.length === 0) && (
                                      <p className="text-[9px] text-zinc-600 text-center py-4 italic">No execution trace available</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>
        </div>
      </ReactFlowProvider>
    );
  }

  // Dashboard View (Krea-style)
  return (
    <div className="min-h-[calc(100vh-80px)] bg-black text-white overflow-y-auto">
      {/* Top Icon Navbar */}
      <div className="flex justify-center py-6">
        <div className="flex items-center bg-zinc-900/80 border border-white/10 rounded-2xl p-1.5 gap-1">
          <button className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black">
            <Home className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
            <ImageIcon className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
            <Pen className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
            <Type className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
            <Layers className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-10 pt-16 pb-20">
        <h2 className="text-center text-xl md:text-2xl font-medium text-white mb-12 tracking-tight">
          What do you want to create today?
        </h2>

        {/* Prompt Input */}
        <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5 md:p-6 backdrop-blur-sm max-w-2xl mx-auto">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe an image or change the generation type"
            className="w-full bg-transparent text-white placeholder:text-zinc-500 text-base outline-none mb-6"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1.5 text-sm text-zinc-300 bg-zinc-800 px-3 py-1.5 rounded-lg hover:bg-zinc-700 transition-colors">
                <ImageIcon className="w-4 h-4" /> Image
              </button>
              <button className="flex items-center gap-1.5 text-sm text-zinc-400 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
                <Maximize2 className="w-4 h-4" /> 16:9
              </button>
              <button className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              <button className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
            <button className="flex items-center gap-2 bg-white text-black px-5 py-2 rounded-xl text-sm font-semibold hover:bg-zinc-200 transition-colors cursor-pointer">
              <Plus className="w-4 h-4" />
              Generate
            </button>
          </div>
        </div>

        <div className="mt-16 flex gap-0">
          <div className="flex-1 min-w-0 max-w-4xl">
            <h3 className="text-base font-semibold text-white mb-6 tracking-tight">Generate</h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <FeatureItem icon={<ImageIcon className="w-5 h-5" />} label="Image" color="bg-blue-500" />
              <FeatureItem icon={<Video className="w-5 h-5" />} label="Video" color="bg-red-500" />
              <FeatureItem icon={<Sparkles className="w-5 h-5" />} label="Realtime" color="bg-teal-500" badge="NEW" />
              <FeatureItem icon={<Wand2 className="w-5 h-5" />} label="Motion Transfer" color="bg-zinc-700" />
              <FeatureItem icon={<Box className="w-5 h-5" />} label="3D Objects" color="bg-emerald-600" />
              <FeatureItem 
                icon={<Workflow className="w-5 h-5" />} 
                label="Nodes" 
                color="bg-indigo-500" 
                onClick={() => setView('canvas')}
              />
            </div>

            <h3 className="text-base font-semibold text-white mt-12 mb-6 tracking-tight">Edit</h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <FeatureItem icon={<Wand2 className="w-5 h-5" />} label="Enhancer" color="bg-purple-500" />
              <FeatureItem icon={<Pen className="w-5 h-5" />} label="Edit" color="bg-amber-500" />
              <FeatureItem icon={<Film className="w-5 h-5" />} label="Video Lipsync" color="bg-green-500" />
              <FeatureItem icon={<Zap className="w-5 h-5" />} label="Video Restyle" color="bg-rose-500" />
            </div>
          </div>

          <div className="hidden md:block w-80 shrink-0">
            <h1 className="text-xl font-semibold text-white mb-6 tracking-tight">Latest features</h1>
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 overflow-hidden bg-zinc-900/50 group cursor-pointer hover:border-white/20 transition-colors">
                <div className="aspect-[4/3] bg-gradient-to-br from-zinc-800 to-zinc-900 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">Introducing Prompt to Workflow</p>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Now you can create entire node workflows from text instructions. Try it now in Nodes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, label, color, badge, onClick }: { icon: React.ReactNode; label: string; color: string; badge?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2.5 group cursor-pointer">
      <div className="relative">
        <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center text-white group-hover:scale-105 transition-transform`}>
          {icon}
        </div>
        {badge && (
          <span className="absolute -top-2 -right-2 text-[9px] font-bold bg-teal-500 text-white px-1.5 py-0.5 rounded-full leading-none">
            {badge}
          </span>
        )}
      </div>
      <span className="text-sm text-zinc-300 group-hover:text-white transition-colors font-medium">{label}</span>
    </button>
  );
}

export default function WorkflowPage() {
  return (
    <ReactFlowProvider>
      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-black"><Loader2 className="animate-spin text-purple-500 w-10 h-10" /></div>}>
        <WorkflowContent />
      </Suspense>
    </ReactFlowProvider>
  );
}

