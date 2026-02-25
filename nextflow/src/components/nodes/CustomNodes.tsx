import { BaseNode } from './BaseNode';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import { 
  Type, Layers, ImageIcon, Video, Crop, Film, 
  Upload, Play, Loader2, Check, AlertCircle,
  ChevronDown
} from 'lucide-react';
import { useCallback, useRef, useEffect } from 'react';
export function TextNode({ id, data, selected }: any) {
  const updateNode = useWorkflowStore((s) => s.updateNode);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNode(id, { text: e.target.value });
  }, [id, updateNode]);

  return (
    <BaseNode
      title="Text Node"
      selected={selected}
      icon={<Type className="w-3.5 h-3.5 text-blue-400" />}
      outputs={[{ id: 'text', label: 'Text' }]}
    >
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Input Text</label>
        <textarea 
          value={data.text || ''}
          onChange={handleTextChange}
          placeholder="Enter prompt or text..."
          className="w-full h-28 bg-black/40 border border-white/5 rounded-xl p-3 text-[13px] text-zinc-200 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all duration-300 resize-none placeholder:text-zinc-700 leading-relaxed shadow-inner"
        />
        {data.text && (
          <div className="flex items-center justify-end px-1">
            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest bg-white/[0.03] px-2 py-0.5 rounded-full border border-white/5">{data.text.length} chars</span>
          </div>
        )}
      </div>
    </BaseNode>
  );
}

