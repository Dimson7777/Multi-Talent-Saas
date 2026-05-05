import Stripe from "npm:stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

/**
 * stripe-confirm
 *
 * Called after the user returns from Stripe Checkout with ?checkout=success&session_id=XXX.
 * Verifies the Stripe session server-side (payment_status === "paid") and updates
 * the subscription record in Supabase to "pro".  This eliminates the need for a
 * webhook for demo/portfolio purposes while keeping the secret key on the server only.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // 1. Require authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: authHeader,
      },
    });

    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = await userRes.json();

    // 2. Parse body
    const body = await req.json();
    const { session_id } = body;

    if (!session_id || typeof session_id !== "string") {
      return new Response(JSON.stringify({ error: "Missing session_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Init Stripe with secret key (server-side only)
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return new Response(JSON.stringify({ error: "Payment system is not configured." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // 4. Retrieve the checkout session from Stripe to verify payment
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["subscription"],
    });

    // Only proceed if Stripe confirms the payment is complete
    if (session.payment_status !== "paid" && session.status !== "complete") {
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const organizationId = session.metadata?.organization_id;
    if (!organizationId) {
      return new Response(JSON.stringify({ error: "Missing organization_id in session metadata" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Require admin membership for billing operations.
    const membershipRes = await fetch(
      `${supabaseUrl}/rest/v1/memberships?user_id=eq.${user.id}&organization_id=eq.${organizationId}&select=role&limit=1`,
      {
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
      }
    );
    const memberships = await membershipRes.json();
    const membership = Array.isArray(memberships) ? memberships[0] : null;

    if (!membership || membership.role !== "admin") {
      return new Response(JSON.stringify({ error: "Only organization admins can confirm billing" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Update the subscription in Supabase using service role key
    const sub = session.subscription as Stripe.Subscription | null;

    const dbHeaders = {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    };

    const updatePayload: Record<string, unknown> = {
      plan: "pro",
      status: sub?.status ?? "active",
      updated_at: new Date().toISOString(),
    };

    if (sub?.id) {
      updatePayload.stripe_subscription_id = sub.id;
    }

    if (sub?.current_period_end) {
      updatePayload.current_period_end = new Date(sub.current_period_end * 1000).toISOString();
    }

    // Also persist the real stripe_customer_id from the session
    if (session.customer && typeof session.customer === "string") {
      updatePayload.stripe_customer_id = session.customer;
    }

    const patchRes = await fetch(
      `${supabaseUrl}/rest/v1/subscriptions?organization_id=eq.${organizationId}`,
      {
        method: "PATCH",
        headers: dbHeaders,
        body: JSON.stringify(updatePayload),
      }
    );

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      console.error("Failed to update subscription in DB:", errText);
      return new Response(JSON.stringify({ error: "Failed to update subscription" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Log the upgrade for the activity log
    try {
      await fetch(`${supabaseUrl}/rest/v1/activity_logs`, {
        method: "POST",
        headers: dbHeaders,
        body: JSON.stringify({
          organization_id: organizationId,
          user_id: "system",
          action: "subscription_updated",
          details: { plan: "pro", status: updatePayload.status, source: "stripe_confirm" },
        }),
      });
    } catch (_) {
      // Non-fatal: logging failure should not block the response
    }

    return new Response(JSON.stringify({ success: true, plan: "pro" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("stripe-confirm error:", err instanceof Error ? err.message : String(err));
    return new Response(
      JSON.stringify({ error: "Failed to confirm subscription. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
