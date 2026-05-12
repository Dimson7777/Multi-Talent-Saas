import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useOrg } from '../contexts/OrgContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ActivityTimelineEmptyState, Badge, UpgradePrompt } from '../components/ui';
import ActionItem from '../components/dashboard/ActionItem';
import StatCard from '../components/dashboard/StatCard';
import StatusBadge, { type SystemStatus } from '../components/dashboard/StatusBadge';
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
  CircleDot,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

/* ===== Skeleton Loader ===== */
interface SkeletonProps {
  className?: string;
}

function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`bg-slate-800/40 rounded-lg animate-shimmer ${className}`} />;
}

function ActivityTimelineSkeleton() {
  return (
    <div className="space-y-2 relative">
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-blue-500/15 via-slate-800/60 to-transparent" />
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 py-2.5 px-3 rounded-xl border border-white/5 bg-slate-900/45"
        >
          <Skeleton className="w-8 h-8 rounded-lg shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <Skeleton className="h-4 w-44 mb-1.5" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="w-1.5 h-1.5 rounded-full mt-2" />
        </div>
      ))}
    </div>
  );
}

function UsageSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

/* ===== Animated Counter ===== */
interface AnimatedCounterProps {
  value: number;
  delay?: number;
}

function AnimatedCounter({ value, delay = 0 }: AnimatedCounterProps) {
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
interface ActivityActionConfig {
  icon: JSX.Element;
  color: string;
  label: string;
}

type ActivityAction =
  | 'member_invited'
  | 'member_joined'
  | 'member_role_changed'
  | 'member_removed'
  | 'settings_updated'
  | 'subscription_updated'
  | 'subscription_canceled';

interface KpiItem {
  label: string;
  value: string | number;
  icon: JSX.Element;
}

const actionConfig: Record<ActivityAction, ActivityActionConfig> = {
  member_invited: { icon: <UserPlus className="w-3.5 h-3.5" />, color: 'text-blue-400 bg-blue-500/10', label: 'invited a member' },
  member_joined: { icon: <Users className="w-3.5 h-3.5" />, color: 'text-emerald-400 bg-emerald-500/10', label: 'joined the team' },
  member_role_changed: { icon: <Shield className="w-3.5 h-3.5" />, color: 'text-amber-400 bg-amber-500/10', label: 'changed a role' },
  member_removed: { icon: <Users className="w-3.5 h-3.5" />, color: 'text-red-400 bg-red-500/10', label: 'removed a member' },
  settings_updated: { icon: <Clock className="w-3.5 h-3.5" />, color: 'text-slate-400 bg-slate-500/10', label: 'updated settings' },
  subscription_updated: { icon: <CreditCard className="w-3.5 h-3.5" />, color: 'text-cyan-400 bg-cyan-500/10', label: 'upgraded to Pro' },
  subscription_canceled: { icon: <CreditCard className="w-3.5 h-3.5" />, color: 'text-red-400 bg-red-500/10', label: 'canceled subscription' },
};

/* ===== Dashboard Page ===== */
export default function DashboardPage() {
  const { currentOrg, isPro, subscription } = useOrg();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<Membership[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fadeInUp = {
    hidden: { opacity: 0, y: 14 },
    visible: (delay = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: 'easeOut', delay },
    }),
  };

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

  const adminCount = members.filter((m) => m.role === 'admin').length;
  const memberCount = members.filter((m) => m.role === 'member').length;
  const isEmpty = !loading && members.length <= 1 && activityLogs.length === 0;

  const systemStatus: SystemStatus =
    subscription?.status === 'active'
      ? 'active'
      : subscription?.status === 'past_due'
        ? 'past_due'
        : 'default';

  const kpiItems: KpiItem[] = [
    { label: 'Members', value: members.length, icon: <Users className="w-4 h-4 text-blue-300" /> },
    { label: 'Plan', value: isPro ? 'Pro' : 'Free', icon: <Crown className="w-4 h-4 text-violet-300" /> },
    { label: 'Events', value: activityLogs.length, icon: <Activity className="w-4 h-4 text-cyan-300" /> },
    { label: 'System', value: subscription?.status === 'past_due' ? 'Past Due' : 'Online', icon: <CircleDot className="w-4 h-4 text-emerald-300" /> },
  ];

  return (
    <div className="space-y-7 relative">
      <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-[780px] h-[260px] bg-cyan-500/[0.06] blur-[90px] rounded-full" />
      {/* Header */}
      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Badge variant="default">Overview</Badge>
            <Badge variant={isPro ? 'pro' : 'default'} dot={isPro}>{isPro ? 'Pro' : 'Free'}</Badge>
            <Badge variant="info">Operations</Badge>
          </div>
          <h1 className="text-[1.9rem] leading-tight sm:text-[2.1rem] font-semibold tracking-[-0.035em] bg-gradient-to-r from-slate-200 via-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
            Command Center
            {isPro && (
              <Badge variant="pro" dot pulse>Pro</Badge>
            )}
          </h1>
          <p className="text-slate-400/90 text-sm mt-1.5 font-light tracking-[0.01em]">
            Live workspace operations for {currentOrg?.name || 'your organization'}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2.5 self-start">
          <StatusBadge status={systemStatus} />
          <button
            onClick={() => navigate('/team')}
            className="relative overflow-hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-blue-600/12 hover:bg-blue-600/20 text-blue-200 border border-blue-400/25 hover:border-blue-300/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 transition-all duration-200"
          >
            <span className="pointer-events-none absolute inset-0 quick-shimmer" />
            <UserPlus className="w-3.5 h-3.5" />
            Invite Member
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="relative z-10 grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiItems.map((kpi, i) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            delay={i * 0.05}
          />
        ))}
      </div>

      {/* Three-column command center layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* ===== LEFT COLUMN: Workspace Overview ===== */}
        <div className="xl:col-span-3 space-y-4">
          {/* Team Stats */}
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={0} className="p-5 rounded-2xl bg-slate-900/50 border border-white/10 backdrop-blur-xl shadow-[0_14px_40px_rgba(2,6,23,0.35)]">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold tracking-[-0.02em] text-white">Team</h3>
              <Badge variant="default" className="ml-auto">{members.length} {isPro ? '' : '/ 5'}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-slate-800/35 border border-white/10">
                <p className="text-[10px] text-slate-400/85 uppercase tracking-[0.12em] font-light">Admins</p>
                <p className="text-xl font-bold text-white mt-0.5">
                  <AnimatedCounter value={adminCount} delay={100} />
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/35 border border-white/10">
                <p className="text-[10px] text-slate-400/85 uppercase tracking-[0.12em] font-light">Members</p>
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
          </motion.div>

          {/* Plan Card */}
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={0.07} className={`p-5 rounded-2xl border backdrop-blur-xl ${
            isPro
              ? 'bg-gradient-to-br from-blue-600/8 via-slate-900/50 to-cyan-600/5 border-white/10'
              : 'bg-slate-900/50 border-white/10'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              {isPro ? <Crown className="w-4 h-4 text-blue-400" /> : <Zap className="w-4 h-4 text-slate-500" />}
              <h3 className="text-sm font-semibold tracking-[-0.02em] text-white">Plan</h3>
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
                className="relative overflow-hidden w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 text-xs font-medium rounded-lg border border-blue-400/20 hover:border-blue-300/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 transition-all duration-200"
              >
                <span className="pointer-events-none absolute inset-0 quick-shimmer" />
                <Sparkles className="w-3.5 h-3.5" />
                Upgrade to Pro
              </button>
            )}
          </motion.div>
        </div>

        {/* ===== CENTER COLUMN: Activity Timeline ===== */}
        <div className="xl:col-span-6">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={0.14} className="p-5 rounded-2xl bg-slate-900/50 border border-white/10 backdrop-blur-xl h-full shadow-[0_14px_40px_rgba(2,6,23,0.35)]">
            <div className="flex items-center gap-2 mb-5">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold tracking-[-0.02em] text-white">Activity Timeline</h3>
              <Badge variant="default" className="ml-auto">{activityLogs.length}</Badge>
            </div>

            {loading ? (
              <ActivityTimelineSkeleton />
            ) : activityLogs.length === 0 ? (
              <ActivityTimelineEmptyState />
            ) : (
              <div className="space-y-2 relative">
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
                    <div key={log.id} className="flex items-start gap-3 py-2.5 px-3 rounded-xl border border-white/5 bg-slate-900/45 hover:bg-slate-900/70 hover:border-cyan-400/20 transition-all duration-200 animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                      <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 z-10 border border-white/10 ${config.color}`}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300 font-light tracking-[0.005em] leading-relaxed">
                          <span className="font-medium text-white">{p?.full_name || 'System'}</span>{' '}
                          {config.label}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/75 mt-2 shadow-[0_0_10px_rgba(34,211,238,0.7)]" />
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* ===== RIGHT COLUMN: Quick Actions & Status ===== */}
        <div className="xl:col-span-3 space-y-4">
          {/* Quick Actions */}
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={0.21} className="p-5 rounded-2xl bg-slate-900/50 border border-white/10 backdrop-blur-xl shadow-[0_14px_40px_rgba(2,6,23,0.35)]">
            <div className="flex items-center gap-2 mb-4">
              <Rocket className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold tracking-[-0.02em] text-white">Quick Actions</h3>
            </div>
            <div className="space-y-2.5">
              <ActionItem
                icon={<UserPlus className="w-4 h-4 text-blue-400" />}
                label="Invite Member"
                onClick={() => navigate('/team')}
                tone="blue"
              />
              <ActionItem
                icon={<CreditCard className="w-4 h-4 text-emerald-400" />}
                label="Manage Billing"
                onClick={() => navigate('/billing')}
                tone="emerald"
              />
              <ActionItem
                icon={<Shield className="w-4 h-4 text-slate-400" />}
                label="Settings"
                onClick={() => navigate('/settings')}
                tone="default"
              />
            </div>
          </motion.div>

          {/* Usage / Stats */}
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={0.28} className="p-5 rounded-2xl bg-slate-900/50 border border-white/10 backdrop-blur-xl shadow-[0_14px_40px_rgba(2,6,23,0.35)]">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold tracking-[-0.02em] text-white">Usage</h3>
            </div>

            {loading ? (
              <UsageSkeleton />
            ) : (
              <>
                {/* Member usage bar */}
                <div className="mb-4 rounded-xl border border-white/10 bg-slate-900/40 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-400">Team Members</span>
                    <span className="text-xs font-semibold text-white">{members.length}{isPro ? '' : '/5'}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800/70 overflow-hidden border border-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(59,130,246,0.45)] ${
                        isPro ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400' :
                        members.length >= 4 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                        'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'
                      }`}
                      style={{ width: `${isPro ? 100 : Math.min((members.length / 5) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Plan status */}
                <div className="mb-4 rounded-xl border border-white/10 bg-slate-900/40 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-400">Plan Tier</span>
                    <span className="text-xs font-semibold text-white">{isPro ? 'Pro' : 'Free'}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800/70 overflow-hidden border border-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(59,130,246,0.45)] ${
                        isPro ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400' : 'bg-slate-600'
                      }`}
                      style={{ width: isPro ? '100%' : '33%' }}
                    />
                  </div>
                </div>

                {/* Activity count */}
                <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-400">Recent Events</span>
                    <span className="text-xs font-semibold text-white">{activityLogs.length}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800/70 overflow-hidden border border-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(34,211,238,0.45)]"
                      style={{ width: `${Math.min((activityLogs.length / 10) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </motion.div>

          {/* Empty state suggestions (shown when team is small) */}
          {isEmpty && (
            <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={0.35} className="p-5 rounded-2xl bg-gradient-to-br from-blue-600/5 via-slate-900/50 to-cyan-600/5 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-blue-400 animate-float" />
                <h3 className="text-sm font-semibold tracking-[-0.02em] text-white">Get Started</h3>
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
                    className="group flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 transition-all duration-200"
                  >
                    {item.icon}
                    {item.label}
                    <ArrowRight className="w-3 h-3 ml-auto opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </button>
                ))}
              </div>
            </motion.div>
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
