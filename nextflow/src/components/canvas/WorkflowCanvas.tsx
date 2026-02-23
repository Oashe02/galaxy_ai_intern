'use client';

import React, { useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Panel,
  useReactFlow,
  type NodeMouseHandler,
  type IsValidConnection,
} from '@xyflow/react';
import { useWorkflowStore, getHandleType } from '@/store/useWorkflowStore';
import { Maximize, MousePointer2, Trash2, Copy } from 'lucide-react';
import { 
  TextNode, 
  LLMNode, 
  UploadImageNode, 
  UploadVideoNode, 
  CropImageNode, 
  ExtractFrameNode 
} from '@/components/nodes/CustomNodes';

export default function WorkflowCanvas() {
  const nodes = useWorkflowStore(s => s.nodes);
  const edges = useWorkflowStore(s => s.edges);
  const onNodesChange = useWorkflowStore(s => s.handleNodesChange);
  const onEdgesChange = useWorkflowStore(s => s.handleEdgesChange);
  const onConnect = useWorkflowStore(s => s.handleConnect);
  const onSelectionChange = useWorkflowStore(s => s.handleSelectionChange);
  const setVp = useWorkflowStore(s => s.setViewport);
  const sel = useWorkflowStore(s => s.selected);
  const delSelected = useWorkflowStore(s => s.deleteSelected);
  const clone = useWorkflowStore(s => s.cloneNode);

  const { fitView } = useReactFlow();

  const nodeTypes = useMemo(() => ({
    text: TextNode,
    llm: LLMNode,
    uploadImage: UploadImageNode,
    uploadVideo: UploadVideoNode,
    cropImage: CropImageNode,
    extractFrame: ExtractFrameNode,
  }), []);

  // type-safe connection validation
  const checkConnection: IsValidConnection = useCallback((conn) => {
    const src = nodes.find(n => n.id === conn.source);
    const tgt = nodes.find(n => n.id === conn.target);
    if (!src || !tgt || !conn.sourceHandle || !conn.targetHandle) return false;
    const from = getHandleType(src.type ?? '', conn.sourceHandle);
    const to = getHandleType(tgt.type ?? '', conn.targetHandle);
    return from === to || from === 'any' || to === 'any';
  }, [nodes]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && sel.length > 0) {
        e.preventDefault();
        delSelected();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && sel.length === 1) {
        e.preventDefault();
        clone(sel[0]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sel, delSelected, clone]);

  const onDblClick: NodeMouseHandler = useCallback((_ev, node) => {
    console.log('dblclick:', node.id);
  }, []);

  return (
    <div className="w-full h-full relative bg-black">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange} 
        onMoveEnd={(_ev, vp) => setVp(vp)}
        onNodeDoubleClick={onDblClick}
        isValidConnection={checkConnection}
        nodeTypes={nodeTypes}
        colorMode="dark"
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={5}
        connectionLineStyle={{ stroke: '#8B5CF6', strokeWidth: 2 }}
        snapToGrid
        snapGrid={[20, 20]}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode={null} 
        multiSelectionKeyCode="Shift"
        selectionOnDrag
        panOnScroll
        selectNodesOnDrag={false}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} size={1} color="#27272A" 
        />
        <Controls 
          className="!left-4 !bottom-4 !bg-[#0A0A0A] !border-zinc-800 !rounded-xl !shadow-xl"
          showInteractive={false}
        />
        <MiniMap 
          className="!right-4 !bottom-4 !bg-[#0A0A0A] !border-zinc-800 !rounded-xl !shadow-xl"
          nodeStrokeWidth={3}
          maskColor="rgba(0, 0, 0, 0.7)"
          pannable zoomable
          nodeColor={(n) => {
            switch (n.type) {
              case 'llm': return '#8B5CF6';
              case 'text': return '#3B82F6';
              case 'uploadImage': return '#10B981';
              case 'uploadVideo': return '#EF4444';
              case 'cropImage': return '#F59E0B';
              case 'extractFrame': return '#06B6D4';
              default: return '#3F3F46';
            }
          }}
        />

        <Panel position="top-right" className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-sm">
            <MousePointer2 className="w-4 h-4" /> Select
          </button>
          <button 
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-sm"
            onClick={() => fitView({ duration: 400, padding: 0.2 })}
          >
            <Maximize className="w-4 h-4" /> Fit View
          </button>
        </Panel>

        {sel.length > 0 && (
          <Panel position="bottom-center" className="flex gap-2 mb-4">
            <div className="flex items-center gap-1.5 bg-zinc-900/95 border border-zinc-800 rounded-xl p-1.5 shadow-2xl backdrop-blur-md">
              <span className="text-[11px] text-zinc-400 font-medium px-2">{sel.length} selected</span>
              <div className="w-px h-5 bg-zinc-800" />
              {sel.length === 1 && (
                <button
                  onClick={() => clone(sel[0])}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Duplicate (⌘D)"
                >
                  <Copy className="w-3.5 h-3.5" /> Duplicate
                </button>
              )}
              <button
                onClick={delSelected}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Delete (⌫)"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
