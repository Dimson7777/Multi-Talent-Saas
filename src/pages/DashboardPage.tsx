import { useEffect, useState } from 'react';
import { useOrg } from '../contexts/OrgContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Badge, UpgradePrompt } from '../components/ui';
import type { Membership, ActivityLog } from '../types';
import {
  Users,
  Activity,
  CreditCard,
  UserPlus,
  Shield,
  Clock,
  Zap,
  ArrowRight,
  Crown,
  Sparkles,
  TrendingUp,
  Rocket,
  ChevronRight,
  CircleDot,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

/* ===== Skeleton Loader ===== */
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-slate-800/40 rounded-lg animate-shimmer ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-3 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-xl border border-slate-800/40 bg-slate-900/50">
              <Skeleton className="h-4 w-20 mb-4" />
              <Skeleton className="h-10 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-6 p-5 rounded-xl border border-slate-800/40 bg-slate-900/50">
          <Skeleton className="h-5 w-28 mb-5" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 mb-4">
              <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-48 mb-1.5" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-3 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-5 rounded-xl border border-slate-800/40 bg-slate-900/50">
              <Skeleton className="h-4 w-20 mb-4" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===== Animated Counter ===== */
function AnimatedCounter({ value, delay = 0 }: { value: number; delay?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let start = 0;
      const end = value;
      if (end === 0) { setDisplay(0); return; }
      const duration = 600;
      const stepTime = Math.max(Math.floor(duration / end), 30);
      const timer = setInterval(() => {
        start += 1;
        setDisplay(start);
        if (start >= end) clearInterval(timer);
      }, stepTime);
      return () => clearInterval(timer);
    }, delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return <span>{display}</span>;
}

/* ===== Action Config ===== */
const actionConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  member_invited: { icon: <UserPlus className="w-3.5 h-3.5" />, color: 'text-blue-400 bg-blue-500/10', label: 'invited a member' },
  member_joined: { icon: <Users className="w-3.5 h-3.5" />, color: 'text-emerald-400 bg-emerald-500/10', label: 'joined the team' },
  member_role_changed: { icon: <Shield className="w-3.5 h-3.5" />, color: 'text-amber-400 bg-amber-500/10', label: 'changed a role' },
  member_removed: { icon: <Users className="w-3.5 h-3.5" />, color: 'text-red-400 bg-red-500/10', label: 'removed a member' },
  settings_updated: { icon: <Clock className="w-3.5 h-3.5" />, color: 'text-slate-400 bg-slate-500/10', label: 'updated settings' },
  subscription_updated: { icon: <CreditCard className="w-3.5 h-3.5" />, color: 'text-cyan-400 bg-cyan-500/10', label: 'upgraded to Pro' },
  subscription_canceled: { icon: <CreditCard className="w-3.5 h-3.5" />, color: 'text-red-400 bg-red-500/10', label: 'canceled subscription' },
};

/* ===== Quick Action Button ===== */
function QuickAction({ icon, label, onClick, color = 'blue' }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-300 hover:-translate-y-0.5 ${
        color === 'blue' ? 'bg-blue-500/[0.06] hover:bg-blue-500/10 border border-blue-500/10 hover:border-blue-500/20' :
        color === 'emerald' ? 'bg-emerald-500/[0.06] hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/20' :
        'bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/30 hover:border-slate-700/50'
      }`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${
        color === 'blue' ? 'bg-blue-500/10' :
        color === 'emerald' ? 'bg-emerald-500/10' :
        'bg-slate-700/50'
      }`}>
        {icon}
      </div>
      <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors flex-1 text-left">{label}</span>
      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-all duration-300 group-hover:translate-x-0.5" />
    </button>
  );
}

