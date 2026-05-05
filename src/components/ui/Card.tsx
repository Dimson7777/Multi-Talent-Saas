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
      className={`relative bg-slate-900/70 backdrop-blur-sm border border-slate-800/70 rounded-xl shadow-xl shadow-black/10 ${padding ? 'p-6' : ''} ${hover ? 'transition-all duration-300 hover:border-slate-700/80 hover:shadow-black/20 hover:-translate-y-0.5' : ''} ${glowClass} ${className}`}
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
