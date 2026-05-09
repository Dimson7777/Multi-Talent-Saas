import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  Layers,
  Sparkles,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useOrg } from '../../contexts/OrgContext';
import Badge from '../ui/Badge';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/team', icon: Users, label: 'Team' },
  { to: '/billing', icon: CreditCard, label: 'Billing' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

type SidebarProps = {
  mobile?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ mobile = false, onClose }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { currentOrg, isPro } = useOrg();
  const location = useLocation();
  const expanded = mobile || isExpanded;

  return (
    <aside
      onMouseEnter={!mobile ? () => setIsExpanded(true) : undefined}
      onMouseLeave={!mobile ? () => setIsExpanded(false) : undefined}
      className={`z-40 flex flex-col transition-all duration-300 ${
        mobile
          ? 'h-full w-[280px] rounded-none border-r border-white/10 bg-slate-950/90 backdrop-blur-2xl shadow-[0_24px_60px_rgba(2,6,23,0.55)]'
          : `fixed left-4 top-5 bottom-5 ${expanded ? 'w-[214px]' : 'w-[74px]'} rounded-[24px] border border-white/10 bg-slate-950/45 backdrop-blur-2xl shadow-[0_24px_90px_rgba(2,6,23,0.7)]`
      }`}
    >
      <div className={`flex items-center gap-3 ${expanded ? 'px-4' : 'px-3'} h-16 shrink-0 ${mobile ? 'border-b border-slate-800/40' : 'border-b border-white/10'}`}>
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-[0_12px_28px_rgba(34,211,238,0.35)]">
          <Layers className="w-4.5 h-4.5 text-white" />
        </div>

        {expanded && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold tracking-[-0.02em] text-white truncate leading-tight">
              {currentOrg?.name || 'Loading...'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isPro ? <Badge variant="pro" dot pulse>Pro</Badge> : <Badge variant="default">Free</Badge>}
            </div>
          </div>
        )}

        {mobile && onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors ml-auto"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className={`flex-1 py-4 ${expanded ? 'px-3' : 'px-2.5'} space-y-1.5 overflow-y-auto`}>
        {expanded && (
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">
            Workspace
          </p>
        )}

        {navItems.map((item, i) => {
          const isActive =
            location.pathname === item.to ||
            (item.to !== '/dashboard' && location.pathname.startsWith(item.to));

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={mobile && onClose ? onClose : undefined}
              title={!expanded && !mobile ? item.label : undefined}
              className={`group flex items-center ${expanded ? 'gap-3 px-3.5' : 'justify-center px-0'} py-3 rounded-2xl text-sm font-medium transition-all duration-300 relative animate-fade-in-up stagger-${i + 1} ${
                isActive
                  ? 'text-cyan-100 bg-gradient-to-r from-cyan-500/20 via-blue-500/12 to-indigo-500/10 shadow-[0_0_0_1px_rgba(56,189,248,0.35),0_14px_28px_rgba(14,116,144,0.25)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/45'
              }`}
            >
              {isActive && (
                <div className={`absolute ${expanded ? 'left-0 top-1/2 -translate-y-1/2 w-[2px] h-5' : 'left-1/2 -translate-x-1/2 bottom-1.5 w-5 h-[2px]'} bg-cyan-300/90 rounded-full shadow-[0_0_14px_rgba(103,232,249,0.9)]`} />
              )}

              <item.icon
                className={`w-[18px] h-[18px] shrink-0 transition-colors duration-200 ${
                  isActive ? 'text-cyan-300' : 'text-slate-500 group-hover:text-white'
                }`}
              />

              {expanded && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {!isPro && (
        <div className={`${expanded ? 'mx-3 mb-3 p-3.5' : 'mx-2.5 mb-3 p-2.5'} rounded-2xl bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-indigo-500/10 border border-cyan-400/20 animate-fade-in-up`}>
          <NavLink
            to="/billing"
            onClick={mobile && onClose ? onClose : undefined}
            title={!expanded && !mobile ? 'Upgrade to Pro' : undefined}
            className={`flex items-center ${expanded ? 'gap-2.5 justify-start' : 'justify-center'} text-cyan-200 hover:text-white transition-colors`}
          >
            <Sparkles className="w-4 h-4 text-cyan-300 animate-float shrink-0" />
            {expanded && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-cyan-200">Upgrade to Pro</p>
                <p className="text-[10px] text-slate-500 truncate">Unlock unlimited members</p>
              </div>
            )}
          </NavLink>
        </div>
      )}
    </aside>
  );
}
