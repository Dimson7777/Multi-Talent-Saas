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
  Sparkles,
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Billing</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your subscription and billing details</p>
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

      {/* Current subscription card */}
      <Card glow={isPro ? 'blue' : null}>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-4 h-4 text-slate-500" />
            <CardTitle>Current Subscription</CardTitle>
          </div>
          <Badge variant={isPro ? 'pro' : 'default'} dot pulse={isPro}>
            {isPro ? 'Pro' : 'Free'}
          </Badge>
        </CardHeader>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Plan</p>
            <p className="text-lg font-bold text-white mt-0.5">{isPro ? 'Pro' : 'Free'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${
                subscription?.status === 'active' ? 'bg-emerald-400 animate-dot-pulse' :
                subscription?.status === 'past_due' ? 'bg-amber-400' :
                subscription?.status === 'canceled' ? 'bg-red-400' : 'bg-slate-500'
              }`} />
              <p className="text-lg font-bold text-white capitalize">
                {subscription?.status === 'past_due' ? 'Past Due' :
                 subscription?.status === 'canceled' ? 'Canceled' :
                 subscription?.status || 'Active'}
              </p>
            </div>
          </div>
          {subscription?.current_period_end && isPro && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Renews</p>
              <p className="text-lg font-bold text-white mt-0.5">
                {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          )}
          {isPro && isAdmin && (
            <div className="ml-auto">
              <Button
                variant="secondary"
                icon={<ExternalLink className="w-4 h-4" />}
                onClick={handleManageBilling}
                loading={portalStatus === 'loading'}
              >
                Manage Subscription
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Plan comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {plans.map((plan, i) => {
          const isCurrentPlan = (plan.id === 'free' && !isPro) || (plan.id === 'pro' && isPro);
          const isProPlan = plan.id === 'pro';

          return (
            <Card
              key={plan.id}
              hover
              glow={isProPlan && !isCurrentPlan ? 'blue' : isCurrentPlan && isProPlan ? 'emerald' : null}
              className={`relative overflow-hidden animate-fade-in-up ${isProPlan && !isCurrentPlan ? 'border-blue-500/25 bg-gradient-to-br from-blue-600/5 via-slate-900/80 to-cyan-600/5' : isCurrentPlan && isProPlan ? 'border-emerald-500/20 bg-gradient-to-br from-emerald-600/5 via-slate-900/80 to-cyan-600/5' : ''}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {isProPlan && !isCurrentPlan && (
                <div className="absolute top-0 right-0 flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-bl-xl">
                  <Sparkles className="w-3 h-3" />
                  Popular
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute top-0 right-0 flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-bl-xl">
                  <CheckCircle2 className="w-3 h-3" />
                  Current
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-2.5 mb-2">
                  {isProPlan ? <Crown className="w-5 h-5 text-blue-400" /> : <Zap className="w-5 h-5 text-slate-500" />}
                  <h3 className="text-xl font-bold text-white tracking-tight">{plan.name}</h3>
                </div>
                <p className="text-slate-500 text-sm">{plan.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white tracking-tight">{plan.price}</span>
                  <span className="text-slate-500 text-sm">{plan.period}</span>
                </div>
              </div>

              <div className="space-y-2.5 mb-6">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
                {plan.limitations.map((limitation) => (
                  <div key={limitation} className="flex items-start gap-2.5">
                    <XCircle className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                    <span className="text-sm text-slate-500">{limitation}</span>
                  </div>
                ))}
              </div>

              {isAdmin ? (
                isCurrentPlan ? (
                  <Button variant="secondary" fullWidth disabled>{plan.cta}</Button>
                ) : (
                  <Button
                    fullWidth
                    icon={isProPlan ? <ArrowRight className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                    onClick={handleUpgrade}
                    loading={checkoutStatus === 'loading'}
                  >
                    {plan.cta}
                  </Button>
                )
              ) : (
                <Button variant="secondary" fullWidth disabled>Admin only</Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
