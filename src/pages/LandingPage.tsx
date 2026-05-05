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
// phase: 0=dark  1=strike  2=reveal  3=idle
type IntroPhase = 0 | 1 | 2 | 3;

function useCinematicIntro() {
  const [phase, setPhase] = useState<IntroPhase>(0);
  useEffect(() => {
    // tiny initial pause so the page has painted
    const t0 = setTimeout(() => setPhase(1), 200);
    const t1 = setTimeout(() => setPhase(2), 900);
    const t2 = setTimeout(() => setPhase(3), 2200);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
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

/* ===== Electric Particles ===== */
function ElectricParticles({ active }: { active: boolean }) {
  const particles = useMemo(() => Array.from({ length: 36 }).map((_, i) => ({
    id: i,
    size: Math.random() * 2.5 + 0.8,
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: Math.random() * 7 + 5,
    delay: Math.random() * 6,
    sparkDuration: (Math.random() * 1.2 + 0.6).toFixed(2),
    sparkDelay: (Math.random() * 3).toFixed(2),
    isElectric: Math.random() > 0.55,
    isOrange: Math.random() > 0.75,
  })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-full transition-opacity duration-700 ${active ? 'opacity-100' : 'opacity-0'} ${
            p.isElectric ? 'bg-cyan-300/40' : p.isOrange ? 'bg-orange-400/25' : 'bg-blue-400/30'
          } animate-float`}
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            boxShadow: p.isElectric
              ? `0 0 ${p.size * 3}px rgba(103,232,249,0.6)`
              : p.isOrange
              ? `0 0 ${p.size * 2}px rgba(251,146,60,0.4)`
              : `0 0 ${p.size * 2}px rgba(96,165,250,0.4)`,
          }}
        />
      ))}
      {/* Rising electric sparks post-strike */}
      {active && Array.from({ length: 14 }).map((_, i) => (
        <div
          key={`spark-${i}`}
          className="absolute animate-spark-float"
          style={{
            width: 2,
            height: Math.random() * 8 + 4,
            left: `${40 + Math.random() * 20}%`,
            top: `${45 + Math.random() * 20}%`,
            background: `linear-gradient(to top, transparent, ${
              Math.random() > 0.5 ? 'rgba(103,232,249,0.9)' : 'rgba(147,197,253,0.8)'
            })`,
            borderRadius: 2,
            animationDuration: `${(Math.random() * 1.2 + 0.8).toFixed(2)}s`,
            animationDelay: `${(Math.random() * 1.5).toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ===== Lightning Bolt SVG ===== */
function Lightning({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: '50%',
        top: '-2%',
        width: 120,
        height: '65%',
        zIndex: 5,
      }}
    >
      {/* Main bolt */}
      <svg
        viewBox="0 0 120 500"
        fill="none"
        className="absolute inset-0 w-full h-full animate-lightning-strike"
        style={{ transformOrigin: 'top center', left: 0 }}
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="lightningBlur">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <linearGradient id="lightningGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#e0f2fe" stopOpacity="1" />
            <stop offset="30%" stopColor="#7dd3fc" stopOpacity="0.95" />
            <stop offset="65%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="lightningGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#bae6fd" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Outer glow pass */}
        <path
          d="M60 0 L42 130 L68 128 L38 280 L74 275 L25 500"
          stroke="url(#lightningGlow)"
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#lightningBlur)"
          opacity="0.5"
        />
        {/* Main bolt path */}
        <path
          d="M60 0 L42 130 L68 128 L38 280 L74 275 L25 500"
          stroke="url(#lightningGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Branch 1 */}
        <path
          d="M68 128 L90 175 L78 178"
          stroke="#93c5fd"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
        {/* Branch 2 */}
        <path
          d="M38 280 L12 318 L22 322"
          stroke="#7dd3fc"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Branch 3 */}
        <path
          d="M74 275 L98 305 L88 308"
          stroke="#93c5fd"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
    </div>
  );
}

/* ===== Electric Arcs ===== */
function ElectricArcs({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 4 }}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="arcGlow">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Arc left */}
        <path
          d="M 680 120 Q 540 240 480 400 Q 450 500 510 560"
          stroke="#7dd3fc" strokeWidth="1.2" fill="none" opacity="0.55"
          filter="url(#arcGlow)"
          className="animate-arc-flicker"
          style={{ animationDelay: '0s' }}
        />
        {/* Arc right */}
        <path
          d="M 760 120 Q 900 230 950 380 Q 980 490 930 560"
          stroke="#93c5fd" strokeWidth="1" fill="none" opacity="0.45"
          filter="url(#arcGlow)"
          className="animate-arc-flicker"
          style={{ animationDelay: '0.08s' }}
        />
        {/* Wide arc left */}
        <path
          d="M 700 140 Q 380 320 340 520 Q 320 620 400 680"
          stroke="#3b82f6" strokeWidth="0.8" fill="none" opacity="0.3"
          filter="url(#arcGlow)"
          className="animate-arc-flicker"
          style={{ animationDelay: '0.15s' }}
        />
        {/* Wide arc right */}
        <path
          d="M 740 140 Q 1060 300 1100 500 Q 1120 600 1040 670"
          stroke="#60a5fa" strokeWidth="0.8" fill="none" opacity="0.3"
          filter="url(#arcGlow)"
          className="animate-arc-flicker"
          style={{ animationDelay: '0.12s' }}
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
      style={{ left: '50%', top: '42%', zIndex: 3 }}
    >
      <div
        className="absolute rounded-full border border-blue-400/50 animate-shockwave"
        style={{ width: 320, height: 160, marginLeft: -160, marginTop: -80 }}
      />
      <div
        className="absolute rounded-full border border-cyan-400/30 animate-shockwave-2"
        style={{ width: 320, height: 160, marginLeft: -160, marginTop: -80 }}
      />
      {/* Inner bright flash ring */}
      <div
        className="absolute rounded-full border-2 border-white/20 animate-shockwave"
        style={{ width: 120, height: 60, marginLeft: -60, marginTop: -30, animationDuration: '0.7s' }}
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
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="flowGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="flowGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0" />
            <stop offset="50%" stopColor="#f97316" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Horizontal flow lines */}
        <line x1="0" y1="30%" x2="100%" y2="30%" stroke="url(#flowGrad1)" strokeWidth="0.5">
          <animate attributeName="x1" values="-10%;110%" dur="8s" repeatCount="indefinite" />
          <animate attributeName="x2" values="0%;120%" dur="8s" repeatCount="indefinite" />
        </line>
        <line x1="0" y1="55%" x2="100%" y2="55%" stroke="url(#flowGrad2)" strokeWidth="0.5">
          <animate attributeName="x1" values="110%;-10%" dur="10s" repeatCount="indefinite" />
          <animate attributeName="x2" values="120%;0%" dur="10s" repeatCount="indefinite" />
        </line>
        <line x1="0" y1="75%" x2="100%" y2="75%" stroke="url(#flowGrad1)" strokeWidth="0.3">
          <animate attributeName="x1" values="-10%;110%" dur="12s" repeatCount="indefinite" />
          <animate attributeName="x2" values="0%;120%" dur="12s" repeatCount="indefinite" />
        </line>
        {/* Diagonal flow */}
        <line x1="10%" y1="0" x2="90%" y2="100%" stroke="url(#flowGrad1)" strokeWidth="0.3" opacity="0.5">
          <animate attributeName="opacity" values="0;0.3;0" dur="6s" repeatCount="indefinite" />
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

/* ===== Command Topology ===== */
function CommandTopology({ isMobile = false }: { isMobile?: boolean }) {
  return (
    <div className="relative rounded-[22px] bg-slate-900/40 p-5 sm:p-6 backdrop-blur-xl overflow-hidden shadow-[0_24px_70px_rgba(2,6,23,0.55)]">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.06] via-transparent to-indigo-500/[0.05] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none opacity-35" style={{
        backgroundImage: 'linear-gradient(rgba(30,41,59,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(30,41,59,0.25) 1px, transparent 1px)',
        backgroundSize: '26px 26px'
      }} />

      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 10px #4ade80' }}>
            <div className="absolute inset-0 rounded-full bg-emerald-400/50 animate-ping" />
          </div>
          <span className="text-xs font-medium tracking-wide text-slate-300">Nexus Core Live</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono tracking-[0.24em]">RT ORCHESTRATOR</span>
      </div>

      <div className="relative rounded-2xl bg-slate-950/45">
        <div className="absolute inset-0 pointer-events-none rounded-2xl bg-gradient-to-r from-blue-500/[0.04] via-transparent to-indigo-500/[0.04]" />
        <svg viewBox="0 0 540 300" className={`w-full ${isMobile ? 'h-[220px]' : 'h-[270px]'}`}>
          <defs>
            <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#312e81" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="linkBlue" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="linkOrange" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#fdba74" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="linkGreen" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#34d399" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* breathing background */}
          <circle cx="270" cy="150" r="96" fill="url(#coreGlow)">
            <animate attributeName="r" values="92;108;92" dur="8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.75;0.95;0.75" dur="8s" repeatCount="indefinite" />
          </circle>

          {/* links */}
          <g opacity="0.9">
            <path d="M130 84 Q 204 118 270 150" stroke="url(#linkBlue)" strokeWidth="2" fill="none" />
            <path d="M410 84 Q 338 118 270 150" stroke="url(#linkBlue)" strokeWidth="2" fill="none" />
            <path d="M130 218 Q 205 184 270 150" stroke="url(#linkOrange)" strokeWidth="2" fill="none" />
            <path d="M410 218 Q 338 184 270 150" stroke="url(#linkGreen)" strokeWidth="2" fill="none" />
          </g>

          {/* flowing particles */}
          {!isMobile && (
            <>
              <circle r="2.4" fill="#60a5fa">
                <animateMotion dur="3.4s" repeatCount="indefinite" path="M130,84 Q204,118 270,150" />
                <animate attributeName="opacity" values="0;1;1;0" dur="3.4s" repeatCount="indefinite" />
              </circle>
              <circle r="2.2" fill="#67e8f9">
                <animateMotion dur="3.7s" begin="0.8s" repeatCount="indefinite" path="M410,84 Q338,118 270,150" />
                <animate attributeName="opacity" values="0;1;1;0" dur="3.7s" begin="0.8s" repeatCount="indefinite" />
              </circle>
              <circle r="2.3" fill="#fb923c">
                <animateMotion dur="4s" begin="1.1s" repeatCount="indefinite" path="M130,218 Q205,184 270,150" />
                <animate attributeName="opacity" values="0;1;1;0" dur="4s" begin="1.1s" repeatCount="indefinite" />
              </circle>
              <circle r="2.2" fill="#34d399">
                <animateMotion dur="3.8s" begin="1.6s" repeatCount="indefinite" path="M410,218 Q338,184 270,150" />
                <animate attributeName="opacity" values="0;1;1;0" dur="3.8s" begin="1.6s" repeatCount="indefinite" />
              </circle>
            </>
          )}

          {/* side nodes */}
          {[
            { x: 130, y: 84,  label: 'AUTH',   sub: 'JWT + RLS', color: '#60a5fa' },
            { x: 410, y: 84,  label: 'TEAMS',  sub: 'RBAC',      color: '#22d3ee' },
            { x: 130, y: 218, label: 'BILLING',sub: 'Stripe',    color: '#fb923c' },
            { x: 410, y: 218, label: 'DATA',   sub: 'Postgres',  color: '#34d399' },
          ].map((n) => (
            <g key={n.label}>
              <circle cx={n.x} cy={n.y} r="29" fill="#0b1220" fillOpacity="0.8" stroke={n.color} strokeOpacity="0.35" />
              <circle cx={n.x} cy={n.y} r="33" fill="none" stroke={n.color} strokeOpacity="0.2">
                <animate attributeName="r" values="30;35;30" dur="4.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.25;0.05;0.25" dur="4.4s" repeatCount="indefinite" />
              </circle>
              <text x={n.x} y={n.y - 2} textAnchor="middle" fill={n.color} fontSize="8" fontFamily="ui-monospace,monospace" fontWeight="700">{n.label}</text>
              <text x={n.x} y={n.y + 10} textAnchor="middle" fill="#475569" fontSize="6.4" fontFamily="ui-monospace,monospace">{n.sub}</text>
            </g>
          ))}

          {/* core node */}
          <g>
            <circle cx="270" cy="150" r="44" fill="#0b1220" stroke="#818cf8" strokeOpacity="0.45" />
            <circle cx="270" cy="150" r="52" fill="none" stroke="#818cf8" strokeOpacity="0.28">
              <animate attributeName="r" values="48;58;48" dur="5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.35;0.08;0.35" dur="5s" repeatCount="indefinite" />
            </circle>
            <text x="270" y="146" textAnchor="middle" fill="#c4b5fd" fontSize="11" fontFamily="ui-monospace,monospace" fontWeight="700">NEXUS CORE</text>
            <text x="270" y="160" textAnchor="middle" fill="#64748b" fontSize="6.8" fontFamily="ui-monospace,monospace">ORCHESTRATION LAYER</text>
          </g>
        </svg>
      </div>
    </div>
  );
}

