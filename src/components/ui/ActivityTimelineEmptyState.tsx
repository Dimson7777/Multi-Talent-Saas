import { BookOpen } from 'lucide-react';

type ActivityTimelineEmptyStateProps = {
  docsHref?: string;
};

export default function ActivityTimelineEmptyState({
  docsHref = 'https://example.com/docs/activity-timeline',
}: ActivityTimelineEmptyStateProps) {
  return (
    <div className="relative flex flex-col items-center justify-center py-12 text-center animate-fade-in-up">
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-cyan-500/[0.03] via-transparent to-transparent" />

      <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/20 bg-slate-900/60 shadow-[0_0_0_1px_rgba(56,189,248,0.15),0_0_26px_rgba(34,211,238,0.22)]">
        <svg
          viewBox="0 0 64 64"
          className="h-10 w-10"
          aria-hidden="true"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="nexus-timeline-line" x1="8" y1="32" x2="56" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#22D3EE" stopOpacity="0.2" />
              <stop offset="0.5" stopColor="#38BDF8" stopOpacity="0.9" />
              <stop offset="1" stopColor="#818CF8" stopOpacity="0.25" />
            </linearGradient>
          </defs>
          <path d="M10 32H54" stroke="url(#nexus-timeline-line)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="18" cy="32" r="4" fill="#22D3EE" fillOpacity="0.22" stroke="#67E8F9" strokeOpacity="0.7" />
          <circle cx="32" cy="32" r="5" fill="#38BDF8" fillOpacity="0.28" stroke="#7DD3FC" strokeOpacity="0.85" />
          <circle cx="46" cy="32" r="4" fill="#818CF8" fillOpacity="0.2" stroke="#A5B4FC" strokeOpacity="0.7" />
        </svg>
      </div>

      <h4 className="text-sm font-semibold text-slate-100 tracking-[-0.01em] mb-1.5">No activity events yet</h4>
      <p className="text-xs text-slate-400 max-w-[340px] leading-relaxed mb-4">
        Your operational log will appear here once system events are triggered.
      </p>

      <a
        href={docsHref}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600/60 bg-slate-800/70 px-3 py-1.5 text-xs font-medium text-slate-200 transition-all duration-200 hover:border-cyan-300/40 hover:bg-slate-700/80 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
      >
        <BookOpen className="h-3.5 w-3.5" />
        Learn more
      </a>
    </div>
  );
}