import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'pro';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-800/80 text-slate-400 border border-slate-700/50',
  success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  danger: 'bg-red-500/10 text-red-400 border border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  pro: 'bg-gradient-to-r from-blue-500/15 to-cyan-500/15 text-blue-400 border border-blue-500/25',
};

type BadgeProps = {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  dot?: boolean;
  pulse?: boolean;
};

export default function Badge({ variant = 'default', children, className = '', dot = false, pulse = false }: BadgeProps) {
  const dotColor = variant === 'success' ? 'bg-emerald-400' :
    variant === 'warning' ? 'bg-amber-400' :
    variant === 'danger' ? 'bg-red-400' :
    variant === 'info' ? 'bg-blue-400' :
    variant === 'pro' ? 'bg-blue-400' : 'bg-slate-400';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${variantClasses[variant]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${pulse ? 'animate-dot-pulse' : ''}`} />
      )}
      {children}
    </span>
  );
}