/* ===== Activity Feed ===== */
function ActivityFeed({ isMobile = false }: { isMobile?: boolean }) {
  const events = useMemo(() => ([
    { color: 'blue',    msg: 'Session authenticated', org: 'acme-corp',  age: 0 },
    { color: 'cyan',    msg: 'Team member invited',   org: 'startupxyz', age: 2 },
    { color: 'orange',  msg: 'Subscription synced',   org: 'growthco',   age: 7 },
    { color: 'emerald', msg: 'Policy check passed',   org: 'nexus-dev',  age: 14 },
  ]), []);
  const [elapsed, setElapsed] = useState(0);
  const [visibleCount, setVisibleCount] = useState(isMobile ? events.length : 1);

  useEffect(() => {
    const timer = window.setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setVisibleCount(events.length);
      return;
    }
    const timer = window.setInterval(() => {
      setVisibleCount((v) => (v < events.length ? v + 1 : v));
    }, 450);
    return () => window.clearInterval(timer);
  }, [events.length, isMobile]);

  const formatAge = (baseAge: number) => {
    const seconds = baseAge + elapsed;
    if (seconds <= 1) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  return (
    <div className="rounded-2xl bg-slate-900/35 backdrop-blur-xl overflow-hidden shadow-[0_20px_50px_rgba(2,6,23,0.45)]">
      <div className="px-5 py-3 border-b border-slate-700/20 flex items-center justify-between bg-slate-900/30">
        <div className="flex items-center gap-2">
          <div className="relative w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 8px #4ade80' }}>
            <div className="absolute inset-0 rounded-full bg-emerald-400/50 animate-ping" />
          </div>
          <span className="text-xs font-semibold text-slate-300">Live Activity Stream</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
          stream.online
          <span className="text-blue-400 animate-pulse">_</span>
        </span>
      </div>
      <div className="divide-y divide-slate-700/20">
        {events.map((ev, i) => (
          <div
            key={i}
            className="px-5 py-2.5 flex items-center gap-3 hover:bg-slate-800/20 transition-colors"
            style={{
              opacity: i < visibleCount ? 1 : 0,
              transform: i < visibleCount ? 'translateY(0px)' : 'translateY(8px)',
              transition: 'opacity 0.35s ease, transform 0.35s ease',
            }}
          >
            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
              ev.color === 'blue' ? 'bg-blue-500/10' : ev.color === 'cyan' ? 'bg-cyan-500/10' :
              ev.color === 'orange' ? 'bg-orange-500/10' : 'bg-emerald-500/10'
            }`}>
              {ev.color === 'blue'    && <Lock className="w-3 h-3 text-blue-400" />}
              {ev.color === 'cyan'    && <Users className="w-3 h-3 text-cyan-400" />}
              {ev.color === 'orange'  && <CreditCard className="w-3 h-3 text-orange-400" />}
              {ev.color === 'emerald' && <Shield className="w-3 h-3 text-emerald-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-300 truncate">{ev.msg}</p>
              <p className="text-[10px] text-slate-500 font-mono">{ev.org}</p>
            </div>
            <span className="text-[10px] text-slate-500 shrink-0 font-mono">{formatAge(ev.age)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== Logo Section with Energy Control ===== */
interface LogoSectionProps {
  isMobileOrbit: boolean;
  parallax: { x: number; y: number };
  orbitTech: Array<{ src: string; name: string; glow: string; delay: number }>;
}

function LogoSection({ isMobileOrbit, parallax, orbitTech }: LogoSectionProps) {
  const [logoPhase, setLogoPhase] = useState(0); // 0=hidden, 1=label, 2=hands, 3=threads, 4=logos
  
  useEffect(() => {
    // Start after hero intro completes (2200ms)
    const t1 = setTimeout(() => setLogoPhase(1), 2200);
    const t2 = setTimeout(() => setLogoPhase(2), 2400);
    const t3 = setTimeout(() => setLogoPhase(3), 2700);
    const t4 = setTimeout(() => setLogoPhase(4), 3300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const showLabel = logoPhase >= 1;
  const showHands = logoPhase >= 2;
  const showThreads = logoPhase >= 3;
  const showLogos = logoPhase >= 4;

  return (
    <div className="mt-14">
      {/* Label */}
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-700 mb-8"
        style={{
          opacity: showLabel ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      >
        Built with
      </p>

      {/* Logo container */}
      <div className="relative max-w-3xl mx-auto">
        {/* Desktop: Energy hands framing the logos */}
        {!isMobileOrbit && showHands && (
          <svg
            viewBox="0 0 720 280"
            className="absolute inset-0 w-full pointer-events-none"
            style={{
              opacity: showHands ? 0.25 : 0,
              transition: 'opacity 0.6s ease',
              filter: 'drop-shadow(0 0 15px rgba(139,92,246,0.25))',
            }}
          >
            <defs>
              <linearGradient id="handL" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="handR" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            {/* Left hand */}
            <g style={{ filter: 'blur(0.6px)' }}>
              <path d="M 80 140 Q 65 120 75 85 L 105 65 Q 110 75 110 95 L 105 135 Z" fill="none" stroke="url(#handL)" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
              <path d="M 85 135 L 80 180 Q 78 190 90 195" stroke="url(#handL)" strokeWidth="1.6" strokeLinecap="round" opacity="0.25" />
              <line x1="75" y1="85" x2="65" y2="50" stroke="url(#handL)" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
              <line x1="85" y1="80" x2="78" y2="40" stroke="url(#handL)" strokeWidth="1" opacity="0.32" strokeLinecap="round" />
              <line x1="100" y1="85" x2="102" y2="45" stroke="url(#handL)" strokeWidth="1.1" opacity="0.34" strokeLinecap="round" />
            </g>
            {/* Right hand */}
            <g style={{ filter: 'blur(0.6px)' }}>
              <path d="M 640 140 Q 655 120 645 85 L 615 65 Q 610 75 610 95 L 615 135 Z" fill="none" stroke="url(#handR)" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
              <path d="M 635 135 L 640 180 Q 642 190 630 195" stroke="url(#handR)" strokeWidth="1.6" strokeLinecap="round" opacity="0.25" />
              <line x1="645" y1="85" x2="655" y2="50" stroke="url(#handR)" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
              <line x1="635" y1="80" x2="642" y2="40" stroke="url(#handR)" strokeWidth="1" opacity="0.32" strokeLinecap="round" />
              <line x1="620" y1="85" x2="618" y2="45" stroke="url(#handR)" strokeWidth="1.1" opacity="0.34" strokeLinecap="round" />
            </g>
          </svg>
        )}

        {/* Desktop: Energy threads from hands to logos */}
        {!isMobileOrbit && showThreads && (
          <svg
            viewBox="0 0 720 280"
            className="absolute inset-0 w-full pointer-events-none"
            style={{
              opacity: showThreads ? 1 : 0,
              transition: 'opacity 0.5s ease',
            }}
          >
            <defs>
              <filter id="threadGlow">
                <feGaussianBlur stdDeviation="1" />
              </filter>
            </defs>
            {/* Threads from left hand fingers to left/center logos */}
            {[
              { x1: 65, y1: 50, x2: 180, y2: 240, color: '#a78bfa' }, // left hand -> React
              { x1: 78, y1: 40, x2: 270, y2: 240, color: '#c4b5fd' }, // left hand -> TypeScript
            ].map((t, i) => (
              <g key={`left-${i}`}>
                <path d={`M ${t.x1} ${t.y1} Q ${(t.x1 + t.x2) / 2} ${(t.y1 + t.y2) / 2 - 40} ${t.x2} ${t.y2}`} stroke={t.color} strokeWidth="3" fill="none" opacity="0.12" filter="url(#threadGlow)" style={{ animation: `threadFlow 2.4s ease-in-out infinite`, animationDelay: `${100 + i * 50}ms` }} />
                <path d={`M ${t.x1} ${t.y1} Q ${(t.x1 + t.x2) / 2} ${(t.y1 + t.y2) / 2 - 40} ${t.x2} ${t.y2}`} stroke={t.color} strokeWidth="1.1" fill="none" opacity="0.35" className="animate-thread-extend" style={{ animationDelay: `${500 + i * 60}ms`, strokeDasharray: '200' }} />
              </g>
            ))}
            {/* Center thread */}
            {<g key="center">
              <path d="M 102 45 Q 360 180 360 240" stroke="#818cf8" strokeWidth="3" fill="none" opacity="0.12" filter="url(#threadGlow)" style={{ animation: `threadFlow 2.4s ease-in-out infinite`, animationDelay: `200ms` }} />
              <path d="M 102 45 Q 360 180 360 240" stroke="#818cf8" strokeWidth="1.1" fill="none" opacity="0.35" className="animate-thread-extend" style={{ animationDelay: `680ms`, strokeDasharray: '200' }} />
            </g>}
            {/* Threads from right hand fingers to right/center logos */}
            {[
              { x1: 642, y1: 40, x2: 450, y2: 240, color: '#60a5fa' }, // right hand -> Stripe
              { x1: 655, y1: 50, x2: 540, y2: 240, color: '#34d399' }, // right hand -> Node
            ].map((t, i) => (
              <g key={`right-${i}`}>
                <path d={`M ${t.x1} ${t.y1} Q ${(t.x1 + t.x2) / 2} ${(t.y1 + t.y2) / 2 - 40} ${t.x2} ${t.y2}`} stroke={t.color} strokeWidth="3" fill="none" opacity="0.12" filter="url(#threadGlow)" style={{ animation: `threadFlow 2.4s ease-in-out infinite`, animationDelay: `${150 + i * 50}ms` }} />
                <path d={`M ${t.x1} ${t.y1} Q ${(t.x1 + t.x2) / 2} ${(t.y1 + t.y2) / 2 - 40} ${t.x2} ${t.y2}`} stroke={t.color} strokeWidth="1.1" fill="none" opacity="0.35" className="animate-thread-extend" style={{ animationDelay: `${620 + i * 60}ms`, strokeDasharray: '200' }} />
              </g>
            ))}
          </svg>
        )}

        {/* Logo grid */}
        <div className={`relative flex ${isMobileOrbit ? 'flex-wrap justify-center gap-x-6 gap-y-8' : 'flex-wrap items-center justify-center gap-x-10 gap-y-8 sm:gap-x-14'}`}>
          {orbitTech.map((tech, i) => (
            <div
              key={tech.name}
              className="group flex flex-col items-center gap-3 cursor-pointer"
              style={{
                opacity: showLogos ? 1 : 0,
                transform: showLogos ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.4s ease, transform 0.4s ease',
                transitionDelay: showLogos ? `${i * 80}ms` : '0ms',
              }}
            >
              {/* Logo + glow wrapper */}
              <div className="relative flex items-center justify-center w-14 h-14">
                <div
                  className="absolute inset-0 rounded-full blur-xl pointer-events-none"
                  style={{ background: tech.glow, opacity: 0.12 }}
                />
                <div
                  className="absolute rounded-full blur-3xl pointer-events-none opacity-0 transition-all duration-300 group-hover:opacity-80"
                  style={{
                    background: tech.glow,
                    width: 80,
                    height: 80,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%,-50%)',
                  }}
                />
                <img
                  src={tech.src}
                  alt={tech.name}
                  className="relative w-11 h-11 object-contain transition-all duration-300"
                  style={{
                    filter: 'brightness(0.85) saturate(0.8)',
                    animation: showLogos ? `logoControlledSway ${3.2 + i * 0.15}s ease-in-out infinite` : 'none',
                  }}
                  data-sway-index={i}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLImageElement).classList.add('logo-hover');
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLImageElement).classList.remove('logo-hover');
                  }}
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

  const isStrikePhase   = introPhase >= 1;
  const isRevealPhase   = introPhase >= 2;
  const isIdlePhase     = introPhase >= 3;

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

        {/* Full-screen lightning flash overlay */}
        {isStrikePhase && (
          <div
            className="absolute inset-0 pointer-events-none animate-lightning-flash"
            style={{
              background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(147,197,253,0.18) 0%, rgba(59,130,246,0.06) 50%, transparent 80%)',
              zIndex: 6,
            }}
          />
        )}

        {/* Shockwave rings (appear on strike) */}
        <ShockwaveRings visible={isStrikePhase} />

        {/* Electric arcs */}
        <ElectricArcs visible={isStrikePhase} />

        {/* Lightning bolt (positioned above hero center) */}
        <Lightning visible={isStrikePhase} />

        {/* Ambient radial glow — expands after reveal */}
        <div
          className="absolute pointer-events-none transition-all duration-[2000ms] ease-out"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: isIdlePhase ? 900 : isRevealPhase ? 700 : 300,
            height: isIdlePhase ? 700 : isRevealPhase ? 500 : 200,
            background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.07) 0%, rgba(96,165,250,0.03) 50%, transparent 75%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            zIndex: 2,
            opacity: isRevealPhase ? 1 : 0,
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

        {/* Electric particles (appear post-reveal) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translate(${parallax.x * 0.3}px, ${parallax.y * 0.2}px)`,
            zIndex: 1,
          }}
        >
          <ElectricParticles active={isRevealPhase} />
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
            style={{ transitionDelay: isRevealPhase ? '300ms' : '0ms' }}
          >
            A modern SaaS operations platform for authentication, billing, team roles, and real-time
            product visibility — built to help teams move faster with confidence.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-14 transition-all duration-700 ${
              isRevealPhase ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: isRevealPhase ? '500ms' : '0ms' }}
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
      <section id="features" className="relative py-20 sm:py-28">
        {/* invisible anchor for #architecture nav link */}
        <div id="architecture" className="absolute -top-16" />

        {/* Ambient background + system lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 opacity-25" style={{
            backgroundImage: 'linear-gradient(rgba(30,41,59,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(30,41,59,0.22) 1px, transparent 1px)',
            backgroundSize: '34px 34px'
          }} />
          <div className="absolute top-1/2 left-1/2 w-[780px] h-[420px] bg-blue-600/[0.055] rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute top-[38%] left-1/3 w-[360px] h-[360px] bg-indigo-500/[0.05] rounded-full blur-[110px]" />
          <div className="absolute bottom-6 right-1/4 w-[320px] h-[320px] bg-cyan-500/[0.045] rounded-full blur-[100px]" />
          {!isMobileOrbit && Array.from({ length: 10 }).map((_, i) => (
            <div
              key={`cmd-particle-${i}`}
              className="absolute rounded-full bg-blue-300/20"
              style={{
                width: 2,
                height: 2,
                left: `${10 + i * 9}%`,
                top: `${25 + (i % 4) * 14}%`,
                animation: `subtleFloat ${5 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${i * 0.35}s`,
                boxShadow: '0 0 8px rgba(125,211,252,0.45)'
              }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          {/* Section header */}
          <div className="mb-12 sm:mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300/80 mb-3">Command Layer</p>
            <h2 className="text-3xl sm:text-[2.6rem] font-semibold tracking-[-0.02em] leading-[1.05] mb-4 text-slate-100">
              The Nexus <span className="bg-gradient-to-r from-blue-300 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">Control Layer</span>
            </h2>
            <p className="text-slate-400 max-w-3xl text-sm sm:text-[15px] leading-relaxed">
              A real-time orchestration layer powering <span className="text-slate-200">authentication</span>, <span className="text-slate-200">billing</span>, <span className="text-slate-200">permissions</span>, and system intelligence across every tenant.
            </p>
          </div>

          {/* Main 2-col layout */}
          <div className="grid lg:grid-cols-[1fr_380px] gap-6 xl:gap-10 items-start">

            {/* ---- LEFT: Visualization + metrics + feed ---- */}
            <div className="space-y-4">

              {/* Topology map */}
              <CommandTopology isMobile={isMobileOrbit} />

              {/* Metrics strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                  { value: '99.9%', label: 'Uptime SLA',          color: 'emerald' },
                  { value: 'RLS',   label: 'Row-level isolation',  color: 'blue'    },
                  { value: 'Stripe',label: 'Billing layer',        color: 'orange'  },
                  { value: 'RBAC',  label: 'Role enforcement',     color: 'cyan'    },
                ] as const).map((m, i) => (
                  <div key={i} className={`group relative rounded-xl p-4 bg-slate-900/35 backdrop-blur-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden ${
                    m.color === 'emerald' ? 'hover:shadow-[0_0_28px_rgba(16,185,129,0.18)]' :
                    m.color === 'blue'    ? 'hover:shadow-[0_0_28px_rgba(59,130,246,0.18)]' :
                    m.color === 'orange'  ? 'hover:shadow-[0_0_28px_rgba(249,115,22,0.18)]' :
                                            'hover:shadow-[0_0_28px_rgba(6,182,212,0.18)]'
                  }`}>
                    <div className={`absolute bottom-0 left-0 h-px w-full animate-shimmer ${
                      m.color === 'emerald' ? 'bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent' :
                      m.color === 'blue'    ? 'bg-gradient-to-r from-transparent via-blue-400/70 to-transparent' :
                      m.color === 'orange'  ? 'bg-gradient-to-r from-transparent via-orange-400/70 to-transparent' :
                                              'bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent'
                    }`} />
                    <p className={`text-xl font-bold font-mono mb-0.5 ${
                      m.color === 'emerald' ? 'text-emerald-400' :
                      m.color === 'blue'    ? 'text-blue-400' :
                      m.color === 'orange'  ? 'text-orange-400' : 'text-cyan-400'
                    }`}>{m.value}</p>
                    <p className="text-[10px] text-slate-500 leading-tight">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Activity feed */}
              <ActivityFeed isMobile={isMobileOrbit} />
            </div>

            {/* ---- RIGHT: Module cards ---- */}
            <div className="space-y-2.5">
              {/* Stack header */}
              <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Active Modules</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px #4ade80' }} />
                  <span className="text-[10px] text-slate-600">5 / 5 online</span>
                </div>
              </div>

              {([
                {
                  icon: <Lock className="w-4 h-4 text-blue-400" />,
                  label: 'Multi-Tenant Auth',
                  status: 'Active' as const,
                  color: 'blue' as const,
                  desc: 'Supabase JWT sessions with per-org data isolation and RLS enforcement on every query.',
                  features: ['JWT + RLS enforcement', 'Org switching, zero leakage'],
                },
                {
                  icon: <Shield className="w-4 h-4 text-orange-400" />,
                  label: 'Role-Based Access',
                  status: 'Active' as const,
                  color: 'orange' as const,
                  desc: 'Admin and member scopes with permission-gated UI and DB-level policy enforcement.',
                  features: ['Admin / member scopes', 'Permission-gated routes'],
                },
                {
                  icon: <CreditCard className="w-4 h-4 text-emerald-400" />,
                  label: 'Stripe Billing Layer',
                  status: 'Test mode' as const,
                  color: 'emerald' as const,
                  desc: 'Hosted checkout, subscription portal, and webhook-verified plan upgrades — zero custom UI.',
                  features: ['Checkout + billing portal', 'Webhook-verified upgrades'],
                },
                {
                  icon: <Users className="w-4 h-4 text-cyan-400" />,
                  label: 'Team Management',
                  status: 'Active' as const,
                  color: 'cyan' as const,
                  desc: 'Invite members by email, manage roles, and maintain a full activity audit trail per org.',
                  features: ['Invite by email', 'Activity log per member'],
                },
                {
                  icon: <BarChart3 className="w-4 h-4 text-blue-400" />,
                  label: 'Real-Time Dashboard',
                  status: 'Active' as const,
                  color: 'blue' as const,
                  desc: 'Live org command center: event timelines, plan status, team roster, and usage signals.',
                  features: ['Activity timelines', 'Plan + usage visibility'],
                },
              ]).map((mod, i) => (
                <div
                  key={i}
                  className={`group relative pl-4 pr-4 pt-3.5 pb-3.5 rounded-xl bg-slate-900/35 backdrop-blur-xl transition-all duration-300 hover:bg-slate-900/55 hover:-translate-y-[2px] overflow-hidden ${
                    mod.color === 'blue'    ? 'hover:shadow-[0_0_30px_rgba(59,130,246,0.12)]' :
                    mod.color === 'orange'  ? 'hover:shadow-[0_0_30px_rgba(249,115,22,0.12)]' :
                    mod.color === 'emerald' ? 'hover:shadow-[0_0_30px_rgba(16,185,129,0.12)]' :
                                             'hover:shadow-[0_0_30px_rgba(6,182,212,0.12)]'
                  }`}
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    mod.color === 'blue'    ? 'bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0' :
                    mod.color === 'orange'  ? 'bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0' :
                    mod.color === 'emerald' ? 'bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0' :
                                             'bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0'
                  }`} />
                  {/* Accent left bar */}
                  <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full ${
                    mod.color === 'blue'    ? 'bg-blue-500/50' :
                    mod.color === 'orange'  ? 'bg-orange-500/50' :
                    mod.color === 'emerald' ? 'bg-emerald-500/50' : 'bg-cyan-500/50'
                  }`} />

                  {/* Row 1: icon + name + status chip */}
                  <div className="relative flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                        mod.color === 'blue'    ? 'bg-blue-500/10' :
                        mod.color === 'orange'  ? 'bg-orange-500/10' :
                        mod.color === 'emerald' ? 'bg-emerald-500/10' : 'bg-cyan-500/10'
                      }`}>
                        {mod.icon}
                      </div>
                      <span className="text-sm font-semibold text-white">{mod.label}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                      mod.status === 'Test mode'
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${mod.status === 'Test mode' ? 'bg-orange-400' : 'bg-emerald-400'} animate-pulse`} />
                      {mod.status}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-2">{mod.desc}</p>

                  {/* Mini feature list */}
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                    {mod.features.map((f, j) => (
                      <div key={j} className="flex items-center gap-1.5">
                        <div className={`w-1 h-1 rounded-full ${
                          mod.color === 'blue'    ? 'bg-blue-400/50' :
                          mod.color === 'orange'  ? 'bg-orange-400/50' :
                          mod.color === 'emerald' ? 'bg-emerald-400/50' : 'bg-cyan-400/50'
                        }`} />
                        <span className="text-[10px] text-slate-500">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Bottom CTA nudge */}
              <Link
                to="/signup"
                className="group flex items-center justify-between w-full px-4 py-3 rounded-xl bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/15 hover:border-blue-500/35 transition-all duration-200 mt-1"
              >
                <span className="text-sm font-medium text-blue-300">Deploy your Nexus instance</span>
                <ArrowRight className="w-4 h-4 text-blue-400 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
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
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative py-24 sm:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="relative p-12 sm:p-16 rounded-3xl bg-gradient-to-br from-blue-600/8 via-slate-900/90 to-orange-600/5 border border-blue-500/15 overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px]" />
              <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-orange-500/5 rounded-full blur-[80px]" />
            </div>
            {/* Subtle dragon in CTA background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
              <DragonSilhouette className="absolute w-96 h-60 text-blue-400 -right-10 top-0" />
            </div>
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Launch your SaaS control center today
              </h2>
              <p className="text-slate-400 max-w-lg mx-auto mb-8 leading-relaxed">
                Join teams who use Nexus to manage their organizations, billing, and collaboration — all in one place.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/signup"
                  className="group inline-flex items-center gap-2.5 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-xl shadow-blue-600/25 hover:shadow-[0_0_40px_rgba(59,130,246,0.35)] active:scale-[0.98] text-base"
                >
                  Create Account
                  <ArrowRight className="w-4.5 h-4.5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-medium rounded-xl border border-slate-700/60 hover:border-slate-600/60 transition-all duration-300 text-base"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
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

