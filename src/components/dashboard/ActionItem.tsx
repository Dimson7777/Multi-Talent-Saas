import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

export type ActionItemTone = 'blue' | 'emerald' | 'default';

export interface ActionItemProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  tone?: ActionItemTone;
}

export default function ActionItem({ icon, label, onClick, tone = 'blue' }: ActionItemProps) {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(2,6,23,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 ${
        tone === 'blue' ? 'bg-blue-500/[0.07] hover:bg-blue-500/[0.12] border border-blue-400/20 hover:border-blue-300/35' :
        tone === 'emerald' ? 'bg-emerald-500/[0.07] hover:bg-emerald-500/[0.12] border border-emerald-400/20 hover:border-emerald-300/35' :
        'bg-slate-800/50 hover:bg-slate-800/70 border border-white/10 hover:border-slate-300/20'
      }`}
    >
      <span className="pointer-events-none absolute inset-0 quick-shimmer" />
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${
        tone === 'blue' ? 'bg-blue-500/10' :
        tone === 'emerald' ? 'bg-emerald-500/10' :
        'bg-slate-700/50'
      }`}>
        {icon}
      </div>
      <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors flex-1 text-left">{label}</span>
      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-all duration-300 group-hover:translate-x-1" />
    </button>
  );
}