import type { ReactNode } from 'react';

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in-up">
      <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/30 mb-5 text-slate-500 animate-float">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-white mb-1.5">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-5 leading-relaxed">{description}</p>
      {action}
    </div>
  );
}
