'use client';

import { useState, useEffect, useCallback } from 'react';
import WorkflowCanvas from '@/components/canvas/WorkflowCanvas';
import { useWorkflowStore, type LogEntry } from '@/store/useWorkflowStore';
import { 
  Search, Play, History, Type, Image as ImageIcon, Video, Layers, Settings, 
  Crop, Share2, Plus, SlidersHorizontal, Maximize2, Sparkles, 
  Box, Workflow, Wand2, Scissors, Home, Pen, Film, Zap, Save, Loader2,
  ChevronDown, ChevronRight, Clock, CheckCircle2, XCircle, AlertTriangle,
  Download, Upload as UploadIcon
} from 'lucide-react';
import { ReactFlowProvider } from '@xyflow/react';
import Link from 'next/link';
import { runDAG, recordRunHistory, type DagRunResult } from '@/lib/dagRunner';

const NODE_TYPES = [
  { name: 'Text Node', icon: Type, type: 'text', color: 'text-blue-400' },
  { name: 'Upload Image', icon: ImageIcon, type: 'uploadImage', color: 'text-green-400' },
  { name: 'Upload Video', icon: Video, type: 'uploadVideo', color: 'text-red-400' },
  { name: 'Run Any LLM', icon: Play, type: 'llm', color: 'text-purple-400' },
  { name: 'Crop Image', icon: Crop, type: 'cropImage', color: 'text-orange-400' },
  { name: 'Extract Frame', icon: Share2, type: 'extractFrame', color: 'text-cyan-400' },
];

type View = 'dashboard' | 'canvas';


