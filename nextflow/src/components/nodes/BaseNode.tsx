import { Handle, Position } from '@xyflow/react';
import { ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BaseNodeProps {
  id?: string;
  selected?: boolean;
  title: string;
  icon?: ReactNode;
  children?: ReactNode;
  inputs?: Array<{ id: string; label: string }>;
  outputs?: Array<{ id: string; label: string }>;
  executing?: boolean;
}

export function BaseNode({
  selected,
  title,
  icon,
  children,
  inputs = [],
  outputs = [],
  executing = false,
}: BaseNodeProps) {
  return (
    <div className={cn(
      "group relative min-w-[240px] rounded-xl bg-[#0A0A0A] border transition-all duration-300",
      selected ? "border-purple-500 shadow-[0_0_20px_rgba(139,92,246,0.2)]" : "border-zinc-800",
      executing && "animate-pulse border-purple-400 shadow-[0_0_30px_rgba(139,92,246,0.4)]"
    )}>
      {/* Node Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-900 bg-zinc-900/30">
        <div className="flex items-center justify-center w-6 h-6 rounded bg-zinc-800 border border-zinc-700">
          {icon}
        </div>
        <span className="text-xs font-bold tracking-tight text-zinc-200 uppercase">{title}</span>
      </div>

      {/* Node Content */}
      <div className="p-3 nodrag nopan">
        {children}
      </div>

      {/* Handles - Inputs (Left) */}
      <div className="absolute top-12 -left-[5px] flex flex-col gap-6">
        {inputs.map((input) => (
          <div key={input.id} className="relative flex items-center">
            <Handle
              type="target"
              position={Position.Left}
              id={input.id}
              className="!w-2.5 !h-2.5 !bg-zinc-700 !border-zinc-950 hover:!bg-purple-500 transition-colors"
            />
            <span className="absolute left-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {input.label}
            </span>
          </div>
        ))}
      </div>

      {/* Handles - Outputs (Right) */}
      <div className="absolute top-12 -right-[5px] flex flex-col gap-6">
        {outputs.map((output) => (
          <div key={output.id} className="relative flex items-center justify-end">
            <span className="absolute right-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {output.label}
            </span>
            <Handle
              type="source"
              position={Position.Right}
              id={output.id}
              className="!w-2.5 !h-2.5 !bg-zinc-700 !border-zinc-950 hover:!bg-purple-500 transition-colors"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
