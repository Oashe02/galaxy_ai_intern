import { BaseNode } from './BaseNode';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import { 
  Type, Layers, ImageIcon, Video, Crop, Film, 
  Upload, Play, Loader2, Check, AlertCircle,
  ChevronDown
} from 'lucide-react';
import { useCallback, useRef } from 'react';
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
          className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 transition-colors resize-none placeholder:text-zinc-700 leading-relaxed"
        />
        {data.text && (
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-zinc-600 font-medium">{data.text.length} characters</span>
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

    const url = URL.createObjectURL(file);
    updateNode(id, { 
      imageUrl: url, 
      fileName: file.name,
      fileSize: (file.size / 1024).toFixed(1) + ' KB',
    });
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
            <div className="relative rounded-lg overflow-hidden border border-zinc-800">
              <img 
                src={data.imageUrl} 
                alt={data.fileName || 'Uploaded'} 
                className="w-full h-32 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="text-[10px] text-white font-medium truncate">{data.fileName}</p>
                <p className="text-[9px] text-zinc-400">{data.fileSize}</p>
              </div>
            </div>
            <button 
              onClick={handleRemove}
              className="w-full py-1.5 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors uppercase tracking-wider"
            >
              Remove Image
            </button>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="h-32 bg-zinc-950 border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-2 group/upload cursor-pointer hover:border-green-500/50 transition-colors"
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

    const url = URL.createObjectURL(file);
    updateNode(id, { 
      videoUrl: url, 
      fileName: file.name,
      fileSize: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
    });
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
          <div className="space-y-2">
            <div className="relative rounded-lg overflow-hidden border border-zinc-800">
              <video 
                src={data.videoUrl} 
                className="w-full h-32 object-cover bg-black"
                controls
                muted
              />
            </div>
            <div className="flex items-center justify-between px-1">
              <div>
                <p className="text-[10px] text-zinc-300 font-medium truncate max-w-[140px]">{data.fileName}</p>
                <p className="text-[9px] text-zinc-600">{data.fileSize}</p>
              </div>
              <button 
                onClick={handleRemove}
                className="py-1 px-2 text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-md hover:bg-red-500/20 transition-colors uppercase"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="h-32 bg-zinc-950 border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-2 group/upload cursor-pointer hover:border-red-500/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover/upload:bg-zinc-800 group-hover/upload:border-red-500/30 transition-all">
              <Film className="w-4 h-4 text-zinc-500 group-hover/upload:text-red-400 transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-zinc-500 uppercase">Click to Upload</p>
              <p className="text-[9px] text-zinc-600 mt-0.5">MP4, WebM, MOV</p>
            </div>
          </div>
        )}
      </div>
    </BaseNode>
  );
}