export default function WorkflowPage() {
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
  const pushLog = useWorkflowStore(s => s.pushLog);

  // Persistent history from DB
  const [dbHistory, setDbHistory] = useState<any[]>([]);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

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
      // Strip base64 binary data before sending to avoid body size limits
      const cleanNodes = nodes.map((n: any) => {
        const d = { ...n.data };
        if (d.imageUrl && typeof d.imageUrl === 'string' && d.imageUrl.startsWith('data:')) {
          d.imageUrl = null;
          d.hadImage = true;
        }
        if (d.videoUrl && typeof d.videoUrl === 'string' && d.videoUrl.startsWith('data:')) {
          d.videoUrl = null;
          d.hadVideo = true;
        }
        if (d.result && typeof d.result === 'string' && d.result.startsWith('data:')) {
          d.result = null;
          d.hadResult = true;
        }
        return { ...n, data: d };
      });

      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: wfMeta.id.startsWith('wf-') ? undefined : wfMeta.id,
          name: wfMeta.name,
          desc: wfMeta.desc,
          nodes: cleanNodes,
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
    if (wfId.startsWith('wf-')) {
      try {
        const cleanNodes = nodes.map((n) => {
          const d = { ...n.data };
          if (typeof d.imageUrl === 'string' && d.imageUrl.startsWith('data:')) { d.imageUrl = null; d.hadImage = true; }
          if (typeof d.videoUrl === 'string' && d.videoUrl.startsWith('data:')) { d.videoUrl = null; d.hadVideo = true; }
          if (typeof d.result === 'string' && d.result.startsWith('data:')) { d.result = null; d.hadResult = true; }
          return { ...n, data: d };
        });
        const res = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: wfMeta.name, desc: wfMeta.desc, nodes: cleanNodes, edges }),
        });
        const data = await res.json();
        if (data.workflow) {
          patchMeta({ id: data.workflow.id, status: 'saved' });
          wfId = data.workflow.id;
        }
      } catch (err) {
        console.error('Failed to auto-save workflow prior to run:', err);
      }
    }
    return wfId.startsWith('wf-') ? undefined : wfId;
  };

  const handleRunWorkflow = useCallback(async () => {
    if (nodes.length === 0) return;
    const result = await runDAG(nodes, edges, 'full');
    // Auto record to DB
    const wfId = await autoSaveBeforeRun();
    if (wfId) {
      await recordRunHistory(wfId, result);
      refreshHistory();
    }
  }, [nodes, edges, wfMeta, patchMeta, refreshHistory]);

  const handleRunSelected = useCallback(async () => {
    const selectedNodes = nodes.filter(n => selected.includes(n.id));
    const relevantEdges = edges.filter(e => selected.includes(e.source) && selected.includes(e.target));
    if (selectedNodes.length === 0) return;
    const scope = selectedNodes.length === 1 ? 'single' : 'partial';
    const result = await runDAG(selectedNodes, relevantEdges, scope);
    
    const wfId = await autoSaveBeforeRun();
    if (wfId) {
      await recordRunHistory(wfId, result);
      refreshHistory();
    }
  }, [nodes, edges, selected, wfMeta, patchMeta, refreshHistory]);

  // === Export / Import JSON ===
  const handleExport = useCallback(() => {
    const data = { name: wfMeta.name, desc: wfMeta.desc, nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${wfMeta.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [wfMeta, nodes, edges]);

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
        if (data.name) renameFn(data.name);
        patchMeta({ status: 'draft' });
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
        <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-black text-white selection:bg-purple-500/30">
          <aside className="w-64 border-r border-zinc-900 flex flex-col bg-[#050505] z-20">
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
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-purple-500 transition-colors"
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
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-900 hover:border-zinc-700 hover:bg-zinc-900 transition-all text-sm font-medium group text-zinc-300 hover:text-white"
                      >
                        <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
                          <node.icon className={`w-4 h-4 ${node.color} opacity-70 group-hover:opacity-100 transition-all`} />
                        </div>
                        {node.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-auto p-4 border-t border-zinc-900 text-[10px] text-zinc-600 font-medium bg-black/50 backdrop-blur-sm">
              NEXTFLOW v0.1.0 • ALPHA
            </div>
          </aside>

          <main className="flex-1 relative flex flex-col">
            <div className="h-12 border-b border-zinc-900 bg-[#050505] flex items-center justify-between px-4 z-10">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={wfMeta.name}
                  onChange={(e) => renameFn(e.target.value)}
                  className="text-sm font-semibold tracking-tight text-zinc-200 bg-transparent border-none outline-none focus:ring-1 focus:ring-purple-500 rounded px-1 -ml-1 max-w-[200px]"
                />
                <div className="h-4 w-px bg-zinc-800" />
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                  wfMeta.status === 'running' ? 'text-purple-400 bg-purple-500/10 border-purple-500/30' :
                  wfMeta.status === 'done' ? 'text-green-400 bg-green-500/10 border-green-500/30' :
                  wfMeta.status === 'error' ? 'text-red-400 bg-red-500/10 border-red-500/30' :
                  'text-zinc-500 bg-zinc-900/50 border-zinc-800'
                }`}>
                  {wfMeta.status.charAt(0).toUpperCase() + wfMeta.status.slice(1)}
                </span>
                <span className="text-[10px] text-zinc-600">{nodes.length} nodes • {edges.length} edges</span>
              </div>
              
              <div className="flex items-center gap-2">
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
                  className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full text-xs font-bold transition-all flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                {selected.length > 0 && (
                  <button 
                    onClick={handleRunSelected}
                    disabled={isRunning}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full text-xs font-bold transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Run {selected.length === 1 ? 'Node' : `${selected.length} Nodes`}
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

          <aside className="w-80 border-l border-zinc-900 flex flex-col bg-[#050505] z-20">
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-purple-400" />
                Workflow History
              </h3>
              <button 
                onClick={refreshHistory}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Refresh
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {/* DB-persisted history */}
              {dbHistory.length === 0 && logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                    <History className="w-6 h-6 text-zinc-700" />
                  </div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No history yet</p>
                  <p className="text-[10px] max-w-[180px] mt-2 text-zinc-600 leading-relaxed font-medium">
                    Executions will appear here after you run your workflow.
                  </p>
                </div>
              ) : (
                <>
                  {/* In-memory logs from current session */}
                  {logs.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Current Session</span>
                        <button onClick={clearLogs} className="text-[9px] text-zinc-600 hover:text-zinc-400 transition-colors">Clear</button>
                      </div>
                      {logs.map((log: LogEntry) => (
                        <div key={log.id} className="p-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg mb-1.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-medium text-zinc-300">{log.name}</span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${
                              log.status === 'success' ? 'text-green-400' :
                              log.status === 'failed' ? 'text-red-400' :
                              log.status === 'running' ? 'text-purple-400' :
                              'text-zinc-500'
                            }`}>{log.status}</span>
                          </div>
                          <span className="text-[10px] text-zinc-600">
                            {new Date(log.ts).toLocaleTimeString()}
                            {log.ms ? ` • ${(log.ms / 1000).toFixed(1)}s` : ''}
                          </span>
                          {log.out && <p className="text-[10px] text-zinc-500 mt-1 truncate">{log.out}</p>}
                          {log.err && <p className="text-[10px] text-red-400 mt-1 truncate">{log.err}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Persisted DB runs */}
                  {dbHistory.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Past Runs</span>
                      {dbHistory.map((run: any) => {
                        const isExpanded = expandedRun === run.id;
                        const statusIcon = run.status === 'success' ? <CheckCircle2 className="w-3 h-3 text-green-400" /> :
                                          run.status === 'failed' ? <XCircle className="w-3 h-3 text-red-400" /> :
                                          <AlertTriangle className="w-3 h-3 text-yellow-400" />;
                        const scopeLabel = run.scope === 'full' ? 'Full Workflow' :
                                          run.scope === 'single' ? 'Single Node' :
                                          `Partial Workflow (${(run.nodeRuns as any[])?.length || 0} nodes)`;
                        return (
                          <div key={run.id} className="border border-zinc-800 rounded-lg mb-2 overflow-hidden bg-zinc-950/20">
                            <button
                              onClick={() => setExpandedRun(isExpanded ? null : run.id)}
                              className="w-full p-2.5 flex items-center justify-between hover:bg-zinc-900/50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                {statusIcon}
                                <div className="text-left">
                                  <p className="text-[11px] font-medium text-zinc-300 flex leading-none gap-2">
                                    {scopeLabel} 
                                    {run.status === 'partial' && (
                                      <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[8px] px-1 py-0.5 rounded uppercase tracking-wider">Partial Fail</span>
                                    )}
                                  </p>
                                  <p className="text-[9px] text-zinc-600 flex items-center gap-1 mt-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    {new Date(run.createdAt).toLocaleString()}
                                    {' • '}{(run.duration / 1000).toFixed(1)}s
                                  </p>
                                </div>
                              </div>
                              {isExpanded ? <ChevronDown className="w-3 h-3 text-zinc-500" /> : <ChevronRight className="w-3 h-3 text-zinc-500" />}
                            </button>
                            {isExpanded && (
                              <div className="bg-zinc-950/50 flex flex-col gap-1 p-2 pt-0">
                                <div className="h-px bg-zinc-800/50 mb-1" />
                                {(run.nodeRuns as any[])?.map((nr: any, i: number) => (
                                  <div key={i} className="flex flex-col p-1.5 rounded-md hover:bg-zinc-900/50 border border-transparent hover:border-zinc-800 transition-colors">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        {nr.status === 'success' ? <CheckCircle2 className="w-2.5 h-2.5 text-green-500" /> : <XCircle className="w-2.5 h-2.5 text-red-500" />}
                                        <span className={`text-[10px] font-medium ${nr.status === 'success' ? 'text-zinc-300' : 'text-red-400'}`}>
                                          {nr.nodeType || nr.nodeId}
                                        </span>
                                      </div>
                                      <span className="text-[9px] text-zinc-600 font-mono">{(nr.duration / 1000).toFixed(1)}s</span>
                                    </div>
                                    {nr.status === 'failed' && nr.error && (
                                      <div className="mt-1 ml-4.5 text-[9px] text-red-400/80 bg-red-400/10 rounded p-1.5 border border-red-500/10">
                                        {nr.error}
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {(!run.nodeRuns || run.nodeRuns.length === 0) && (
                                  <div className="text-[9px] text-zinc-600 text-center py-2 italic transition">No node data recorded</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
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

