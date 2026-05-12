export type SystemStatus = 'active' | 'past_due' | 'default';

export interface StatusBadgeProps {
  status: SystemStatus;
}

interface StatusBadgeConfig {
  containerClassName: string;
  label: string;
  dotClassName: string;
}

const statusConfig: Record<SystemStatus, StatusBadgeConfig> = {
  active: {
    containerClassName: 'bg-emerald-500/8 text-emerald-300 border-emerald-400/20',
    label: 'All systems operational',
    dotClassName: 'bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.85)]',
  },
  past_due: {
    containerClassName: 'bg-amber-500/10 text-amber-400 border-amber-500/15',
    label: 'Payment past due',
    dotClassName: 'bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.75)]',
  },
  default: {
    containerClassName: 'bg-slate-900/55 text-slate-400 border-slate-600/30',
    label: 'Active',
    dotClassName: 'bg-slate-300 shadow-[0_0_8px_rgba(203,213,225,0.45)]',
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md border ${config.containerClassName}`}>
      <span className="relative flex h-2.5 w-2.5">
        <span className="status-dot-pulse absolute inset-0 rounded-full bg-emerald-400" />
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${config.dotClassName}`} />
      </span>
      {config.label}
    </div>
  );
}