import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load ALL env vars (not just VITE_ prefixed) for server-side use
  const env = loadEnv(mode, process.cwd(), '');
  const stripeKey = env.STRIPE_SECRET_KEY;
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
  // Service role key is optional; falls back to user JWT for DB writes (RLS allows admin users)
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    plugins: [
      react(),
      {
        name: 'stripe-local-api',
        configureServer(server) {
          // Helper to parse JSON body from IncomingMessage
          const readBody = (req: IncomingMessage): Promise<Record<string, unknown>> =>
            new Promise((resolve, reject) => {
              let data = '';
              req.on('data', (chunk: Buffer) => { data += chunk.toString(); });
              req.on('end', () => {
                try { resolve(JSON.parse(data || '{}')); }
                catch { reject(new Error('Invalid JSON')); }
              });
              req.on('error', reject);
            });

          const send = (res: ServerResponse, status: number, body: unknown) => {
            const json = JSON.stringify(body);
            res.writeHead(status, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            });
            res.end(json);
          };

          // POST /api/stripe-checkout — creates a Checkout Session
          server.middlewares.use('/api/stripe-checkout', async (req, res, next) => {
            if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
            if (req.method !== 'POST') return next();

            if (!stripeKey) {
              send(res, 500, { error: 'STRIPE_SECRET_KEY not found in .env.local' });
              return;
            }

            try {
              const { default: Stripe } = await import('stripe');
              const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
              const body = await readBody(req);
              const { organization_id, customer_email } = body as Record<string, string>;

              if (!organization_id || !customer_email) {
                send(res, 400, { error: 'Missing organization_id or customer_email' });
                return;
              }

              // Fetch or create real Stripe customer
              let customerId: string | undefined;
              if (supabaseUrl && supabaseServiceKey) {
                const subRes = await fetch(
                  `${supabaseUrl}/rest/v1/subscriptions?organization_id=eq.${organization_id}&select=id,stripe_customer_id`,
                  { headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` } }
                );
                const subs: Array<{ id: string; stripe_customer_id: string }> = await subRes.json();
                if (subs?.[0]) {
                  const existingId = subs[0].stripe_customer_id;
                  if (existingId && !existingId.startsWith('cus_free_')) {
                    customerId = existingId;
                  } else {
                    const customer = await stripe.customers.create({ email: customer_email, metadata: { organization_id } });
                    customerId = customer.id;
                    await fetch(`${supabaseUrl}/rest/v1/subscriptions?id=eq.${subs[0].id}`, {
                      method: 'PATCH',
                      headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
                      body: JSON.stringify({ stripe_customer_id: customerId }),
                    });
                  }
                }
              }

              const origin = `http://localhost:${server.config.server.port ?? 5173}`;

              const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
                mode: 'subscription',
                payment_method_types: ['card'],
                line_items: [{
                  price_data: {
                    currency: 'usd',
                    product_data: { name: 'Pro Plan', description: 'Unlimited members, advanced analytics, priority support.' },
                    unit_amount: 2900,
                    recurring: { interval: 'month' },
                  },
                  quantity: 1,
                }],
                success_url: `${origin}/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${origin}/billing?checkout=cancelled`,
                metadata: { organization_id },
                subscription_data: { metadata: { organization_id } },
              };

              if (customerId) sessionParams.customer = customerId;
              else sessionParams.customer_email = customer_email;

              const session = await stripe.checkout.sessions.create(sessionParams);
              send(res, 200, { url: session.url });
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              console.error('[stripe-local] checkout error:', msg);
              send(res, 500, { error: msg });
            }
          });

          // POST /api/stripe-confirm — verifies session and updates DB to pro
          server.middlewares.use('/api/stripe-confirm', async (req, res, next) => {
            if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
            if (req.method !== 'POST') return next();

            if (!stripeKey) {
              send(res, 500, { error: 'STRIPE_SECRET_KEY not found in .env.local' });
              return;
            }

            try {
              const { default: Stripe } = await import('stripe');
              const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
              const body = await readBody(req);
              const { session_id } = body as { session_id?: string };

              if (!session_id) { send(res, 400, { error: 'Missing session_id' }); return; }

              const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ['subscription'] });

              if (session.payment_status !== 'paid' && session.status !== 'complete') {
                send(res, 402, { error: 'Payment not completed' });
                return;
              }

              const organizationId = session.metadata?.organization_id;
              if (organizationId && supabaseUrl) {
                const sub = session.subscription as import('stripe').Stripe.Subscription | null;

                // Use service key if available, otherwise fall back to user JWT
                // (RLS policy "Admins can update subscription for their org" allows this)
                const userJwt = (req.headers.authorization ?? '').replace('Bearer ', '');
                const authToken = supabaseServiceKey ?? userJwt;
                const dbKey = supabaseServiceKey ?? supabaseAnonKey ?? userJwt;

                const dbHeaders = {
                  apikey: dbKey,
                  Authorization: `Bearer ${authToken}`,
                  'Content-Type': 'application/json',
                  Prefer: 'return=minimal',
                };
                const payload: Record<string, unknown> = {
                  plan: 'pro',
                  status: sub?.status ?? 'active',
                  updated_at: new Date().toISOString(),
                };
                if (sub?.id) payload.stripe_subscription_id = sub.id;
                if (sub?.current_period_end) payload.current_period_end = new Date(sub.current_period_end * 1000).toISOString();
                if (session.customer && typeof session.customer === 'string') payload.stripe_customer_id = session.customer;

                const patchRes = await fetch(`${supabaseUrl}/rest/v1/subscriptions?organization_id=eq.${organizationId}`, {
                  method: 'PATCH', headers: dbHeaders, body: JSON.stringify(payload),
                });
                if (!patchRes.ok) {
                  const text = await patchRes.text();
                  console.error('[stripe-local] DB patch failed:', patchRes.status, text);
                }
              }

              send(res, 200, { success: true, plan: 'pro' });
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              console.error('[stripe-local] confirm error:', msg);
              send(res, 500, { error: msg });
            }
          });
        },
      },
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
