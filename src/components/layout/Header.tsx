import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrgContext';
import { Bell, LogOut, Menu, CheckCheck, Search, Command, X, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Notification } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

type HeaderProps = {
  onMenuClick: () => void;
};

type ThemeMode = 'dark' | 'light';
type CommandCategory = 'Navigation' | 'System' | 'Account';
type CommandActionId =
  | 'dashboard'
  | 'team'
  | 'billing'
  | 'toggle-theme'
  | 'refresh-data'
  | 'system-status'
  | 'user-settings'
  | 'support-ticket'
  | 'logout';

interface CommandAction {
  id: CommandActionId;
  label: string;
  category: CommandCategory;
}

const commandActions: CommandAction[] = [
  { id: 'dashboard', label: 'Go to Dashboard', category: 'Navigation' },
  { id: 'team', label: 'Team Management', category: 'Navigation' },
  { id: 'billing', label: 'Billing & Plans', category: 'Navigation' },
  { id: 'toggle-theme', label: 'Toggle Dark/Light Mode', category: 'System' },
  { id: 'refresh-data', label: 'Refresh Data', category: 'System' },
  { id: 'system-status', label: 'System Status', category: 'System' },
  { id: 'user-settings', label: 'User Settings', category: 'Account' },
  { id: 'support-ticket', label: 'Support Ticket', category: 'Account' },
  { id: 'logout', label: 'Logout', category: 'Account' },
];

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('nexus-theme');
    return stored === 'light' ? 'light' : 'dark';
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const commandPaletteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    document.documentElement.classList.toggle('light-mode', themeMode === 'light');
    localStorage.setItem('nexus-theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (!currentOrg || !user) return;
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', currentOrg.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setNotifications(data || []);
    };
    fetchNotifications();
  }, [user?.id, currentOrg]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
      if (commandPaletteRef.current && !commandPaletteRef.current.contains(e.target as Node)) {
        setCommandPaletteOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = async () => {
    if (!user || !currentOrg) return;
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('organization_id', currentOrg.id)
      .eq('read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const routeLabelMap: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/team': 'Team',
    '/billing': 'Billing',
    '/settings': 'Settings',
  };
  const currentPageLabel = routeLabelMap[location.pathname] || 'Dashboard';
  const breadcrumbItems = [
    { label: 'Organizations', to: '/' },
    { label: currentOrg?.name || 'sggsg63632', to: '/dashboard' },
    { label: currentPageLabel, to: location.pathname },
  ];

  const filteredActions = commandActions.filter((action) =>
    `${action.label} ${action.category}`.toLowerCase().includes(commandQuery.toLowerCase().trim())
  );

  const groupedActions: Record<CommandCategory, CommandAction[]> = {
    Navigation: filteredActions.filter((action) => action.category === 'Navigation'),
    System: filteredActions.filter((action) => action.category === 'System'),
    Account: filteredActions.filter((action) => action.category === 'Account'),
  };

  const executeCommand = async (id: CommandActionId) => {
    if (id === 'dashboard') navigate('/dashboard');
    if (id === 'team') navigate('/team');
    if (id === 'billing') navigate('/billing');
    if (id === 'toggle-theme') setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
    if (id === 'refresh-data') navigate(0);
    if (id === 'system-status') navigate('/dashboard');
    if (id === 'user-settings') navigate('/settings');
    if (id === 'support-ticket') navigate('/settings');
    if (id === 'logout') await signOut();
    setCommandPaletteOpen(false);
    setCommandQuery('');
  };

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() || '?';

  return (
    <header className="sticky top-2 z-30 px-3 lg:px-5 xl:px-8">
      <div className="h-[64px] max-w-[1180px] mx-auto rounded-[22px] border border-white/10 bg-slate-950/55 backdrop-blur-2xl shadow-[0_26px_80px_rgba(2,6,23,0.55)] flex items-center justify-between px-3.5 lg:px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_12%_12%,rgba(45,212,191,0.11),transparent_28%),radial-gradient(circle_at_88%_78%,rgba(59,130,246,0.11),transparent_36%)]" />
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <nav className="flex items-center min-w-0">
            {breadcrumbItems.map((item, index) => (
              <div key={`${item.label}-${index}`} className="flex items-center min-w-0">
                {index > 0 && <ChevronRight className="w-3 h-3 text-slate-600 mx-1.5 shrink-0" />}
                <button
                  onClick={() => navigate(item.to)}
                  className={`text-sm transition-colors truncate max-w-[130px] sm:max-w-[170px] ${
                    index === breadcrumbItems.length - 1
                      ? 'text-slate-200 font-medium'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              </div>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg border border-emerald-400/20 bg-emerald-500/[0.08] text-[11px] text-emerald-200/90">
            <span className="relative flex h-2 w-2">
              <span className="status-dot-pulse absolute inset-0 rounded-full bg-emerald-300" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.9)]" />
            </span>
            Live
          </div>
        </div>
      </div>

      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-slate-600/50 bg-slate-900/50 text-slate-300 hover:text-white hover:bg-slate-800/60 hover:border-cyan-300/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/45 focus-visible:shadow-[0_0_0_1px_rgba(34,211,238,0.35),0_0_20px_rgba(56,189,248,0.22)] transition-all duration-200"
      >
        <Search className="w-4 h-4" />
        <span className="text-sm font-medium">Command</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800/90 border border-white/10 text-slate-500 font-mono">Ctrl K</span>
      </button>

      <div className="flex items-center gap-1.5 lg:gap-2">
        <div ref={notifDropdownRef} className="relative">
          <button
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            className="relative p-2.5 rounded-xl border border-white/10 bg-slate-900/40 text-slate-400 hover:text-white hover:bg-slate-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 transition-colors"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-blue-600 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1 shadow-lg shadow-blue-600/30 animate-dot-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {notifDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 glass-strong rounded-xl shadow-2xl shadow-black/40 py-1.5 max-h-96 overflow-y-auto z-50 animate-fade-in-down">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/40">
                <span className="text-xs font-semibold text-slate-400">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 hover:bg-slate-800/40 transition-colors cursor-pointer ${!n.read ? 'bg-blue-600/5' : ''}`}
                    onClick={() => markAsRead(n.id)}
                  >
                    <div className="flex items-start gap-3">
                      {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0 animate-dot-pulse" />}
                      <div className={!n.read ? '' : 'ml-5'}>
                        <p className="text-sm font-medium text-white">{n.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-slate-600 mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-slate-800/60 mx-1 hidden sm:block" />

        <div className="flex items-center gap-2 pl-1 pr-1.5 py-1 rounded-xl border border-white/10 bg-slate-900/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/20 flex items-center justify-center text-xs font-semibold text-slate-100 border border-cyan-300/30 shrink-0">
            {initials}
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-white leading-tight">{profile?.full_name || 'User'}</p>
            <p className="text-[11px] text-slate-500">{profile?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 transition-all duration-200"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
      </div>

      {commandPaletteOpen && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-24">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={() => setCommandPaletteOpen(false)}
          />
          <div
            ref={commandPaletteRef}
            className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.82),rgba(2,6,23,0.9))] backdrop-blur-2xl shadow-[0_26px_80px_rgba(2,6,23,0.75)] animate-modal-in overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-800/60">
              <Command className="w-4 h-4 text-cyan-300" />
              <input
                autoFocus
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                placeholder="Search commands..."
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              <button
                onClick={() => setCommandPaletteOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800/70 transition-colors"
                aria-label="Close command palette"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-2">
              {filteredActions.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">No matching commands</div>
              ) : (
                (Object.keys(groupedActions) as CommandCategory[]).map((category) => (
                  groupedActions[category].length > 0 ? (
                    <div key={category} className="mb-1.5 last:mb-0">
                      <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                        {category}
                      </p>
                      <div>
                        {groupedActions[category].map((action) => (
                          <motion.button
                            key={action.id}
                            onClick={() => void executeCommand(action.id)}
                            whileHover={{ x: 3, scale: 1.005 }}
                            transition={{ duration: 0.16, ease: 'easeOut' }}
                            className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors flex items-center justify-between"
                          >
                            <span>{action.label}</span>
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md border border-white/10 bg-slate-900/70 text-[12px] text-slate-500" aria-hidden="true">
                              ↵
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ) : null
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
