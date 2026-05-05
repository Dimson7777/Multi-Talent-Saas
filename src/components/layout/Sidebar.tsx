import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  ChevronLeft,
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
  const [collapsed, setCollapsed] = useState(false);
  const { currentOrg, isPro } = useOrg();
  const location = useLocation();

  return (
    <aside
      className={`h-screen glass-strong flex flex-col transition-all duration-300 z-40 ${
        collapsed && !mobile ? 'w-[72px]' : 'w-[260px]'
      } ${mobile ? 'w-[260px]' : 'fixed left-0 top-0'}`}
    >
      {/* Logo / Org */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800/40 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/25">
          <Layers className="w-4.5 h-4.5 text-white" />
        </div>
        {(!collapsed || mobile) && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate leading-tight">
              {currentOrg?.name || 'Loading...'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isPro ? (
                <Badge variant="pro" dot pulse>Pro</Badge>
              ) : (
                <Badge variant="default">Free</Badge>
              )}
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

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {(!collapsed || mobile) && (
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
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
              title={collapsed && !mobile ? item.label : undefined}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative animate-fade-in-up stagger-${i + 1} ${
                isActive
                  ? 'bg-blue-600/10 text-blue-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-500 rounded-r-full shadow-sm shadow-blue-500/50" />
              )}
              <item.icon
                className={`w-[18px] h-[18px] shrink-0 transition-colors duration-200 ${
                  isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-white'
                }`}
              />
              {(!collapsed || mobile) && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Upgrade CTA for free users */}
      {!isPro && (!collapsed || mobile) && (
        <div className="mx-3 mb-3 p-3.5 rounded-xl bg-gradient-to-br from-blue-600/10 to-cyan-600/5 border border-blue-500/15 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-blue-400 animate-float" />
            <span className="text-xs font-semibold text-blue-400">Upgrade to Pro</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed mb-2.5">
            Unlock unlimited members and advanced features.
          </p>
          <NavLink
            to="/billing"
            onClick={mobile && onClose ? onClose : undefined}
            className="block w-full text-center px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-all duration-200 shadow-sm shadow-blue-600/20 hover:shadow-blue-500/30"
          >
            Upgrade
          </NavLink>
        </div>
      )}

      {/* Collapse toggle (desktop only) */}
      {!mobile && (
        <div className="px-3 py-3 border-t border-slate-800/40">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition-all duration-200 w-full"
          >
            <ChevronLeft
              className={`w-[18px] h-[18px] shrink-0 transition-transform duration-300 ${
                collapsed ? 'rotate-180' : ''
              }`}
            />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      )}
    </aside>
  );
}