export function LLMNode({ id, data, selected }: any) {
  const updateNode = useWorkflowStore((s) => s.updateNode);
  const nodeStatus: import('@/store/useWorkflowStore').RunStatus = useWorkflowStore((s) => s.runState[id] || 'idle');
  const handleModelChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNode(id, { model: e.target.value });
  }, [id, updateNode]);
  const statusConfig = {
    idle: { color: 'text-zinc-500', icon: null },
    queued: { color: 'text-yellow-400', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    running: { color: 'text-purple-400', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    success: { color: 'text-green-400', icon: <Check className="w-3 h-3" /> },
    failed: { color: 'text-red-400', icon: <AlertCircle className="w-3 h-3" /> },
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
          <div className="relative">
            <select 
              value={data.model || 'gemini-2.0-flash'}
              onChange={handleModelChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-purple-500 transition-colors cursor-pointer appearance-none pr-8"
            >
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Temperature</label>
            <span className="text-[10px] text-zinc-400 font-mono">{data.temperature ?? 0.7}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="2" 
            step="0.1"
            value={data.temperature ?? 0.7}
            onChange={(e) => updateNode(id, { temperature: parseFloat(e.target.value) })}
            className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-purple-500"
          />
        </div>
        <div className="p-2.5 border border-dashed border-zinc-800 rounded-lg">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${
              data.system_prompt || data.user_message ? 'bg-green-500' : 'bg-zinc-700'
            }`} />
            <span className="text-[10px] text-zinc-600 font-medium">
              {data.system_prompt || data.user_message 
                ? 'Inputs connected' 
                : 'Connect inputs to run'}
            </span>
          </div>
        </div>
        <button className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
          disabled={nodeStatus === 'running'}
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
          <div className="min-h-[60px] bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-400">
            {data.result ? (
              <p className="text-zinc-300 leading-relaxed">{data.result}</p>
            ) : (
              <p className="text-zinc-700 italic text-[10px]">Output will appear here after execution...</p>
            )}
          </div>
        </div>
      </div>
    </BaseNode>
  );
}

export function CropImageNode({ id, data, selected }: any) {
  const updateNode = useWorkflowStore((s) => s.updateNode);
  const handleValueChange = useCallback((field: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      updateNode(id, { [field]: num });
    }
  }, [id, updateNode]);

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
      icon={<Crop className="w-3.5 h-3.5 text-orange-400" />}
      inputs={[{ id: 'image', label: 'Image' }]}
      outputs={[{ id: 'output', label: 'Cropped' }]}
    >
      <div className="space-y-3">
        <div className="relative h-20 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
          <div 
            className="absolute bg-orange-500/20 border border-orange-500/50 rounded-sm transition-all"
            style={{
              left: `${data.cropX ?? 0}%`,
              top: `${data.cropY ?? 0}%`,
              width: `${data.cropW ?? 100}%`,
              height: `${data.cropH ?? 100}%`,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[9px] text-zinc-600 font-bold uppercase">Crop Preview</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {cropFields.map((field) => (
            <div key={field.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-bold text-zinc-600 tracking-widest uppercase">{field.label}</label>
                <span className="text-[8px] text-zinc-700">{field.desc}</span>
              </div>
              <div className="relative">
                <input 
                  type="number" 
                  min={0}
                  max={100}
                  value={data[field.key] ?? field.defaultVal}
                  onChange={(e) => handleValueChange(field.key, e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-300 focus:outline-none focus:border-orange-500 transition-colors pr-6 font-mono" 
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-zinc-600 font-bold">%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-1.5">
          {[
            { label: 'Full', x: 0, y: 0, w: 100, h: 100 },
            { label: 'Center', x: 25, y: 25, w: 50, h: 50 },
            { label: 'Top Half', x: 0, y: 0, w: 100, h: 50 },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => updateNode(id, { 
                cropX: preset.x, cropY: preset.y, cropW: preset.w, cropH: preset.h 
              })}
              className="flex-1 py-1 text-[9px] font-bold text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-md hover:bg-zinc-800 hover:text-zinc-300 transition-colors uppercase tracking-wider"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </BaseNode>
  );
}

export function ExtractFrameNode({ id, data, selected }: any) {
  const updateNode = useWorkflowStore((s) => s.updateNode);

  return (
    <BaseNode
      title="Extract Frame"
      selected={selected}
      icon={<Film className="w-3.5 h-3.5 text-cyan-400" />}
      inputs={[{ id: 'video', label: 'Video' }]}
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
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-cyan-500 transition-colors" 
            />
            <select 
              value={data.timestampUnit || 'sec'}
              onChange={(e) => updateNode(id, { timestampUnit: e.target.value })}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 text-[10px] text-zinc-400 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="sec">sec</option>
              <option value="ms">ms</option>
              <option value="pct">%</option>
            </select>
          </div>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 5, 10, 30].map((t) => (
            <button
              key={t}
              onClick={() => updateNode(id, { timestamp: t })}
              className={`flex-1 py-1.5 text-[9px] font-bold rounded-md border transition-colors uppercase ${
                (data.timestamp ?? 0) === t 
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
              }`}
            >
              {t}s
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Frame Preview</label>
          <div className="h-20 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-center">
            {data.frameUrl ? (
              <img src={data.frameUrl} alt="Frame" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <div className="text-center">
                <Film className="w-5 h-5 text-zinc-800 mx-auto mb-1" />
                <p className="text-[9px] text-zinc-700 font-medium">Connect a video to extract</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseNode>
  );
}
