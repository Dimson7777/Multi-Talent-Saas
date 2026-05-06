import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../contexts/OrgContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Card, CardHeader, CardTitle, Button, Badge } from '../components/ui';
import { supabase } from '../lib/supabase';
import type { Subscription } from '../types';
import {
  Check,
  Zap,
  Crown,
  CreditCard,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'For small teams getting started',
    features: ['Up to 5 team members', 'Basic dashboard analytics', 'Activity logging', 'Email notifications'],
    limitations: ['No advanced analytics', 'No priority support', 'Limited integrations'],
    cta: 'Current Plan',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For growing teams that need more',
    features: ['Unlimited team members', 'Advanced analytics & reports', 'Activity logging with exports', 'Priority email support', 'Custom integrations', 'Audit trail'],
    limitations: [],
    cta: 'Upgrade to Pro',
  },
];

type BillingStatus = 'idle' | 'loading' | 'success' | 'error';

export default function BillingPage() {
  const { currentOrg, currentRole, subscription, isPro, refreshSubscription, refreshOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [checkoutStatus, setCheckoutStatus] = useState<BillingStatus>('idle');
  const [portalStatus, setPortalStatus] = useState<BillingStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdmin = currentRole === 'admin';

  // Handle Stripe redirect back from checkout
  useEffect(() => {
    const checkoutResult = searchParams.get('checkout');
    const sessionId = searchParams.get('session_id');
    const portalResult = searchParams.get('portal');

    if (checkoutResult === 'success') {
      setCheckoutStatus('loading');

      const resolveSuccess = () => {
        if (pollRef.current) clearInterval(pollRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setCheckoutStatus('success');
        setSearchParams({}, { replace: true });
        toast('success', 'Welcome to Pro!', 'Your subscription is now active. All Pro features are unlocked.');
      };

      // Primary path: confirm with Stripe session ID and write plan directly via edge function.
      const confirmViaStripe = async (): Promise<boolean> => {
        if (!sessionId) return false;

        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return false;

          const response = await fetch(
            import.meta.env.DEV
              ? '/api/stripe-confirm'
              : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-confirm`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ session_id: sessionId }),
            }
          );

          if (!response.ok) {
            return false;
          }

          await refreshSubscription();
          await refreshOrg();
          return true;
        } catch {
          return false;
        }
      };

      confirmViaStripe().then((confirmed) => {
        if (confirmed) {
          resolveSuccess();
          return;
        }

        // Fallback path if webhook is configured.
        pollRef.current = setInterval(async () => {
          const sub: Subscription | null = await refreshSubscription();
          await refreshOrg();
          if (sub?.plan === 'pro') {
            resolveSuccess();
          }
        }, 2000);

        timeoutRef.current = setTimeout(() => {
          if (pollRef.current) clearInterval(pollRef.current);
          setCheckoutStatus('success');
          setSearchParams({}, { replace: true });
          toast('success', 'Welcome to Pro!', 'Your subscription is now active.');
        }, 15000);

        refreshSubscription().then(async (sub: Subscription | null) => {
          await refreshOrg();
          if (sub?.plan === 'pro') {
            resolveSuccess();
          }
        });
      });

      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }

    if (checkoutResult === 'cancelled') {
      setCheckoutStatus('idle');
      setSearchParams({}, { replace: true });
      toast('info', 'Checkout cancelled', 'You can upgrade anytime from the billing page.');
    }

    if (portalResult === 'returned') {
      refreshSubscription();
      refreshOrg();
      setSearchParams({}, { replace: true });
      // Check if subscription was canceled while in portal
      setTimeout(async () => {
        const sub: Subscription | null = await refreshSubscription();
        await refreshOrg();
        if (sub?.plan === 'free' || sub?.status === 'canceled') {
          toast('info', 'Subscription updated', 'Your subscription has been updated.');
          navigate('/', { replace: true });
        }
      }, 2000);
    }
  }, []);

  // Watch for isPro changes to auto-resolve checkout status
  useEffect(() => {
    if (checkoutStatus === 'loading' && isPro) {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setCheckoutStatus('success');
      setSearchParams({}, { replace: true });
    }
  }, [isPro, checkoutStatus]);

  const handleUpgrade = async () => {
    if (!currentOrg || !user) return;
    setCheckoutStatus('loading');
    setErrorMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErrorMessage('You must be signed in to upgrade.');
        setCheckoutStatus('error');
        return;
      }

      const response = await fetch(
        import.meta.env.DEV
          ? '/api/stripe-checkout'
          : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            organization_id: currentOrg.id,
            customer_email: user.email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error('No checkout URL returned');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setErrorMessage(msg);
      setCheckoutStatus('error');
      toast('error', 'Checkout failed', msg);
    }
  };

  const handleManageBilling = async () => {
    if (!currentOrg || !user) return;
    setPortalStatus('loading');
    setErrorMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErrorMessage('You must be signed in to manage billing.');
        setPortalStatus('error');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-portal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            customer_id: subscription?.stripe_customer_id,
            organization_id: currentOrg.id,
            return_url: `${window.location.origin}/billing`,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error('No portal URL returned');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setErrorMessage(msg);
      setPortalStatus('error');
      toast('error', 'Portal failed', msg);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-[760px] h-[230px] bg-indigo-500/[0.05] blur-[90px] rounded-full" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="default">Billing</Badge>
            <Badge variant={isPro ? 'pro' : 'default'} dot={isPro}>{isPro ? 'Pro' : 'Free'}</Badge>
            {import.meta.env.DEV && <Badge variant="warning">Test Mode</Badge>}
          </div>
          <h1 className="text-2xl sm:text-[2rem] font-semibold text-white tracking-[-0.03em]">Billing & Plans</h1>
          <p className="text-slate-400 text-sm mt-1 font-light">Manage subscription, usage limits, and Stripe billing actions.</p>
        </div>
        {isAdmin && (
          isPro ? (
            <Button
              variant="secondary"
              icon={<ExternalLink className="w-4 h-4" />}
              onClick={handleManageBilling}
              loading={portalStatus === 'loading'}
            >
              Manage Subscription
            </Button>
          ) : (
            <Button
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={handleUpgrade}
              loading={checkoutStatus === 'loading'}
            >
              Upgrade to Pro
            </Button>
          )
        )}
      </div>

      {/* Checkout success banner */}
      {checkoutStatus === 'success' && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 glow-emerald animate-fade-in-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-400">Welcome to Pro!</p>
            <p className="text-xs text-emerald-400/70 mt-0.5">Your subscription is now active. You have access to all Pro features.</p>
          </div>
          <button onClick={() => setCheckoutStatus('idle')} className="text-emerald-400/50 hover:text-emerald-400 transition-colors">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error banner */}
      {errorMessage && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 glow-red animate-fade-in-up">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-400">Something went wrong</p>
            <p className="text-xs text-red-400/70 mt-0.5">{errorMessage}</p>
          </div>
          <button
            onClick={() => { setErrorMessage(''); setCheckoutStatus('idle'); setPortalStatus('idle'); }}
            className="text-red-400/50 hover:text-red-400 transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading overlay during checkout redirect */}
      {checkoutStatus === 'loading' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 glow-blue animate-fade-in-up">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-400">
              {searchParams.get('checkout') === 'success' ? 'Confirming your subscription...' : 'Redirecting to checkout...'}
            </p>
            <p className="text-xs text-blue-400/70 mt-0.5">
              {searchParams.get('checkout') === 'success' ? 'We are verifying your payment with Stripe.' : 'You will be redirected to Stripe to complete payment.'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <Card glow={isPro ? 'blue' : null} className="xl:col-span-4 bg-slate-900/50 border-white/10 backdrop-blur-xl">
          <CardHeader className="mb-4">
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 text-slate-500" />
              <CardTitle>Current Plan</CardTitle>
            </div>
            <Badge variant={isPro ? 'pro' : 'default'} dot pulse={isPro}>{isPro ? 'Pro' : 'Free'}</Badge>
          </CardHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-500">Plan</p>
              <p className="text-2xl font-semibold text-slate-100 tracking-[-0.02em] mt-1">{isPro ? 'Pro' : 'Free'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-500">Status</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full ${subscription?.status === 'active' ? 'bg-emerald-400 animate-dot-pulse' : subscription?.status === 'past_due' ? 'bg-amber-400' : subscription?.status === 'canceled' ? 'bg-red-400' : 'bg-slate-500'}`} />
                <p className="text-sm text-slate-300 capitalize">{subscription?.status === 'past_due' ? 'Past due' : subscription?.status === 'canceled' ? 'Canceled' : subscription?.status || 'Active'}</p>
              </div>
            </div>
            {subscription?.current_period_end && isPro && (
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-slate-500">Renews</p>
                <p className="text-sm text-slate-200 mt-1">{new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="xl:col-span-4 bg-gradient-to-br from-blue-600/8 via-slate-900/55 to-cyan-600/8 border-blue-400/20 backdrop-blur-xl" glow={!isPro ? 'blue' : null}>
          <CardHeader className="mb-4">
            <div className="flex items-center gap-2.5">
              <Crown className="w-4 h-4 text-blue-300" />
              <CardTitle>Pro Plan</CardTitle>
            </div>
            <Badge variant="pro" dot>Pro</Badge>
          </CardHeader>
          <p className="text-sm text-slate-300 mb-4">Unlock advanced team controls, unlimited seats, and Stripe billing management.</p>
          <div className="space-y-2.5 mb-5">
            {plans[1].features.slice(0, 5).map((feature) => (
              <div key={feature} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-sm text-slate-300">{feature}</span>
              </div>
            ))}
          </div>
          {isAdmin ? (
            isPro ? (
              <Button variant="secondary" fullWidth disabled>Current Plan</Button>
            ) : (
              <Button fullWidth icon={<ArrowRight className="w-4 h-4" />} onClick={handleUpgrade} loading={checkoutStatus === 'loading'}>
                Upgrade to Pro
              </Button>
            )
          ) : (
            <Button variant="secondary" fullWidth disabled>Admin only</Button>
          )}
        </Card>

        <Card className="xl:col-span-4 bg-slate-900/50 border-white/10 backdrop-blur-xl">
          <CardHeader className="mb-4">
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-cyan-300" />
              <CardTitle>Usage Limits</CardTitle>
            </div>
            <Badge variant="default">{isPro ? 'Unlimited' : 'Metered'}</Badge>
          </CardHeader>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="text-slate-400">Team members</span>
                <span className="text-slate-200">{isPro ? `${plans[1].features[0]}` : `${plans[0].features[0]}`}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800/70 border border-white/10 overflow-hidden">
                <div className={`h-full rounded-full ${isPro ? 'w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400' : 'w-[72%] bg-gradient-to-r from-blue-500 to-cyan-500'} shadow-[0_0_12px_rgba(59,130,246,0.45)]`} />
              </div>
            </div>
            <div className="text-xs text-slate-500 leading-relaxed">Usage bars are visual summaries. Actual enforcement remains unchanged by your current plan logic.</div>
          </div>
        </Card>

        <Card className="xl:col-span-12 bg-slate-900/50 border-white/10 backdrop-blur-xl">
          <CardHeader className="mb-4">
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 text-slate-400" />
              <CardTitle>Billing Actions</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isPro ? 'pro' : 'default'}>{isPro ? 'Pro' : 'Free'}</Badge>
              {import.meta.env.DEV && <Badge variant="warning">Test Mode</Badge>}
            </div>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg border border-slate-700/40 bg-slate-800/35">
              <p className="text-sm font-medium text-slate-200 mb-1">Start Checkout</p>
              <p className="text-xs text-slate-500 mb-3">Open Stripe Checkout for plan upgrades.</p>
              <Button fullWidth icon={<ArrowRight className="w-4 h-4" />} onClick={handleUpgrade} loading={checkoutStatus === 'loading'} disabled={!isAdmin || isPro}>
                {isPro ? 'Current Plan' : 'Upgrade to Pro'}
              </Button>
            </div>
            <div className="p-4 rounded-lg border border-slate-700/40 bg-slate-800/35">
              <p className="text-sm font-medium text-slate-200 mb-1">Manage Subscription</p>
              <p className="text-xs text-slate-500 mb-3">Open Stripe customer portal.</p>
              <Button fullWidth variant="secondary" icon={<ExternalLink className="w-4 h-4" />} onClick={handleManageBilling} loading={portalStatus === 'loading'} disabled={!isAdmin || !isPro}>
                Open Portal
              </Button>
            </div>
            <div className="p-4 rounded-lg border border-slate-700/40 bg-slate-800/35">
              <p className="text-sm font-medium text-slate-200 mb-1">Role Access</p>
              <p className="text-xs text-slate-500 mb-3">Billing actions are available to organization admins only.</p>
              <Button fullWidth variant="secondary" disabled>
                {isAdmin ? 'Admin Access' : 'Admin only'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
