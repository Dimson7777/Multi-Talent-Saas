import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrgContext';
import { Bell, LogOut, ChevronDown, Layers, Menu, CheckCheck, Search, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Notification } from '../../types';
import { formatDistanceToNow } from 'date-fns';

type HeaderProps = {
  onMenuClick: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const { organizations, currentOrg, currentRole, switchOrg } = useOrg();
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const orgDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

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
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(e.target as Node)) {
        setOrgDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
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

        <div ref={orgDropdownRef} className="relative">
          <button
            onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-slate-900/45 hover:bg-slate-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 transition-colors min-w-0"
          >
            <Layers className="w-4 h-4 text-cyan-300/80" />
            <span className="text-sm font-medium text-white hidden sm:inline truncate max-w-[180px]">{currentOrg?.name}</span>
            <span className="text-xs text-slate-500 capitalize hidden md:inline">({currentRole})</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${orgDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {orgDropdownOpen && organizations.length > 1 && (
            <div className="absolute top-full left-0 mt-2 w-64 glass-strong rounded-xl shadow-2xl shadow-black/40 py-1.5 z-50 animate-fade-in-down">
              <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                Organizations
              </div>
              {organizations.map((m) => {
                const org = m.organizations as unknown as { id: string; name: string };
                const isActive = currentOrg?.id === org.id;
                return (
                  <button
                    key={m.organization_id}
                    onClick={() => {
                      switchOrg(m.organization_id);
                      setOrgDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                      isActive ? 'bg-blue-600/10 text-blue-400' : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <Layers className="w-4 h-4 shrink-0" />
                    <span className="truncate flex-1 text-left">{org.name}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-medium">{m.role}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <button className="hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-slate-600/50 bg-slate-900/50 text-slate-300 hover:text-white hover:bg-slate-800/60 hover:border-cyan-300/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/45 focus-visible:shadow-[0_0_0_1px_rgba(34,211,238,0.35),0_0_20px_rgba(56,189,248,0.22)] transition-all duration-200">
        <Search className="w-4 h-4" />
        <span className="text-sm font-medium">Command</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800/90 border border-white/10 text-slate-500 font-mono">Ctrl K</span>
      </button>

      <div className="flex items-center gap-1.5 lg:gap-2">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.08] text-[11px] text-emerald-200/90 shadow-[0_10px_24px_rgba(16,185,129,0.15)]">
          <Sparkles className="w-3.5 h-3.5 text-emerald-300/80" />
          Workspace live
        </div>

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
    </header>
  );
}
