import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
};

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 focus:ring-blue-500/50 border border-blue-400/20 hover:border-blue-300/35',
  secondary:
    'bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-900 text-slate-200 border border-slate-700/60 hover:border-slate-500/70 focus:ring-slate-500/50',
  ghost:
    'bg-transparent hover:bg-slate-800/60 active:bg-slate-700/60 text-slate-300 hover:text-white focus:ring-slate-500/50',
  danger:
    'bg-red-600/90 hover:bg-red-500 active:bg-red-700 text-white shadow-lg shadow-red-600/20 hover:shadow-red-500/30 focus:ring-red-500/50 border border-red-400/20',
  success:
    'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30 focus:ring-emerald-500/50 border border-emerald-400/20',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`group inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] hover:-translate-y-0.5 ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
