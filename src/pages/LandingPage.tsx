import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Shield,
  Users,
  CreditCard,
  BarChart3,
  Layers,
  Sparkles,
  Play,
  Lock,
  Check,
} from 'lucide-react';

/* ===== Parallax Hook ===== */
function useParallax() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      setOffset({
        x: ((e.clientX - cx) / cx) * 12,
        y: ((e.clientY - cy) / cy) * 8,
      });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);
  return offset;
}

/* ===== Cinematic Intro Hook ===== */
// 0=dark  1=flicker  2=strike  3=impact  4=reveal  5=idle
type IntroPhase = 0 | 1 | 2 | 3 | 4 | 5;

function useCinematicIntro() {
  const [phase, setPhase] = useState<IntroPhase>(0);
  useEffect(() => {
    const t0 = setTimeout(() => setPhase(1), 300);   // pre-lightning flicker
    const t1 = setTimeout(() => setPhase(2), 680);   // lightning strikes
    const t2 = setTimeout(() => setPhase(3), 1250);  // impact shockwave
    const t3 = setTimeout(() => setPhase(4), 1950);  // content reveals
    const t4 = setTimeout(() => setPhase(5), 3600);  // ambient idle
    return () => {
      clearTimeout(t0); clearTimeout(t1); clearTimeout(t2);
      clearTimeout(t3); clearTimeout(t4);
    };
  }, []);
  return phase;
}

/* ===== Scroll Reveal Hook ===== */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ===== Dragon SVG Silhouettes ===== */
function DragonSilhouette({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 200 120" fill="none">
      {/* Serpentine dragon body */}
      <path
        d="M20 80 C30 60, 50 50, 70 55 C80 57, 85 52, 90 45 C95 38, 100 35, 110 38 C120 41, 125 48, 130 42 C135 36, 140 30, 150 32 C160 34, 165 40, 170 35 C175 30, 180 25, 190 30"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      {/* Head */}
      <path
        d="M190 30 L195 25 L192 32 L198 28 L190 30Z"
        fill="currentColor"
        opacity="0.5"
      />
      {/* Wing 1 */}
      <path
        d="M70 55 C65 40, 55 30, 45 25 C50 35, 55 42, 60 48 C62 50, 65 52, 70 55Z"
        fill="currentColor"
        opacity="0.3"
      />
      {/* Wing 2 */}
      <path
        d="M110 38 C108 25, 100 15, 90 12 C95 22, 100 30, 105 35 C107 37, 108 37, 110 38Z"
        fill="currentColor"
        opacity="0.25"
      />
      {/* Tail flame */}
      <path
        d="M20 80 C15 78, 10 82, 8 78 C6 74, 12 72, 15 76 C17 78, 18 79, 20 80Z"
        fill="currentColor"
        opacity="0.35"
      />
      {/* Eye glow */}
      <circle cx="192" cy="28" r="1.5" fill="currentColor" opacity="0.8">
        <animate attributeName="opacity" values="0.4;0.9;0.4" dur="3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function DragonSilhouette2({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 180 100" fill="none">
      {/* More angular, aggressive dragon */}
      <path
        d="M15 70 C25 55, 40 48, 55 50 C65 52, 70 45, 78 38 C85 32, 95 28, 105 32 C115 36, 120 42, 128 36 C135 30, 142 22, 155 25 C165 28, 170 35, 175 28"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      {/* Head crest */}
      <path
        d="M175 28 L178 22 L176 30 L180 26 L175 28Z"
        fill="currentColor"
        opacity="0.4"
      />
      {/* Large wing */}
      <path
        d="M55 50 C48 32, 35 20, 22 15 C30 28, 38 38, 45 44 C48 47, 52 49, 55 50Z"
        fill="currentColor"
        opacity="0.2"
      />
      <path
        d="M105 32 C100 18, 88 8, 75 5 C85 15, 92 25, 98 30 C100 31, 103 32, 105 32Z"
        fill="currentColor"
        opacity="0.18"
      />
      {/* Spines along back */}
      <path d="M70 45 L68 40 M78 38 L76 32 M95 28 L93 22" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      {/* Eye */}
      <circle cx="177" cy="26" r="1.2" fill="currentColor" opacity="0.7">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/* ===== Ambient Particles ===== */
function AmbientParticles({ phase }: { phase: number }) {
  const particles = useMemo(() => Array.from({ length: 26 }).map((_, i) => ({
    id: i,
    size: Math.random() * 2.2 + 0.6,
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 7,
    isCyan: Math.random() > 0.42,
  })), []);

  // phase 0: invisible, phase 1: ghost-faint (pre-boot), phase 2+: normal
  const wrapperOpacity = phase === 0 ? 0 : phase === 1 ? 0.18 : 1;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ opacity: wrapperOpacity, transition: 'opacity 1.4s ease' }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-full animate-float ${p.isCyan ? 'bg-cyan-300/30' : 'bg-blue-400/22'}`}
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            boxShadow: p.isCyan
              ? `0 0 ${p.size * 3}px rgba(103,232,249,0.55)`
              : `0 0 ${p.size * 2.5}px rgba(96,165,250,0.45)`,
          }}
        />
      ))}
      {phase >= 3 && Array.from({ length: 8 }).map((_, i) => (
        <div
          key={`spark-${i}`}
          className="absolute animate-spark-float"
          style={{
            width: 1.5,
            height: Math.random() * 10 + 5,
            left: `${43 + Math.random() * 14}%`,
            top: `${46 + Math.random() * 12}%`,
            background: 'linear-gradient(to top, transparent, rgba(103,232,249,0.85))',
            borderRadius: 2,
            animationDuration: `${(Math.random() * 0.9 + 0.65).toFixed(2)}s`,
            animationDelay: `${(Math.random() * 0.6).toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ===== Lightning Strike SVG ===== */
const STRIKE_PATH = 'M70 0 L52 98 L78 93 L42 232 L74 227 L48 348 L80 342 L24 540';

function Lightning({ phase }: { phase: number }) {
  if (phase < 1) return null;
  const showStrike = phase >= 2;

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: '50%', top: 0, width: 140, height: '65%', zIndex: 5, transform: 'translateX(-50%)' }}
    >
      {!showStrike && (
        <div className="absolute top-1 left-1/2 -translate-x-1/2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute rounded-full animate-boot-flicker"
              style={{
                width: 2,
                height: 2,
                background: 'rgba(103,232,249,0.8)',
                top: i * 4,
                left: (i - 1) * 6,
                animationDelay: `${i * 55}ms`,
                boxShadow: '0 0 5px rgba(103,232,249,0.9)',
              }}
            />
          ))}
        </div>
      )}

      {showStrike && (
        <svg
          viewBox="0 0 140 540"
          fill="none"
          className="absolute inset-0 w-full h-full animate-lightning-strike"
          preserveAspectRatio="none"
          style={{ transformOrigin: 'top center', left: 0 }}
        >
          <defs>
            <filter id="strikeBloom" x="-80%" y="-3%" width="260%" height="106%">
              <feGaussianBlur stdDeviation="12" />
            </filter>
            <filter id="strikeMidGlow" x="-45%" y="-3%" width="190%" height="106%">
              <feGaussianBlur stdDeviation="4.5" result="glow" />
              <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <linearGradient id="strikeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="12%" stopColor="#f0f9ff" stopOpacity="0.98" />
              <stop offset="40%" stopColor="#67e8f9" stopOpacity="0.88" />
              <stop offset="72%" stopColor="#3b82f6" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.08" />
            </linearGradient>
          </defs>
          <path d={STRIKE_PATH} stroke="#7c3aed" strokeWidth="30" fill="none" opacity="0.07" filter="url(#strikeBloom)" />
          <path d={STRIKE_PATH} stroke="#22d3ee" strokeWidth="14" fill="none" opacity="0.22" filter="url(#strikeBloom)" />
          <path d={STRIKE_PATH} stroke="url(#strikeGrad)" strokeWidth="6" fill="none" opacity="0.62" filter="url(#strikeMidGlow)" />
          <path d={STRIKE_PATH} stroke="white" strokeWidth="1.4" fill="none" opacity="0.97" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M78 93 L106 145 L91 149" stroke="#67e8f9" strokeWidth="1.2" opacity="0.72" strokeLinecap="round" fill="none" />
          <path d="M52 98 L26 148 L40 152" stroke="#a5b4fc" strokeWidth="0.9" opacity="0.62" strokeLinecap="round" fill="none" />
          <path d="M42 232 L14 282 L28 286" stroke="#7dd3fc" strokeWidth="1" opacity="0.58" strokeLinecap="round" fill="none" />
          <path d="M74 227 L104 270 L90 274" stroke="#67e8f9" strokeWidth="0.9" opacity="0.52" strokeLinecap="round" fill="none" />
          <path d="M48 348 L20 390 L35 394" stroke="#93c5fd" strokeWidth="0.7" opacity="0.42" strokeLinecap="round" fill="none" />
        </svg>
      )}
    </div>
  );
}

