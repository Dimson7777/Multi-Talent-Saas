import type { ReactNode, CSSProperties } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  hover?: boolean;
  glow?: 'blue' | 'emerald' | 'red' | null;
  style?: CSSProperties;
};

export default function Card({ children, className = '', padding = true, hover = false, glow = null, style }: CardProps) {
  const glowClass = glow === 'blue' ? 'glow-blue' : glow === 'emerald' ? 'glow-emerald' : glow === 'red' ? 'glow-red' : '';

  return (
    <div
      style={style}
      className={`relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_14px_40px_rgba(2,6,23,0.35)] ${padding ? 'p-6' : ''} ${hover ? 'transition-all duration-300 hover:border-slate-300/20 hover:shadow-[0_20px_48px_rgba(2,6,23,0.45)] hover:-translate-y-0.5' : ''} ${glowClass} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-between mb-5 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={`text-base font-semibold text-white tracking-tight ${className}`}>
      {children}
    </h3>
  );
}