/* ===== Dashboard Page ===== */
export default function DashboardPage() {
  const { currentOrg, isPro, subscription } = useOrg();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<Membership[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentOrg) return;
    const fetchData = async () => {
      setLoading(true);
      const [membersRes, logsRes] = await Promise.all([
        supabase
          .from('memberships')
          .select('*, profiles(*)')
          .eq('organization_id', currentOrg.id)
          .order('joined_at', { ascending: true }),
        supabase
          .from('activity_logs')
          .select('*, profiles(*)')
          .eq('organization_id', currentOrg.id)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);
      setMembers(membersRes.data || []);
      setActivityLogs(logsRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, [currentOrg]);

  if (loading) return <DashboardSkeleton />;

  const adminCount = members.filter((m) => m.role === 'admin').length;
  const memberCount = members.filter((m) => m.role === 'member').length;
  const isEmpty = members.length <= 1 && activityLogs.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            Command Center
            {isPro && (
              <Badge variant="pro" dot pulse>Pro</Badge>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {currentOrg?.name || 'your organization'}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
            subscription?.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' :
            subscription?.status === 'past_due' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' :
            'bg-slate-800/60 text-slate-400 border border-slate-700/40'
          }`}>
            <CircleDot className="w-3 h-3" />
            {subscription?.status === 'active' ? 'All systems operational' :
             subscription?.status === 'past_due' ? 'Payment past due' : 'Active'}
          </div>
        </div>
      </div>

      {/* Three-column command center layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ===== LEFT COLUMN: Workspace Overview ===== */}
        <div className="lg:col-span-3 space-y-4">
          {/* Team Stats */}
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/60 backdrop-blur-sm animate-fade-in-up">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Team</h3>
              <Badge variant="default" className="ml-auto">{members.length} {isPro ? '' : '/ 5'}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/20">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Admins</p>
                <p className="text-xl font-bold text-white mt-0.5">
                  <AnimatedCounter value={adminCount} delay={100} />
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/20">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Members</p>
                <p className="text-xl font-bold text-white mt-0.5">
                  <AnimatedCounter value={memberCount} delay={200} />
                </p>
              </div>
            </div>

            {/* Member list */}
            <div className="space-y-2.5">
              {members.slice(0, 4).map((m, i) => {
                const p = m.profiles as unknown as { full_name: string; email: string };
                const initials = p?.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
                const isSelf = m.user_id === user?.id;
                return (
                  <div key={m.id} className="flex items-center gap-2.5 animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-[11px] font-semibold text-slate-300 border border-slate-700/40 shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">
                        {p?.full_name || 'Unknown'}
                        {isSelf && <span className="text-blue-400 ml-1">(you)</span>}
                      </p>
                    </div>
                    <Badge variant={m.role === 'admin' ? 'info' : 'default'}>{m.role}</Badge>
                  </div>
                );
              })}
              {members.length > 4 && (
                <button
                  onClick={() => navigate('/team')}
                  className="w-full text-center text-xs text-slate-500 hover:text-blue-400 transition-colors py-1"
                >
                  +{members.length - 4} more members
                </button>
              )}
            </div>
          </div>

          {/* Plan Card */}
          <div className={`p-5 rounded-xl border backdrop-blur-sm animate-fade-in-up stagger-2 ${
            isPro
              ? 'bg-gradient-to-br from-blue-600/8 via-slate-900/70 to-cyan-600/5 border-blue-500/15'
              : 'bg-slate-900/70 border-slate-800/60'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              {isPro ? <Crown className="w-4 h-4 text-blue-400" /> : <Zap className="w-4 h-4 text-slate-500" />}
              <h3 className="text-sm font-semibold text-white">Plan</h3>
              <Badge variant={isPro ? 'pro' : 'default'} className="ml-auto" dot={isPro} pulse={isPro}>
                {isPro ? 'Pro' : 'Free'}
              </Badge>
            </div>
            {isPro && subscription?.current_period_end ? (
              <p className="text-xs text-slate-400 mb-3">
                Renews {formatDistanceToNow(new Date(subscription.current_period_end), { addSuffix: true })}
              </p>
            ) : (
              <p className="text-xs text-slate-500 mb-3">
                {isPro ? 'All features unlocked' : `${5 - members.length} member slots remaining`}
              </p>
            )}
            {!isPro && (
              <button
                onClick={() => navigate('/billing')}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-medium rounded-lg border border-blue-500/15 hover:border-blue-500/25 transition-all duration-200"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>

        {/* ===== CENTER COLUMN: Activity Timeline ===== */}
        <div className="lg:col-span-6">
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/60 backdrop-blur-sm h-full animate-fade-in-up stagger-2">
            <div className="flex items-center gap-2 mb-5">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Activity Timeline</h3>
              <Badge variant="default" className="ml-auto">{activityLogs.length}</Badge>
            </div>

            {activityLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
                {/* Animated empty state */}
                <div className="relative mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/30 flex items-center justify-center">
                    <Activity className="w-7 h-7 text-slate-600 animate-float" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500/30 animate-dot-pulse" />
                </div>
                <p className="text-sm font-medium text-slate-400 mb-1">No activity yet</p>
                <p className="text-xs text-slate-600 text-center max-w-[200px]">
                  Actions like inviting members, upgrading plans, and role changes will appear here in real time.
                </p>
              </div>
            ) : (
              <div className="space-y-0 relative">
                {/* Timeline line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-blue-500/20 via-slate-800/60 to-transparent" />

                {activityLogs.map((log, i) => {
                  const p = log.profiles as unknown as { full_name: string };
                  const config = actionConfig[log.action] || {
                    icon: <Activity className="w-3.5 h-3.5" />,
                    color: 'text-slate-400 bg-slate-500/10',
                    label: log.action.replace(/_/g, ' '),
                  };
                  return (
                    <div key={log.id} className="flex items-start gap-3 py-3 animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                      <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 z-10 ${config.color}`}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300">
                          <span className="font-medium text-white">{p?.full_name || 'System'}</span>{' '}
                          {config.label}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ===== RIGHT COLUMN: Quick Actions & Status ===== */}
        <div className="lg:col-span-3 space-y-4">
          {/* Quick Actions */}
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/60 backdrop-blur-sm animate-fade-in-up stagger-3">
            <div className="flex items-center gap-2 mb-4">
              <Rocket className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Quick Actions</h3>
            </div>
            <div className="space-y-2.5">
              <QuickAction
                icon={<UserPlus className="w-4 h-4 text-blue-400" />}
                label="Invite Member"
                onClick={() => navigate('/team')}
                color="blue"
              />
              <QuickAction
                icon={<CreditCard className="w-4 h-4 text-emerald-400" />}
                label="Manage Billing"
                onClick={() => navigate('/billing')}
                color="emerald"
              />
              <QuickAction
                icon={<Shield className="w-4 h-4 text-slate-400" />}
                label="Settings"
                onClick={() => navigate('/settings')}
              />
            </div>
          </div>

          {/* Usage / Stats */}
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/60 backdrop-blur-sm animate-fade-in-up stagger-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Usage</h3>
            </div>

            {/* Member usage bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400">Team Members</span>
                <span className="text-xs font-medium text-white">{members.length}{isPro ? '' : '/5'}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800/60 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    isPro ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                    members.length >= 4 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                    'bg-gradient-to-r from-blue-500 to-blue-400'
                  }`}
                  style={{ width: `${isPro ? 100 : Math.min((members.length / 5) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Plan status */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400">Plan Tier</span>
                <span className="text-xs font-medium text-white">{isPro ? 'Pro' : 'Free'}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800/60 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    isPro ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-slate-600'
                  }`}
                  style={{ width: isPro ? '100%' : '33%' }}
                />
              </div>
            </div>

            {/* Activity count */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400">Recent Events</span>
                <span className="text-xs font-medium text-white">{activityLogs.length}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800/60 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min((activityLogs.length / 10) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Empty state suggestions (shown when team is small) */}
          {isEmpty && (
            <div className="p-5 rounded-xl bg-gradient-to-br from-blue-600/5 via-slate-900/70 to-cyan-600/5 border border-blue-500/10 animate-fade-in-up stagger-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-blue-400 animate-float" />
                <h3 className="text-sm font-semibold text-white">Get Started</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Your workspace is ready. Here are some next steps to get the most out of Nexus.
              </p>
              <div className="space-y-2">
                {[
                  { label: 'Invite your first teammate', icon: <UserPlus className="w-3.5 h-3.5" />, action: '/team' },
                  { label: 'Explore Pro features', icon: <Crown className="w-3.5 h-3.5" />, action: '/billing' },
                  { label: 'Configure settings', icon: <Shield className="w-3.5 h-3.5" />, action: '/settings' },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(item.action)}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all duration-200"
                  >
                    {item.icon}
                    {item.label}
                    <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade prompt for free users */}
      {!isPro && (
        <UpgradePrompt
          feature="advanced features"
          description="Get unlimited team members, advanced analytics, priority support, and more with a Pro plan."
        />
      )}
    </div>
  );
}