/* ===== Elegant Energy Arcs ===== */
function ElegantArcs({ visible }: { visible: boolean }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 2.8s ease' }}
      >
        <defs>
          <filter id="arcSoftBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
        </defs>
        <path
          d="M -80 520 C 160 340 520 260 720 460 C 920 660 1100 480 1320 280"
          stroke="rgba(129,140,248,0.2)"
          strokeWidth="0.9"
          fill="none"
          filter="url(#arcSoftBlur)"
          className="arc-breath"
        />
        <path
          d="M 1520 580 C 1280 400 900 330 720 460 C 540 590 340 560 120 670"
          stroke="rgba(34,211,238,0.17)"
          strokeWidth="0.75"
          fill="none"
          filter="url(#arcSoftBlur)"
          className="arc-breath"
          style={{ animationDelay: '3s' }}
        />
        <path
          d="M 280 -60 C 430 170 590 215 720 195 C 850 175 1020 130 1160 -40"
          stroke="rgba(167,139,250,0.15)"
          strokeWidth="0.7"
          fill="none"
          filter="url(#arcSoftBlur)"
          className="arc-breath"
          style={{ animationDelay: '6s' }}
        />
      </svg>
    </div>
  );
}

/* ===== Shockwave Rings ===== */
function ShockwaveRings({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: '50%', top: '44%', zIndex: 3 }}
    >
      {/* Ring 0 — instant inner white flash */}
      <div
        className="absolute rounded-full border-2 border-white/50 animate-shockwave"
        style={{ width: 70, height: 35, marginLeft: -35, marginTop: -17, animationDuration: '0.5s' }}
      />
      {/* Ring 1 — main cyan expansion */}
      <div
        className="absolute rounded-full border border-cyan-400/55 animate-shockwave"
        style={{ width: 360, height: 180, marginLeft: -180, marginTop: -90 }}
      />
      {/* Ring 2 — wider blue follow */}
      <div
        className="absolute rounded-full border border-blue-400/30 animate-shockwave-2"
        style={{ width: 360, height: 180, marginLeft: -180, marginTop: -90 }}
      />
      {/* Ring 3 — outermost faint indigo */}
      <div
        className="absolute rounded-full border border-indigo-400/15 animate-shockwave-2"
        style={{ width: 360, height: 180, marginLeft: -180, marginTop: -90, animationDuration: '2.4s', animationDelay: '0.18s' }}
      />
    </div>
  );
}

/* ===== Legacy Particles alias kept for DataFlowLines/GlowingNodes compat ===== */
function Particles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => {
        const size = Math.random() * 3 + 1;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const duration = Math.random() * 8 + 6;
        const delay = Math.random() * 5;
        const isBlue = Math.random() > 0.4;
        const isOrange = !isBlue && Math.random() > 0.5;
        return (
          <div
            key={i}
            className={`absolute rounded-full animate-float ${isBlue ? 'bg-blue-400/30' : isOrange ? 'bg-orange-400/20' : 'bg-cyan-400/25'}`}
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              top: `${top}%`,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}

/* ===== Data Flow Lines ===== */
function DataFlowLines() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="absolute inset-0 w-full h-full">
        <defs>
            <linearGradient id="scanGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0"    />
              <stop offset="50%"  stopColor="#3b82f6" stopOpacity="0.11" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"    />
            </linearGradient>
            <linearGradient id="scanGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#22d3ee" stopOpacity="0"    />
              <stop offset="50%"  stopColor="#22d3ee" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0"    />
            </linearGradient>
        </defs>
          <line x1="0" y1="32%" x2="100%" y2="32%" stroke="url(#scanGrad1)" strokeWidth="0.5">
            <animate attributeName="x1" values="-10%;110%" dur="10s" repeatCount="indefinite" />
            <animate attributeName="x2" values="0%;120%"   dur="10s" repeatCount="indefinite" />
        </line>
          <line x1="0" y1="60%" x2="100%" y2="60%" stroke="url(#scanGrad2)" strokeWidth="0.4">
            <animate attributeName="x1" values="110%;-10%" dur="13s" repeatCount="indefinite" />
            <animate attributeName="x2" values="120%;0%"   dur="13s" repeatCount="indefinite" />
        </line>
          <line x1="0" y1="80%" x2="100%" y2="80%" stroke="url(#scanGrad1)" strokeWidth="0.3">
            <animate attributeName="x1" values="-10%;110%" dur="16s" repeatCount="indefinite" />
            <animate attributeName="x2" values="0%;120%"   dur="16s" repeatCount="indefinite" />
        </line>
      </svg>
    </div>
  );
}