export function UploadImageNode({ id, data, selected }: any) {
  const updateNode = useWorkflowStore((s) => s.updateNode);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      updateNode(id, { 
        imageUrl: url, 
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(1) + ' KB',
      });
    };
    reader.readAsDataURL(file);
  }, [id, updateNode]);

  const handleRemove = useCallback(() => {
    updateNode(id, { imageUrl: null, fileName: null, fileSize: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [id, updateNode]);

  return (
    <BaseNode
      title="Upload Image"
      selected={selected}
      icon={<ImageIcon className="w-3.5 h-3.5 text-green-400" />}
      outputs={[{ id: 'image', label: 'Image URL' }]}
    >
      <div className="space-y-2">
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          onChange={handleFileSelect}
          className="hidden" 
        />

        {data.imageUrl ? (
          <div className="space-y-2">
            <div className="relative rounded-2xl overflow-hidden border border-white/5 group/img shadow-2xl">
              <img 
                src={data.imageUrl} 
                alt={data.fileName || 'Uploaded'} 
                className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-4 flex flex-col justify-end">
                <p className="text-[11px] text-white font-bold truncate tracking-tight">{data.fileName}</p>
                <p className="text-[10px] text-zinc-400 font-medium">{data.fileSize}</p>
              </div>
            </div>
            <button 
              onClick={handleRemove}
              className="w-full py-2 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 transition-all duration-300 uppercase tracking-widest shadow-sm"
            >
              Remove Asset
            </button>
          </div>
        ) : (
          <div 
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="nodrag nopan h-32 bg-zinc-950 border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-2 group/upload cursor-pointer hover:border-green-500/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover/upload:bg-zinc-800 group-hover/upload:border-green-500/30 transition-all">
              <Upload className="w-4 h-4 text-zinc-500 group-hover/upload:text-green-400 transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-zinc-500 uppercase">Click to Upload</p>
              <p className="text-[9px] text-zinc-600 mt-0.5">PNG, JPG, WebP</p>
            </div>
          </div>
        )}
      </div>
    </BaseNode>
  );
}

export function UploadVideoNode({ id, data, selected }: any) {
  const updateNode = useWorkflowStore((s) => s.updateNode);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      updateNode(id, { 
        videoUrl: url, 
        fileName: file.name,
        fileSize: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      });
    };
    reader.readAsDataURL(file);
  }, [id, updateNode]);

  const handleRemove = useCallback(() => {
    updateNode(id, { videoUrl: null, fileName: null, fileSize: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [id, updateNode]);

  return (
    <BaseNode
      title="Upload Video"
      selected={selected}
      icon={<Video className="w-3.5 h-3.5 text-red-400" />}
      outputs={[{ id: 'video', label: 'Video URL' }]}
    >
      <div className="space-y-2">
        <input 
          ref={fileInputRef}
          type="file" 
          accept="video/*" 
          onChange={handleFileSelect}
          className="hidden" 
        />

        {data.videoUrl ? (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-black shadow-2xl group/vid">
              <video 
                src={data.videoUrl} 
                className="w-full h-40 object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                controls
                muted
              />
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[8px] font-black text-white uppercase tracking-widest">
                   {data.fileSize}
                 </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] text-zinc-500 font-bold truncate max-w-[120px] uppercase tracking-tighter">{data.fileName}</p>
              <button 
                onClick={handleRemove}
                className="py-1.5 px-3 text-[9px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 transition-all duration-300 uppercase tracking-widest"
              >
                Clear Asset
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="nodrag nopan h-40 bg-black/40 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 group/upload cursor-pointer hover:border-red-500/30 hover:bg-red-500/[0.02] transition-all duration-500 shadow-inner"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/[0.02] flex items-center justify-center border border-white/5 group-hover/upload:bg-red-500/10 group-hover/upload:border-red-500/30 group-hover/upload:scale-110 group-hover/upload:rotate-3 transition-all duration-500">
              <Video className="w-5 h-5 text-zinc-600 group-hover/upload:text-red-400 transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] group-hover/upload:text-zinc-300 transition-colors">Import Video</p>
              <p className="text-[10px] text-zinc-700 font-medium mt-1">MP4 • WEBM • MOV</p>
            </div>
          </div>
        )}
      </div>
    </BaseNode>
  );
}

export function LLMNode({ id, data, selected }: any) {
  const updateNode = useWorkflowStore((s) => s.updateNode);
  const setRunState = useWorkflowStore((s) => s.setRunState);
  const nodeStatus: import('@/store/useWorkflowStore').RunStatus = useWorkflowStore((s) => s.runState[id] || 'idle');

  const handleModelChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNode(id, { model: e.target.value });
  }, [id, updateNode]);

  const handleRun = useCallback(async () => {
    setRunState(id, 'running');
    updateNode(id, { result: '' });

    const store = useWorkflowStore.getState();
    const incomingEdges = store.edges.filter((e) => e.target === id);
    let sysPrompt = data.system_prompt || '';
    let userMsg = data.user_message || '';
    const images: string[] = [];

    incomingEdges.forEach((e) => {
      const srcNode = store.nodes.find((n) => n.id === e.source);
      if (!srcNode) return;
      if (e.targetHandle === 'system_prompt') {
        sysPrompt = (srcNode.data.result || srcNode.data.text || sysPrompt) as string;
      } else if (e.targetHandle === 'user_message') {
        userMsg = (srcNode.data.result || srcNode.data.text || userMsg) as string;
      } else if (e.targetHandle === 'images') {
        const img = (srcNode.data.result || srcNode.data.imageUrl) as string;
        if (img) images.push(img);
      }
    });

    try {
      const res = await fetch('/api/run-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: data.model || 'gemini-2.5-flash',
          userMessage: userMsg || 'Hello',
          systemPrompt: sysPrompt,
          temperature: data.temperature ?? 0.7,
          images: images.length > 0 ? images : undefined,
        }),
      });
      const { id: runId, error } = await res.json();
      if (error) throw new Error(error);

      // poll for result
      const poll = setInterval(async () => {
        const statusRes = await fetch(`/api/run-status?id=${runId}`);
        const run = await statusRes.json();
        if (run.status === 'COMPLETED') {
          clearInterval(poll);
          setRunState(id, 'success');
          updateNode(id, { result: run.output?.text || 'Done' });
        } else if (run.status === 'FAILED' || run.status === 'CRASHED') {
          clearInterval(poll);
          setRunState(id, 'failed');
          updateNode(id, { result: run.error?.message || run.output?.error || 'Task failed' });
        }
      }, 2000);
    } catch (err: any) {
      setRunState(id, 'failed');
      updateNode(id, { result: err.message });
    }
  }, [id, data, setRunState, updateNode]);

  useEffect(() => {
    const handler = (e: any) => { if (e.detail?.id === id) handleRun(); };
    window.addEventListener('node:run', handler);
    return () => window.removeEventListener('node:run', handler);
  }, [id, handleRun]);

  const statusConfig = {
    idle: { color: 'text-zinc-600', icon: null },
    queued: { color: 'text-amber-400', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    running: { color: 'text-purple-400', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    success: { color: 'text-emerald-400', icon: <Check className="w-3 h-3" /> },
    failed: { color: 'text-rose-400', icon: <AlertCircle className="w-3 h-3" /> },
  };
  return (
    <BaseNode
      title="Run Any LLM"
      selected={selected}
      executing={nodeStatus === 'running'}
      icon={<Layers className="w-3.5 h-3.5 text-purple-400" />}
      inputs={[
        { id: 'system_prompt', label: 'System' },
        { id: 'user_message', label: 'User' },
        { id: 'images', label: 'Images' }
      ]}
      outputs={[{ id: 'output', label: 'Result' }]}
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Model</label>
          <div className="relative group/sel">
            <select 
              value={data.model || 'gemini-1.5-flash'}
              onChange={handleModelChange}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-purple-500/50 focus:bg-white/5 transition-all duration-300 cursor-pointer appearance-none pr-10 shadow-inner group-hover/sel:bg-white/10"
            >
              <optgroup label="Google Gemini" className="bg-[#0c0a15] text-zinc-300">
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              </optgroup>
              <optgroup label="OpenAI" className="bg-[#0c0a15] text-zinc-300">
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
              </optgroup>
              <optgroup label="Anthropic" className="bg-[#0c0a15] text-zinc-300">
                <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
              </optgroup>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none group-hover/sel:text-zinc-300 transition-colors" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Temperature</label>
            <span className="text-[10px] text-zinc-400 font-mono">{data.temperature ?? 0.7}</span>
          </div>
          <input 
            type="range" 
            min="0" max="2" step="0.1"
            value={data.temperature ?? 0.7}
            onChange={(e) => updateNode(id, { temperature: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all shadow-inner"
          />
        </div>
        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
              data.system_prompt || data.user_message ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-zinc-800'
            }`} />
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              {data.system_prompt || data.user_message 
                ? 'Signal Ready' 
                : 'Awaiting Inputs'}
            </span>
          </div>
        </div>
        <button 
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.96] disabled:opacity-50 shadow-[0_10px_20px_rgba(168,85,247,0.2)]"
          disabled={nodeStatus === 'running'}
          onClick={handleRun}
        >
          {nodeStatus === 'running' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              Run Model
            </>
          )}
        </button>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Output</label>
            {nodeStatus !== 'idle' && (
              <div className={`flex items-center gap-1 ${statusConfig[nodeStatus].color}`}>
                {statusConfig[nodeStatus].icon}
                <span className="text-[9px] font-bold uppercase">{nodeStatus}</span>
              </div>
            )}
          </div>
          <div className="min-h-[80px] max-h-64 overflow-y-auto bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-zinc-400 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent shadow-inner group/out">
            {data.result ? (
              <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap select-text pr-2 py-1 scroll-smooth">
                {data.result}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-4 space-y-2 opacity-30 group-hover/out:opacity-50 transition-opacity">
                <Play className="w-5 h-5 text-zinc-600" />
                <p className="text-zinc-600 italic text-[10px] uppercase font-bold tracking-widest text-center">Engine Idle</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseNode>
  );
}

export function CropImageNode({ id, data, selected }: any) {
  const updateNode = useWorkflowStore((s) => s.updateNode);
  const setRunState = useWorkflowStore((s) => s.setRunState);
  const nodeStatus: import('@/store/useWorkflowStore').RunStatus = useWorkflowStore((s) => s.runState[id] || 'idle');
  
  const handleValueChange = useCallback((field: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      updateNode(id, { [field]: num });
    }
  }, [id, updateNode]);

  const handleRun = useCallback(async () => {
    setRunState(id, 'running');
    updateNode(id, { result: '' });

    const store = useWorkflowStore.getState();
    const incomingEdges = store.edges.filter((e) => e.target === id);
    let imageUrl = data.imageUrl || '';
    let x = data.cropX ?? 0;
    let y = data.cropY ?? 0;
    let w = data.cropW ?? 100;
    let h = data.cropH ?? 100;

    incomingEdges.forEach((e) => {
      const srcNode = store.nodes.find((n) => n.id === e.source);
      if (!srcNode) return;
      const val = srcNode.data.result || srcNode.data.imageUrl || srcNode.data.text;
      
      const target = e.targetHandle?.toLowerCase() || '';
      if (target.includes('image')) imageUrl = val as string;
      else if (target.includes('x')) x = parseFloat(val as string) || x;
      else if (target.includes('y')) y = parseFloat(val as string) || y;
      else if (target.includes('width') || target === 'w') w = parseFloat(val as string) || w;
      else if (target.includes('height') || target === 'h') h = parseFloat(val as string) || h;
    });

    if (!imageUrl) {
        setRunState(id, 'failed');
        updateNode(id, { result: 'Error: No input image found. Ensure a node is connected to the Image input.' });
        return;
    }

    try {
      const res = await fetch('/api/crop-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: imageUrl,
          x: x,
          y: y,
          w: w,
          h: h,
        }),
      });
      const { id: runId, error } = await res.json();
      if (error) throw new Error(error);

      // poll for result
      const poll = setInterval(async () => {
        const statusRes = await fetch(`/api/run-status?id=${runId}`);
        const run = await statusRes.json();
        if (run.status === 'COMPLETED') {
          clearInterval(poll);
          setRunState(id, 'success');
          updateNode(id, { result: run.output?.dataUrl || 'Done' });
        } else if (run.status === 'FAILED' || run.status === 'CRASHED') {
          clearInterval(poll);
          setRunState(id, 'failed');
          updateNode(id, { result: run.error?.message || run.output?.error || 'Task failed' });
        }
      }, 2000);
    } catch (err: any) {
      setRunState(id, 'failed');
      updateNode(id, { result: err.message });
    }
  }, [id, data, setRunState, updateNode]);

  useEffect(() => {
    const handler = (e: any) => { if (e.detail?.id === id) handleRun(); };
    window.addEventListener('node:run', handler);
    return () => window.removeEventListener('node:run', handler);
  }, [id, handleRun]);

  const statusConfig = {
    idle: { color: 'text-zinc-600', icon: null },
    queued: { color: 'text-amber-400', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    running: { color: 'text-orange-400', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    success: { color: 'text-emerald-400', icon: <Check className="w-3 h-3" /> },
    failed: { color: 'text-rose-400', icon: <AlertCircle className="w-3 h-3" /> },
  };

  const cropFields = [
    { key: 'cropX', label: 'X', defaultVal: 0, desc: 'Left offset' },
    { key: 'cropY', label: 'Y', defaultVal: 0, desc: 'Top offset' },
    { key: 'cropW', label: 'W', defaultVal: 100, desc: 'Width' },
    { key: 'cropH', label: 'H', defaultVal: 100, desc: 'Height' },
  ];

  return (
    <BaseNode
      title="Crop Image"
      selected={selected}
      executing={nodeStatus === 'running'}
      icon={<Crop className="w-3.5 h-3.5 text-orange-400" />}
      inputs={[
        { id: 'image', label: 'Image' },
        { id: 'x_percent', label: 'X %' },
        { id: 'y_percent', label: 'Y %' },
        { id: 'width_percent', label: 'W %' },
        { id: 'height_percent', label: 'H %' }
      ]}
      outputs={[{ id: 'output', label: 'Cropped' }]}
    >
      <div className="space-y-4">
        <div className="relative h-24 bg-black border border-white/5 rounded-2xl overflow-hidden shadow-inner ring-1 ring-white/[0.02]">
          <div 
            className="absolute bg-orange-500/10 border border-orange-500/50 rounded transition-all duration-500 shadow-[0_0_20px_rgba(249,115,22,0.15)]"
            style={{
              left: `${data.cropX ?? 0}%`,
              top: `${data.cropY ?? 0}%`,
              width: `${data.cropW ?? 100}%`,
              height: `${data.cropH ?? 100}%`,
            }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
             <Crop className="w-6 h-6 text-zinc-500 mb-1" />
             <span className="text-[8px] text-zinc-600 font-black uppercase tracking-[0.2em]">Matrix View</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {cropFields.map((field) => (
            <div key={field.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-bold text-zinc-600 tracking-widest uppercase">{field.label}</label>
                <span className="text-[8px] text-zinc-700">{field.desc}</span>
              </div>
              <div className="relative group/field">
                <input 
                  type="number" 
                  min={0}
                  max={100}
                  value={data[field.key] ?? field.defaultVal}
                  onChange={(e) => handleValueChange(field.key, e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-zinc-200 focus:outline-none focus:border-orange-500/50 focus:bg-white/5 transition-all duration-300 pr-8 font-mono shadow-inner group-hover/field:border-white/10" 
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-zinc-600 font-black">%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 p-1 bg-white/[0.02] border border-white/5 rounded-xl">
          {[
            { label: 'Full', x: 0, y: 0, w: 100, h: 100 },
            { label: 'Center', x: 25, y: 25, w: 50, h: 50 },
            { label: 'Top', x: 0, y: 0, w: 100, h: 50 },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => updateNode(id, { 
                cropX: preset.x, cropY: preset.y, cropW: preset.w, cropH: preset.h 
              })}
              className="flex-1 py-1 text-[9px] font-black tracking-widest text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 uppercase"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <button 
          className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.96] disabled:opacity-50 shadow-[0_10px_20px_rgba(249,115,22,0.15)]"
          disabled={nodeStatus === 'running'}
          onClick={handleRun}
        >
          {nodeStatus === 'running' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              Run Crop
            </>
          )}
        </button>
        <div className="space-y-1.5 mt-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Output</label>
            {nodeStatus !== 'idle' && (
              <div className={`flex items-center gap-1 ${statusConfig[nodeStatus].color}`}>
                {statusConfig[nodeStatus].icon}
                <span className="text-[9px] font-bold uppercase">{nodeStatus}</span>
              </div>
            )}
          </div>
          <div className="min-h-[80px] bg-black/40 border border-white/5 rounded-xl flex items-center justify-center overflow-hidden shadow-inner mt-1">
            {data.result ? (
              data.result.startsWith('data:image') ? (
                <div className="p-2 w-full h-full flex items-center justify-center">
                  <img src={data.result} alt="Cropped result" className="rounded-lg max-h-40 object-contain shadow-2xl" />
                </div>
              ) : (
                <p className="text-xs text-rose-400 font-medium leading-relaxed text-center p-4">{data.result}</p>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-4 opacity-30">
                <ImageIcon className="w-5 h-5 text-zinc-600 mb-1" />
                <p className="text-zinc-600 italic text-[10px] font-black uppercase tracking-[0.2em]">Ready</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseNode>
  );
}

export function ExtractFrameNode({ id, data, selected }: any) {
  const updateNode = useWorkflowStore((s) => s.updateNode);
  const setRunState = useWorkflowStore((s) => s.setRunState);
  const nodeStatus: import('@/store/useWorkflowStore').RunStatus = useWorkflowStore((s) => s.runState[id] || 'idle');

  const handleRun = useCallback(async () => {
    setRunState(id, 'running');
    updateNode(id, { result: '' });

    const store = useWorkflowStore.getState();
    const incomingEdges = store.edges.filter((e) => e.target === id);
    let videoUrl = data.videoUrl || '';
    let timestamp = data.timestamp ?? 0;

    incomingEdges.forEach((e) => {
      const srcNode = store.nodes.find((n) => n.id === e.source);
      if (!srcNode) return;
      const val = srcNode.data.result || srcNode.data.videoUrl || srcNode.data.text;

      const target = e.targetHandle?.toLowerCase() || '';
      if (target.includes('video')) videoUrl = val as string;
      else if (target.includes('time') || target === 'timestamp') timestamp = val as any;
    });

    if (!videoUrl) {
        setRunState(id, 'failed');
        updateNode(id, { result: 'Error: No input video found. Ensure a node is connected to the Video input.' });
        return;
    }

    try {
      const res = await fetch('/api/extract-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: videoUrl,
          timestamp: timestamp,
          unit: data.timestampUnit || 'sec',
        }),
      });
      const { id: runId, error } = await res.json();
      if (error) throw new Error(error);

      // poll for result
      const poll = setInterval(async () => {
        const statusRes = await fetch(`/api/run-status?id=${runId}`);
        const run = await statusRes.json();
        if (run.status === 'COMPLETED') {
          clearInterval(poll);
          setRunState(id, 'success');
          updateNode(id, { result: run.output?.dataUrl || 'Done' });
        } else if (run.status === 'FAILED' || run.status === 'CRASHED') {
          clearInterval(poll);
          setRunState(id, 'failed');
          updateNode(id, { result: run.error?.message || run.output?.error || 'Task failed' });
        }
      }, 2000);
    } catch (err: any) {
      setRunState(id, 'failed');
      updateNode(id, { result: err.message });
    }
  }, [id, data, setRunState, updateNode]);

  useEffect(() => {
    const handler = (e: any) => { if (e.detail?.id === id) handleRun(); };
    window.addEventListener('node:run', handler);
    return () => window.removeEventListener('node:run', handler);
  }, [id, handleRun]);

  const statusConfig = {
    idle: { color: 'text-zinc-600', icon: null },
    queued: { color: 'text-amber-400', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    running: { color: 'text-cyan-400', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    success: { color: 'text-emerald-400', icon: <Check className="w-3 h-3" /> },
    failed: { color: 'text-rose-400', icon: <AlertCircle className="w-3 h-3" /> },
  };

  return (
    <BaseNode
      title="Extract Frame"
      selected={selected}
      executing={nodeStatus === 'running'}
      icon={<Film className="w-3.5 h-3.5 text-cyan-400" />}
      inputs={[
        { id: 'video', label: 'Video' },
        { id: 'timestamp', label: 'Time' }
      ]}
      outputs={[{ id: 'output', label: 'Frame' }]}
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Timestamp</label>
          <div className="flex gap-2">
            <input 
              type="number" 
              min={0}
              step={0.1}
              value={data.timestamp ?? 0}
              onChange={(e) => updateNode(id, { timestamp: parseFloat(e.target.value) || 0 })}
              placeholder="0.0"
              className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-cyan-500/50 focus:bg-white/5 transition-all duration-300 shadow-inner" 
            />
            <div className="relative min-w-[70px]">
              <select 
                value={data.timestampUnit || 'sec'}
                onChange={(e) => updateNode(id, { timestampUnit: e.target.value })}
                className="w-full h-full bg-white/[0.03] border border-white/5 rounded-xl px-3 text-[10px] text-zinc-500 font-black uppercase tracking-widest focus:outline-none focus:border-cyan-500/50 cursor-pointer appearance-none transition-all duration-300 hover:bg-white/10"
              >
                <option value="sec" className="bg-[#0c0a15]">sec</option>
                <option value="ms" className="bg-[#0c0a15]">ms</option>
                <option value="pct" className="bg-[#0c0a15]">%</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 p-1 bg-white/[0.02] border border-white/5 rounded-xl">
          {[0, 1, 5, 10, 30].map((t) => (
            <button
              key={t}
              onClick={() => updateNode(id, { timestamp: t })}
              className={`flex-1 py-1.5 text-[9px] font-black rounded-lg transition-all duration-300 uppercase tracking-widest ${
                (data.timestamp ?? 0) === t 
                  ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }`}
            >
              {t}s
            </button>
          ))}
        </div>
        <button 
          className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.96] disabled:opacity-50 shadow-[0_10px_20px_rgba(6,182,212,0.15)]"
          disabled={nodeStatus === 'running'}
          onClick={handleRun}
        >
          {nodeStatus === 'running' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              Extract Frame
            </>
          )}
        </button>
        <div className="space-y-1.5 mt-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Frame Preview</label>
            {nodeStatus !== 'idle' && (
              <div className={`flex items-center gap-1 ${statusConfig[nodeStatus].color}`}>
                {statusConfig[nodeStatus].icon}
                <span className="text-[9px] font-bold uppercase">{nodeStatus}</span>
              </div>
            )}
          </div>
          <div className="min-h-[100px] bg-black/40 border border-white/5 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner mt-1">
            {data.result ? (
              data.result.startsWith('data:image') ? (
                <div className="p-2 w-full h-full flex items-center justify-center group/res">
                  <img src={data.result} alt="Frame" className="w-full h-full object-cover rounded-xl shadow-2xl transition-transform duration-700 group-hover/res:scale-105" />
                </div>
              ) : (
                <p className="text-xs text-rose-400 font-medium leading-relaxed text-center p-4">{data.result}</p>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-6 opacity-30">
                <Film className="w-6 h-6 text-zinc-600 mb-2" />
                <p className="text-zinc-600 italic text-[10px] font-black uppercase tracking-[0.2em]">Ready to Roll</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseNode>
  );
}
