import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';

const toneMap = {
  slate: {
    chip: 'bg-slate-800/70 text-slate-200 border border-white/10',
    icon: 'text-slate-300',
    accent: 'bg-slate-500',
    track: 'bg-slate-700',
  },
  cyan: {
    chip: 'bg-cyan-500/10 text-cyan-100 border border-cyan-400/25',
    icon: 'text-cyan-300',
    accent: 'bg-cyan-400',
    track: 'bg-gradient-to-r from-cyan-500 to-blue-500',
  },
  blue: {
    chip: 'bg-blue-500/10 text-blue-100 border border-blue-400/25',
    icon: 'text-blue-300',
    accent: 'bg-blue-400',
    track: 'bg-gradient-to-r from-blue-500 to-indigo-500',
  },
  emerald: {
    chip: 'bg-emerald-500/10 text-emerald-100 border border-emerald-400/25',
    icon: 'text-emerald-300',
    accent: 'bg-emerald-400',
    track: 'bg-gradient-to-r from-emerald-500 to-teal-500',
  },
  amber: {
    chip: 'bg-amber-500/10 text-amber-100 border border-amber-400/25',
    icon: 'text-amber-200',
    accent: 'bg-amber-400',
    track: 'bg-gradient-to-r from-amber-500 to-orange-500',
  },
} as const;

type Tone = keyof typeof toneMap;

type MetricCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  tone?: Tone;
  trend?: string;
  meter?: number;
};

export function MetricCard({ title, value, description, icon, tone = 'slate', trend, meter }: MetricCardProps) {
  const toneClass = toneMap[tone];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/25 hover:shadow-[0_18px_46px_rgba(2,6,23,0.54)]">
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent" />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{title}</p>
        <div className={`h-8 w-8 rounded-xl ${toneClass.chip} flex items-center justify-center ${toneClass.icon}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <p className="text-2xl font-semibold tracking-[-0.03em] text-slate-100">{value}</p>
        {trend && <p className="text-xs text-slate-400">{trend}</p>}
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{description}</p>
      {typeof meter === 'number' && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full border border-white/10 bg-slate-800/80">
          <div
            className={`h-full rounded-full ${toneClass.track} transition-all duration-700 ease-out`}
            style={{ width: `${Math.max(0, Math.min(100, meter))}%` }}
          />
        </div>
      )}
    </div>
  );
}

type ActionTileProps = {
  icon: ReactNode;
  title: string;
  description: string;
  shortcut?: string;
  onClick: () => void;
};

export function ActionTile({ icon, title, description, shortcut, onClick }: ActionTileProps) {
  return (
    <button
      onClick={onClick}
      className="group relative w-full min-h-[104px] overflow-hidden rounded-2xl border border-white/10 bg-slate-900/55 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-slate-900/75 hover:shadow-[0_14px_30px_rgba(2,6,23,0.45)]"
    >
      <span className="pointer-events-none absolute inset-0 quick-shimmer" />
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-500/10 text-cyan-200">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-100">{title}</p>
            {shortcut && (
              <span className="rounded-md border border-white/10 bg-slate-800/70 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                {shortcut}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-400 pr-1">{description}</p>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-600 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-200" />
      </div>
    </button>
  );
}

type UsageMeterProps = {
  label: string;
  current: number;
  max: number;
  tone?: Tone;
  helper?: string;
};

export function UsageMeter({ label, current, max, tone = 'blue', helper }: UsageMeterProps) {
  const toneClass = toneMap[tone];
  const ratio = max > 0 ? Math.min((current / max) * 100, 100) : 0;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <p className="text-slate-400">{label}</p>
        <p className="font-medium text-slate-200">{current} / {max}</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-slate-800/70">
        <div
          className={`h-full rounded-full ${toneClass.track} transition-all duration-700 ease-out`}
          style={{ width: `${ratio}%` }}
        />
      </div>
      {helper && <p className="mt-2 text-[11px] text-slate-500">{helper}</p>}
    </div>
  );
}

type ChecklistItemProps = {
  title: string;
  description: string;
  complete: boolean;
};

export function ChecklistItem({ title, description, complete }: ChecklistItemProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3 transition-colors duration-200 hover:border-white/15">
      <div className="flex items-start gap-2.5">
        <span className={`mt-0.5 h-2.5 w-2.5 rounded-full ${complete ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-slate-600'}`} />
        <div>
          <p className="text-sm font-medium text-slate-100">{title}</p>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
    </div>
  );
}