/* ===== Glowing Nodes ===== */
function GlowingNodes() {
  const nodes = [
    { x: 15, y: 25, size: 4, color: 'blue' },
    { x: 80, y: 20, size: 3, color: 'orange' },
    { x: 45, y: 70, size: 5, color: 'blue' },
    { x: 70, y: 55, size: 3, color: 'cyan' },
    { x: 25, y: 80, size: 4, color: 'blue' },
    { x: 90, y: 65, size: 3, color: 'orange' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none">
      {nodes.map((n, i) => (
        <div
          key={i}
          className="absolute"
          style={{ left: `${n.x}%`, top: `${n.y}%` }}
        >
          <div
            className={`rounded-full animate-dot-pulse ${
              n.color === 'blue' ? 'bg-blue-500/40' : n.color === 'orange' ? 'bg-orange-500/30' : 'bg-cyan-500/35'
            }`}
            style={{ width: n.size, height: n.size }}
          />
          <div
            className={`absolute inset-0 rounded-full animate-pulse-ring ${
              n.color === 'blue' ? 'bg-blue-500/20' : n.color === 'orange' ? 'bg-orange-500/15' : 'bg-cyan-500/20'
            }`}
            style={{ animationDelay: `${i * 0.5}s` }}
          />
        </div>
      ))}
    </div>
  );
}

/* ===== Status Badge ===== */
function StatusBadge({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
      color === 'blue' ? 'bg-blue-500/[0.06] border-blue-500/15 text-blue-400' :
      color === 'emerald' ? 'bg-emerald-500/[0.06] border-emerald-500/15 text-emerald-400' :
      color === 'orange' ? 'bg-orange-500/[0.06] border-orange-500/15 text-orange-400' :
      'bg-cyan-500/[0.06] border-cyan-500/15 text-cyan-400'
    }`}>
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

type GraphTarget = 'auth' | 'billing' | 'teams' | 'data' | null;

type ConsoleTarget = 'auth' | 'billing' | 'teams' | 'data';

/* ===== Command Topology ===== */
function CommandTopology({
  isMobile = false,
  active = true,
  activeTarget = null,
}: {
  isMobile?: boolean;
  active?: boolean;
  activeTarget?: ConsoleTarget | null;
}) {
  const links = [
    { target: 'auth' as const, path: 'M130 84 Q 204 118 270 150', color: '#60a5fa' },
    { target: 'teams' as const, path: 'M410 84 Q 338 118 270 150', color: '#22d3ee' },
    { target: 'billing' as const, path: 'M130 218 Q 205 184 270 150', color: '#a78bfa' },
    { target: 'data' as const, path: 'M410 218 Q 338 184 270 150', color: '#34d399' },
  ];

  const nodes = [
    { x: 130, y: 84, label: 'AUTH', sub: 'JWT + RLS', target: 'auth' as const, color: '#60a5fa' },
    { x: 410, y: 84, label: 'TEAMS', sub: 'RBAC', target: 'teams' as const, color: '#22d3ee' },
    { x: 130, y: 218, label: 'BILLING', sub: 'Stripe', target: 'billing' as const, color: '#a78bfa' },
    { x: 410, y: 218, label: 'DATA', sub: 'Postgres', target: 'data' as const, color: '#34d399' },
  ];

  return (
    <div className="relative rounded-2xl border border-slate-700/30 bg-slate-950/40 p-3 sm:p-4 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-35"
        style={{
          backgroundImage: 'linear-gradient(rgba(30,41,59,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(30,41,59,0.22) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[220px] rounded-full bg-gradient-to-r from-blue-500/10 via-cyan-500/5 to-indigo-500/10 blur-[70px] pointer-events-none" />

      <svg viewBox="0 0 540 300" className={`relative w-full ${isMobile ? 'h-[220px]' : 'h-[285px]'}`}>
        <defs>
          <radialGradient id="consoleCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#312e81" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="270" cy="150" r="94" fill="url(#consoleCoreGlow)" opacity={active ? 0.9 : 0.5}>
          {active && <animate attributeName="r" values="90;106;90" dur="7s" repeatCount="indefinite" />}
        </circle>

        {links.map((link) => {
          const highlighted = activeTarget === link.target;
          return (
            <g key={link.target}>
              <path
                d={link.path}
                stroke={link.color}
                strokeWidth={highlighted ? 2.8 : 1.8}
                fill="none"
                opacity={highlighted ? 0.85 : 0.3}
                style={{ transition: 'all 220ms ease' }}
              />
              {!isMobile && active && (
                <circle r={highlighted ? 2.8 : 2.1} fill={link.color} opacity={highlighted ? 1 : 0.7}>
                  <animateMotion dur={highlighted ? '2.6s' : '3.8s'} repeatCount="indefinite" path={link.path} />
                  <animate attributeName="opacity" values="0;1;1;0" dur={highlighted ? '2.6s' : '3.8s'} repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })}

        {nodes.map((n, i) => {
          const highlighted = activeTarget === n.target;
          return (
            <g key={n.label}>
              <circle cx={n.x} cy={n.y} r={highlighted ? 33 : 30} fill="#0b1220" fillOpacity="0.82" stroke={n.color} strokeOpacity={highlighted ? 0.75 : 0.35} />
              <circle cx={n.x} cy={n.y} r={highlighted ? 39 : 35} fill="none" stroke={n.color} strokeOpacity={highlighted ? 0.45 : 0.16}>
                {active && <animate attributeName="opacity" values="0.35;0.08;0.35" dur="4.8s" begin={`${i * 0.35}s`} repeatCount="indefinite" />}
              </circle>
              <text x={n.x} y={n.y - 2} textAnchor="middle" fill={n.color} fontSize="8" fontFamily="ui-monospace,monospace" fontWeight="700">{n.label}</text>
              <text x={n.x} y={n.y + 10} textAnchor="middle" fill="#64748b" fontSize="6.4" fontFamily="ui-monospace,monospace">{n.sub}</text>
            </g>
          );
        })}

        <g>
          <circle cx="270" cy="150" r="44" fill="#0b1220" stroke="#818cf8" strokeOpacity="0.52" />
          <circle cx="270" cy="150" r="53" fill="none" stroke="#818cf8" strokeOpacity="0.3">
            {active && <animate attributeName="r" values="49;58;49" dur="5.6s" repeatCount="indefinite" />}
          </circle>
          <text x="270" y="146" textAnchor="middle" fill="#c4b5fd" fontSize="11" fontFamily="ui-monospace,monospace" fontWeight="700">NEXUS CORE</text>
          <text x="270" y="160" textAnchor="middle" fill="#64748b" fontSize="6.8" fontFamily="ui-monospace,monospace">ORCHESTRATION LAYER</text>
        </g>
      </svg>
    </div>
  );
}

/* ===== Activity Feed ===== */
function ActivityFeed({ isMobile = false, active = true }: { isMobile?: boolean; active?: boolean }) {
  const events = useMemo(() => ([
    { color: 'blue', msg: 'Session authenticated', org: 'acme-corp', age: 0 },
    { color: 'cyan', msg: 'Role policy refreshed', org: 'startupxyz', age: 8 },
    { color: 'orange', msg: 'Subscription synced', org: 'growthco', age: 22 },
    { color: 'emerald', msg: 'Webhook health passed', org: 'nexus-dev', age: 31 },
  ]), []);
  const [elapsed, setElapsed] = useState(0);
  const [visibleCount, setVisibleCount] = useState(active ? (isMobile ? events.length : 1) : 0);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => window.clearInterval(timer);
  }, [active]);

  useEffect(() => {
    if (!active) {
      setVisibleCount(0);
      return;
    }
    if (isMobile) {
      setVisibleCount(events.length);
      return;
    }
    const timer = window.setInterval(() => {
      setVisibleCount((v) => (v < events.length ? v + 1 : v));
    }, 500);
    return () => window.clearInterval(timer);
  }, [active, events.length, isMobile]);

  const formatAge = (baseAge: number) => {
    const seconds = baseAge + elapsed;
    if (seconds <= 1) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  return (
    <div className="rounded-2xl border border-slate-700/30 bg-slate-950/55 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-700/30 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-300 tracking-wide">Live Activity Stream</span>
        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
          stream.online
          <span className="text-cyan-400 animate-pulse">_</span>
        </span>
      </div>
      <div className="divide-y divide-slate-800/70">
        {events.map((ev, i) => (
          <div
            key={i}
            className="px-4 py-2.5 flex items-center gap-2.5 hover:bg-slate-900/55 transition-colors"
            style={{
              opacity: i < visibleCount ? 1 : 0,
              transform: i < visibleCount ? 'translateY(0px)' : 'translateY(8px)',
              transition: 'opacity 0.35s ease, transform 0.35s ease',
              transitionDelay: `${i * 85}ms`,
            }}
          >
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              ev.color === 'blue' ? 'bg-blue-400' : ev.color === 'cyan' ? 'bg-cyan-400' : ev.color === 'orange' ? 'bg-orange-400' : 'bg-emerald-400'
            }`} />
            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
              ev.color === 'blue' ? 'bg-blue-500/10' : ev.color === 'cyan' ? 'bg-cyan-500/10' : ev.color === 'orange' ? 'bg-orange-500/10' : 'bg-emerald-500/10'
            }`}>
              {ev.color === 'blue' && <Lock className="w-3 h-3 text-blue-400" />}
              {ev.color === 'cyan' && <Users className="w-3 h-3 text-cyan-400" />}
              {ev.color === 'orange' && <CreditCard className="w-3 h-3 text-orange-400" />}
              {ev.color === 'emerald' && <Shield className="w-3 h-3 text-emerald-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-slate-300 truncate">{ev.msg}</p>
              <p className="text-[10px] text-slate-500 font-mono truncate">{ev.org}</p>
            </div>
            <span className="text-[10px] text-slate-500 shrink-0 font-mono">{formatAge(ev.age)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== Logo Section — Energy Core Visualization ===== */
interface LogoSectionProps {
  isMobileOrbit: boolean;
  parallax: { x: number; y: number };
  orbitTech: Array<{ src: string; name: string; glow: string; delay: number }>;
}

// Elegant curved paths from energy core (360, 190) to each logo position.
// Logo x positions assume max-w-3xl centered container ~720px wide with gap-x-14.
// Logo centers: 136, 248, 360, 472, 584  at y ≈ 35 in SVG space.
const EC_CONNECTIONS = [
  { d: 'M 360 190 C 290 185 210 110 136 35', color: '#67e8f9', particleDelay:    0 },
  { d: 'M 360 190 C 345 175 305 110 248 35', color: '#818cf8', particleDelay:  520 },
  { d: 'M 360 190 C 360 158 360  85 360 35', color: '#a78bfa', particleDelay: 1040 },
  { d: 'M 360 190 C 375 175 415 110 472 35', color: '#60a5fa', particleDelay: 1560 },
  { d: 'M 360 190 C 430 185 510 110 584 35', color: '#34d399', particleDelay: 2080 },
];

function LogoSection({ isMobileOrbit, orbitTech }: LogoSectionProps) {
  const [logoPhase, setLogoPhase] = useState(0); // 0=hidden  1=label  2=core+lines  3=logos

  useEffect(() => {
    const t1 = setTimeout(() => setLogoPhase(1), 2200);
    const t2 = setTimeout(() => setLogoPhase(2), 2700);
    const t3 = setTimeout(() => setLogoPhase(3), 3300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const showLabel = logoPhase >= 1;
  const showCore  = logoPhase >= 2;
  const showLogos = logoPhase >= 3;

  return (
    <div className="mt-14">
      {/* Label */}
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-700 mb-8"
        style={{ opacity: showLabel ? 1 : 0, transition: 'opacity 0.6s ease' }}
      >
        Built with
      </p>

      {/* Container — SVG uses height:0 + overflow:visible to draw below logos */}
      <div className="relative max-w-3xl mx-auto">

        {/* Desktop: energy core + connection lines */}
        {!isMobileOrbit && (
          <svg
            viewBox="0 0 720 220"
            className="absolute left-0 top-0 w-full pointer-events-none"
            style={{
              height: 0,
              overflow: 'visible',
              opacity: showCore ? 1 : 0,
              transition: 'opacity 1s ease',
            }}
          >
            <defs>
              <filter id="ecLineGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="ecCoreGlow" x="-150%" y="-150%" width="400%" height="400%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
              <radialGradient id="ecCoreGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ddd6fe" stopOpacity="1" />
                <stop offset="40%" stopColor="#818cf8" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="ecBlobGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </radialGradient>
            </defs>

            <ellipse cx="360" cy="190" rx="46" ry="32" fill="url(#ecBlobGrad)" />

            <g transform="translate(360, 190)">
              {[0, 1.1, 2.2].map((delay, i) => (
                <circle
                  key={i}
                  r="14"
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth="0.6"
                  className="ec-ripple"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </g>

            {EC_CONNECTIONS.map((conn, i) => (
              <g key={i}>
                <path d={conn.d} stroke={conn.color} strokeWidth="3" fill="none" opacity="0.06" filter="url(#ecLineGlow)" />
                <path d={conn.d} stroke={conn.color} strokeWidth="0.75" fill="none" opacity="0.18" />
                <path
                  d={conn.d}
                  stroke={conn.color}
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                  className="ec-particle"
                  style={{ animationDelay: `${conn.particleDelay}ms` }}
                />
              </g>
            ))}

            <circle cx="360" cy="190" r="18" fill="url(#ecCoreGrad)" filter="url(#ecCoreGlow)" className="ec-core-pulse" />
            <circle cx="360" cy="190" r="11" fill="url(#ecCoreGrad)" className="ec-core-pulse" />
            <circle cx="360" cy="190" r="9" fill="none" stroke="#a78bfa" strokeWidth="0.7" opacity="0.55" className="ec-core-pulse" />
            <circle cx="360" cy="190" r="5" fill="none" stroke="#c4b5fd" strokeWidth="0.5" opacity="0.7" className="ec-core-pulse" />
            <circle cx="360" cy="190" r="2.2" fill="#ede9fe" opacity="0.95" />
          </svg>
        )}

        {/* Mobile: minimal core dot only */}
        {isMobileOrbit && showCore && (
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ec-core-pulse"
            style={{ background: 'radial-gradient(circle, #a78bfa 0%, transparent 100%)', filter: 'blur(2px)' }}
          />
        )}

        {/* ── Logo grid ── */}
        <div className={`relative flex ${isMobileOrbit ? 'flex-wrap justify-center gap-x-6 gap-y-8' : 'flex-wrap items-center justify-center gap-x-10 gap-y-8 sm:gap-x-14'}`}>
          {orbitTech.map((tech, i) => (
            <div
              key={tech.name}
              className="group flex flex-col items-center gap-3 cursor-pointer"
              style={{
                opacity: showLogos ? 1 : 0,
                transform: showLogos ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 0.5s ease, transform 0.5s ease',
                transitionDelay: showLogos ? `${i * 90}ms` : '0ms',
              }}
            >
              {/* Logo + glow wrapper */}
              <div className="relative flex items-center justify-center w-14 h-14">
                {/* Ambient logo glow */}
                <div
                  className="absolute inset-0 rounded-full blur-xl pointer-events-none"
                  style={{ background: tech.glow, opacity: 0.14 }}
                />
                {/* Hover bloom */}
                <div
                  className="absolute rounded-full blur-2xl pointer-events-none opacity-0 transition-all duration-400 group-hover:opacity-55"
                  style={{
                    background: tech.glow,
                    width: 72,
                    height: 72,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%,-50%)',
                  }}
                />
                <img
                  src={tech.src}
                  alt={tech.name}
                  className="relative w-11 h-11 object-contain transition-all duration-300 group-hover:scale-110 group-hover:brightness-110 group-hover:saturate-110"
                  style={{
                    filter: 'brightness(0.82) saturate(0.75)',
                    animation: showLogos ? `logoControlledSway ${3.2 + i * 0.18}s ease-in-out infinite` : 'none',
                  }}
                  data-sway-index={i}
                />
              </div>
              <span className="text-[10px] font-medium tracking-wide text-slate-500/80 group-hover:text-slate-300 transition-colors duration-200">
                {tech.name}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}



/* ===== Landing Page ===== */
export default function LandingPage() {
  const parallax = useParallax();
  const introPhase = useCinematicIntro();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileOrbit, setIsMobileOrbit] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  const orbitTech = useMemo(() => ([
    { src: '/react-logo.png',               name: 'React',      glow: 'rgba(103,232,249,0.4)', delay: 120 },
    { src: '/Typescript_logo_2020.svg.png', name: 'TypeScript', glow: 'rgba(96,165,250,0.4)',  delay: 220 },
    { src: '/Vitejs-logo.svg.png',          name: 'Vite',       glow: 'rgba(167,139,250,0.4)', delay: 320 },
    { src: '/stripe-logo.png',              name: 'Stripe',     glow: 'rgba(129,140,248,0.4)', delay: 420 },
    { src: '/node-logo.png',                name: 'Node.js',    glow: 'rgba(74,222,128,0.4)',  delay: 520 },
  ]), []);

  const isFlickerPhase  = introPhase >= 1;
  const isStrikePhase   = introPhase >= 2;
  const isImpactPhase   = introPhase >= 3;
  const isRevealPhase   = introPhase >= 4;
  const isIdlePhase     = introPhase >= 5;
  const { ref: consoleRef, visible: consoleVisible } = useReveal();
  const terminalLines = useMemo(() => ([
    'Initializing tenant environment...',
    'Auth layer validated',
    'Stripe billing synced',
    'RBAC policies applied',
    'Realtime streams connected',
    'Deploying Nexus orchestration layer...',
    'System online',
  ]), []);
  const [terminalLineIndex, setTerminalLineIndex] = useState(0);
  const [typedChars, setTypedChars] = useState(0);

  useEffect(() => {
    if (!consoleVisible) {
      setTerminalLineIndex(0);
      setTypedChars(0);
      return;
    }

    const currentLine = terminalLines[terminalLineIndex];
    if (!currentLine) return;

    if (typedChars < currentLine.length) {
      const typingTimer = window.setTimeout(() => setTypedChars((prev) => prev + 1), 24);
      return () => window.clearTimeout(typingTimer);
    }

    if (terminalLineIndex < terminalLines.length - 1) {
      const nextLineTimer = window.setTimeout(() => {
        setTerminalLineIndex((prev) => prev + 1);
        setTypedChars(0);
      }, 240);
      return () => window.clearTimeout(nextLineTimer);
    }
  }, [consoleVisible, terminalLineIndex, terminalLines, typedChars]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobileOrbit(window.innerWidth < 640);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden">
      {/* ===== NAVBAR ===== */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass-strong shadow-xl shadow-black/20' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-600/25">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Nexus</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#architecture" className="text-sm text-slate-400 hover:text-white transition-colors">Architecture</a>
            <a href="#pricing" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-2">
              Sign In
            </Link>
            <Link
              to="/signup"
              className="group inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/35 active:scale-[0.98] hover:shadow-[0_0_24px_rgba(59,130,246,0.3)]"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Deep background layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#060d1f] to-[#020617]" />

        {/* Pre-strike ambient flicker at top center */}
        {isFlickerPhase && !isStrikePhase && (
          <div
            className="absolute pointer-events-none animate-boot-flicker"
            style={{
              top: 0, left: '50%', transform: 'translateX(-50%)',
              width: 320, height: 180,
              background: 'radial-gradient(ellipse 50% 100% at 50% 0%, rgba(103,232,249,0.09) 0%, transparent 80%)',
              zIndex: 6,
            }}
          />
        )}
        {/* Impact flash — brief bloom when strike hits */}
        {isImpactPhase && (
          <div
            className="absolute inset-0 pointer-events-none animate-impact-flash"
            style={{
              background: 'radial-gradient(ellipse 55% 45% at 50% 42%, rgba(255,255,255,0.1) 0%, rgba(103,232,249,0.05) 40%, transparent 70%)',
              zIndex: 6,
            }}
          />
        )}

        {/* Shockwave rings (appear on strike) */}
        <ShockwaveRings visible={isImpactPhase} />

        {/* Elegant energy arcs — fade in with content reveal */}
        <ElegantArcs visible={isRevealPhase} />

        {/* Lightning strike — phase-aware: pre-flicker + strike */}
        <Lightning phase={introPhase} />

        {/* Ambient radial glow — seeds at impact, expands through reveal */}
        <div
          className="absolute pointer-events-none transition-all duration-[2200ms] ease-out"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width:   isIdlePhase ? 1000 : isRevealPhase ? 750 : isImpactPhase ? 460 : 200,
            height:  isIdlePhase ? 750  : isRevealPhase ? 540 : isImpactPhase ? 320 : 120,
            background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.07) 0%, rgba(96,165,250,0.03) 50%, transparent 75%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            zIndex: 2,
            opacity: isImpactPhase ? 1 : 0,
          }}
        />
        {/* Secondary warm glow */}
        <div
          className="absolute pointer-events-none transition-all duration-[2500ms] ease-out"
          style={{
            top: '55%',
            left: '48%',
            transform: 'translate(-50%, -50%)',
            width: isIdlePhase ? 500 : 200,
            height: isIdlePhase ? 300 : 100,
            background: 'radial-gradient(ellipse at center, rgba(251,146,60,0.04) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(80px)',
            zIndex: 2,
            opacity: isIdlePhase ? 1 : 0,
          }}
        />

        {/* Parallax dragons (fade in during idle) */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-700 ease-out"
          style={{
            transform: `translate(${parallax.x * 0.8}px, ${parallax.y * 0.6}px)`,
            opacity: isIdlePhase ? 1 : 0,
            zIndex: 1,
          }}
        >
          <DragonSilhouette
            className="absolute w-72 h-44 text-blue-500/[0.08] animate-[dragonFly1_25s_ease-in-out_infinite]"
            style={{ top: '8%', right: '5%' }}
          />
          <DragonSilhouette2
            className="absolute w-56 h-36 text-orange-500/[0.06] animate-[dragonFly2_30s_ease-in-out_infinite]"
            style={{ top: '55%', left: '2%' }}
          />
          <DragonSilhouette
            className="absolute w-48 h-32 text-cyan-500/[0.05] animate-[dragonFly3_35s_ease-in-out_infinite]"
            style={{ bottom: '15%', right: '15%' }}
          />
        </div>

        {/* Ambient particles — phase-aware opacity */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translate(${parallax.x * 0.3}px, ${parallax.y * 0.2}px)`,
            zIndex: 1,
          }}
        >
          <AmbientParticles phase={introPhase} />
        </div>

        {/* Data flow lines */}
        <div style={{ opacity: isIdlePhase ? 1 : 0, transition: 'opacity 1.5s ease', zIndex: 1 }}>
          <DataFlowLines />
        </div>

        {/* Glowing nodes */}
        <div style={{ opacity: isIdlePhase ? 1 : 0, transition: 'opacity 1.5s ease 0.5s', zIndex: 1 }}>
          <GlowingNodes />
        </div>

        {/* ===== HERO CONTENT ===== */}
        <div
          className="relative max-w-4xl mx-auto px-6 text-center"
          style={{ zIndex: 10 }}
        >
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/[0.08] border border-blue-500/20 mb-8 transition-all duration-700 ${
              isRevealPhase ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: isRevealPhase ? '0ms' : '0ms' }}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-medium text-blue-400">Multi-Tenant SaaS Command Platform</span>
          </div>

          {/* Headline */}
          <h1
            className={`text-5xl sm:text-6xl lg:text-[4.5rem] font-bold tracking-tight leading-[1.06] mb-6 ${
              isRevealPhase ? 'animate-headline-reveal animate-text-shake' : 'opacity-0'
            }`}
            style={{
              textShadow: isRevealPhase
                ? '0 0 60px rgba(147,197,253,0.35), 0 0 120px rgba(59,130,246,0.2)'
                : 'none',
              animationDuration: isRevealPhase ? '1s, 0.45s' : undefined,
            }}
          >
            Control Your SaaS Stack.
            <br />
            <span
              className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]"
              style={{
                filter: isRevealPhase ? 'drop-shadow(0 0 20px rgba(147,197,253,0.5))' : 'none',
                transition: 'filter 1.5s ease',
              }}
            >
              Ship Faster.
            </span>
            <br />
            Scale Smarter.
          </h1>

          {/* Subheadline */}
          <p
            className={`text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-700 ${
              isRevealPhase ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: isRevealPhase ? '420ms' : '0ms' }}
          >
            A modern SaaS operations platform for authentication, billing, team roles, and real-time
            product visibility — built to help teams move faster with confidence.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-14 transition-all duration-700 ${
              isRevealPhase ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: isRevealPhase ? '700ms' : '0ms' }}
          >
            <Link
              to="/signup"
              className="group relative inline-flex items-center gap-2.5 px-9 py-4 bg-blue-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-xl shadow-blue-600/30 hover:bg-blue-500 hover:scale-[1.03] hover:shadow-[0_0_48px_rgba(59,130,246,0.5)] active:scale-[0.98] text-base overflow-hidden"
            >
              {/* Shine sweep on hover */}
              <span className="absolute inset-0 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-15deg]" />
              Get Started
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <a
              href="#features"
              className="group inline-flex items-center gap-2.5 px-9 py-4 bg-slate-800/60 text-slate-200 font-medium rounded-xl border border-slate-700/50 backdrop-blur-sm transition-all duration-300 hover:bg-slate-700/60 hover:border-slate-500/60 hover:scale-[1.03] hover:shadow-lg hover:shadow-slate-900/50 active:scale-[0.98] text-base"
            >
              <Play className="w-4 h-4 text-blue-400 transition-transform duration-300 group-hover:scale-110" />
              View Demo
            </a>
          </div>

          {/* ===== TECH LOGO STRIP WITH ENERGY CONTROL ===== */}
          <LogoSection isMobileOrbit={isMobileOrbit} parallax={parallax} orbitTech={orbitTech} />
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#020617] to-transparent pointer-events-none" style={{ zIndex: 10 }} />
      </section>

      {/* ===== SYSTEM STATUS BAR ===== */}
      <section className="relative py-12 border-y border-slate-800/30">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <StatusBadge icon={<Lock className="w-3.5 h-3.5" />} label="Auth Secure" color="blue" />
            <StatusBadge icon={<Users className="w-3.5 h-3.5" />} label="Teams Synced" color="emerald" />
            <StatusBadge icon={<CreditCard className="w-3.5 h-3.5" />} label="Billing Ready" color="orange" />
            <StatusBadge icon={<Shield className="w-3.5 h-3.5" />} label="Data Isolated" color="cyan" />
          </div>
        </div>
      </section>

      {/* ===== COMMAND LAYER ===== */}
      <section id="features" ref={consoleRef} className="relative py-20 sm:py-28">
        <div id="architecture" className="absolute -top-16" />

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'linear-gradient(rgba(30,41,59,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(30,41,59,0.16) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 w-[980px] h-[560px] rounded-full bg-blue-500/[0.05] blur-[160px]" />
          <div className="absolute left-[28%] top-[35%] w-[360px] h-[360px] rounded-full bg-indigo-500/[0.045] blur-[120px]" />
          <div className="absolute right-[18%] bottom-[18%] w-[320px] h-[320px] rounded-full bg-cyan-500/[0.04] blur-[110px]" />
          {!isMobileOrbit && Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`ops-particle-${i}`}
              className="absolute rounded-full bg-blue-300/20"
              style={{
                width: 2,
                height: 2,
                left: `${8 + i * 7}%`,
                top: `${18 + (i % 5) * 13}%`,
                animation: `subtleFloat ${4.8 + (i % 4) * 0.8}s ease-in-out infinite`,
                animationDelay: `${i * 0.25}s`,
                boxShadow: '0 0 8px rgba(103,232,249,0.35)',
              }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className={`mb-11 sm:mb-14 transition-all duration-700 ${consoleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300/75 mb-3">Command Layer</p>
            <h2 className="text-3xl sm:text-[2.6rem] font-semibold tracking-[-0.02em] leading-[1.05] mb-4 text-slate-100">
              Live SaaS Operations Console
            </h2>
            <p className="text-slate-400 max-w-4xl text-sm sm:text-[15px] leading-relaxed">
              Monitor tenants, billing, permissions, and activity from one real-time command layer — built for teams that need clarity at scale.
            </p>
          </div>

          {/* Live SaaS Command Terminal */}
          <div className="relative mt-6 sm:mt-10">
            <div className="relative h-[620px] sm:h-[680px] max-w-6xl mx-auto">
              {/* Atmospheric background */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 w-[980px] h-[560px] rounded-full bg-indigo-500/[0.08] blur-[90px]" />
                <div className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 w-[620px] h-[360px] rounded-full bg-cyan-500/[0.07] blur-[70px]" />
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 92% 82% at 50% 50%, transparent 35%, rgba(2,6,23,0.6) 100%)' }} />

                {!isMobileOrbit && Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={`terminal-particle-${i}`}
                    className="absolute rounded-full"
                    style={{
                      width: i % 3 === 0 ? 2 : 1.5,
                      height: i % 3 === 0 ? 2 : 1.5,
                      left: `${6 + i * 3.8}%`,
                      top: `${20 + (i % 7) * 9}%`,
                      background: i % 2 === 0 ? 'rgba(99,102,241,0.45)' : 'rgba(34,211,238,0.42)',
                      boxShadow: i % 2 === 0 ? '0 0 8px rgba(99,102,241,0.5)' : '0 0 8px rgba(34,211,238,0.45)',
                      animation: `subtleFloat ${6 + (i % 5) * 0.9}s ease-in-out infinite`,
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}

                {/* subtle arcs */}
                <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1200 680" fill="none" preserveAspectRatio="none">
                  <path d="M120 500 C 260 410, 470 400, 600 450" stroke="url(#arc1)" strokeWidth="1.1" />
                  <path d="M1080 500 C 920 392, 710 380, 600 450" stroke="url(#arc2)" strokeWidth="1.1" />
                  <defs>
                    <linearGradient id="arc1" x1="120" y1="500" x2="600" y2="450" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#60a5fa" stopOpacity="0" />
                      <stop offset="0.6" stopColor="#60a5fa" stopOpacity="0.42" />
                      <stop offset="1" stopColor="#22d3ee" stopOpacity="0.12" />
                    </linearGradient>
                    <linearGradient id="arc2" x1="1080" y1="500" x2="600" y2="450" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#22d3ee" stopOpacity="0" />
                      <stop offset="0.6" stopColor="#22d3ee" stopOpacity="0.42" />
                      <stop offset="1" stopColor="#a78bfa" stopOpacity="0.14" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* very subtle topology behind terminal */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[40%] w-[760px] opacity-[0.22] scale-110 blur-[0.3px]">
                  <CommandTopology isMobile={false} active={consoleVisible} activeTarget={null} />
                </div>
              </div>

              {/* Terminal centerpiece */}
              <div
                className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 z-20 w-full max-w-[940px] px-2 sm:px-6"
                style={{
                  opacity: consoleVisible ? 1 : 0,
                  transform: consoleVisible
                    ? 'translate(-50%, -50%) perspective(1400px) rotateX(1.5deg)'
                    : 'translate(-50%, -46%) perspective(1400px) rotateX(1.5deg)',
                  transition: 'opacity 0.75s ease, transform 0.75s ease',
                }}
              >
                <div
                  className="relative overflow-hidden rounded-2xl sm:rounded-3xl"
                  style={{
                    background: 'linear-gradient(180deg, rgba(9,14,30,0.82) 0%, rgba(6,10,22,0.9) 100%)',
                    border: '1px solid rgba(148,163,184,0.18)',
                    backdropFilter: 'blur(28px)',
                    boxShadow: '0 34px 100px rgba(2,6,23,0.72), 0 0 0 1px rgba(255,255,255,0.025), 0 0 65px rgba(56,189,248,0.08) inset',
                    animation: 'subtleFloat 8.4s ease-in-out infinite',
                  }}
                >
                  {/* noise + scanline texture */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 0.55px, transparent 0.55px), repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)',
                      backgroundSize: '3px 3px, 100% 4px',
                      opacity: 0.33,
                    }}
                  />

                  {/* top chrome */}
                  <div className="relative z-10 px-4 sm:px-6 py-3.5 border-b border-slate-700/45 flex items-center justify-between bg-slate-950/28">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400/60" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
                      </div>
                      <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                        <span>nexus-orchestrator</span>
                        <span className="w-px h-3 bg-slate-700/70" />
                        <span className="text-slate-400">prod-cluster-01</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 text-[10px] font-mono">
                      <span className="inline-flex items-center gap-1 text-emerald-300/85">
                        <span className="relative flex w-1.5 h-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
                          <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-400" />
                        </span>
                        live
                      </span>
                      <span className="text-slate-500">v2.4.1</span>
                    </div>
                  </div>

                  {/* terminal stream */}
                  <div className="relative z-10 px-4 sm:px-7 py-4 sm:py-6 min-h-[340px] sm:min-h-[380px] font-mono">
                    <div className="space-y-2.5 sm:space-y-3">
                      {terminalLines.map((line, index) => {
                        const done = index < terminalLineIndex;
                        const activeLine = index === terminalLineIndex;
                        const hidden = index > terminalLineIndex;
                        const typedText = activeLine ? line.slice(0, typedChars) : (done ? line : '');
                        return (
                          <div
                            key={line}
                            className="group flex items-start gap-2.5 sm:gap-3 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 transition-all duration-500"
                            style={{
                              opacity: hidden ? 0 : 1,
                              transform: hidden ? 'translateY(8px)' : 'translateY(0)',
                              background: done || activeLine ? 'rgba(148,163,184,0.03)' : 'transparent',
                            }}
                          >
                            <span className="mt-[2px] shrink-0" style={{ color: done ? 'rgba(34,197,94,0.8)' : activeLine ? 'rgba(56,189,248,0.85)' : 'rgba(100,116,139,0.5)' }}>
                              {done ? '>' : activeLine ? '$' : '·'}
                            </span>
                            <span className="text-[12px] sm:text-[13px] leading-relaxed tracking-[0.01em]" style={{ color: done ? 'rgba(203,213,225,0.92)' : activeLine ? 'rgba(224,242,254,0.92)' : 'rgba(148,163,184,0.45)' }}>
                              {typedText}
                              {activeLine && (
                                <span className="ml-0.5 inline-block w-[8px] h-[1.1em] align-[-2px] bg-cyan-300/85 animate-pulse" style={{ boxShadow: '0 0 8px rgba(34,211,238,0.65)' }} />
                              )}
                            </span>
                            {(done || activeLine) && (
                              <span
                                className="ml-auto mt-0.5 h-2 w-2 rounded-full shrink-0"
                                style={{
                                  background: done ? 'rgba(34,197,94,0.75)' : 'rgba(56,189,248,0.75)',
                                  boxShadow: done ? '0 0 8px rgba(34,197,94,0.55)' : '0 0 8px rgba(56,189,248,0.55)',
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-700/40 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500">
                      <span className="font-mono">stream.online</span>
                      <span className="font-mono text-cyan-300/70">NEXUS ORCHESTRATION ACTIVE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-6">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 transition-colors"
            >
              Explore the command layer
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="relative py-24 sm:py-32 border-t border-slate-800/30">
        <div className="max-w-5xl mx-auto px-6">
          <SectionHeader
            label="Pricing"
            title="Simple, transparent pricing"
            subtitle="Start free. Upgrade when your team is ready."
          />
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <PricingCard
              name="Free"
              price="$0"
              period="forever"
              description="For small teams getting started"
              features={['Up to 5 team members', 'Basic dashboard', 'Activity logging', 'Email notifications', 'Community support']}
              cta="Get Started"
              delay={100}
            />
            <PricingCard
              name="Pro"
              price="$29"
              period="/month"
              description="For growing teams that need more"
              features={['Unlimited team members', 'Advanced analytics', 'Priority support', 'Custom integrations', 'Audit trail & exports', 'Stripe billing portal']}
              cta="Start Free Trial"
              highlighted
              delay={200}
            />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#020617]" />
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-slate-800/40 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-400">Nexus</span>
          </div>
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} Nexus. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ===== Section Header ===== */
function SectionHeader({ label, title, subtitle }: { label: string; title: string; subtitle: string }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={`text-center mb-16 ${visible ? 'animate-fade-in-up' : 'opacity-0'}`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-blue-400/80 mb-3">{label}</p>
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">{title}</h2>
      <p className="text-slate-400 max-w-xl mx-auto">{subtitle}</p>
    </div>
  );
}

/* ===== Pricing Card ===== */
function PricingCard({ name, price, period, description, features, cta, highlighted, delay = 0 }: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  delay?: number;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`relative p-7 rounded-2xl border backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 ${
        visible ? 'animate-fade-in-up' : 'opacity-0'
      } ${
        highlighted
          ? 'bg-gradient-to-br from-blue-600/10 via-slate-900/80 to-orange-600/5 border-blue-500/25 shadow-xl shadow-blue-600/10'
          : 'bg-slate-900/60 border-slate-800/60 hover:border-slate-700/60'
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg shadow-blue-600/30">
          Most Popular
        </div>
      )}
      <h3 className="text-lg font-bold text-white">{name}</h3>
      <p className="text-sm text-slate-400 mt-1 mb-5">{description}</p>
      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-4xl font-bold text-white tracking-tight">{price}</span>
        <span className="text-slate-500 text-sm">{period}</span>
      </div>
      <ul className="space-y-3 mb-7">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <span className="text-sm text-slate-300">{f}</span>
          </li>
        ))}
      </ul>
      <Link
        to="/signup"
        className={`block w-full text-center px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 active:scale-[0.98] ${
          highlighted
            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 hover:shadow-[0_0_24px_rgba(59,130,246,0.3)]'
            : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 hover:border-slate-600/60'
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

