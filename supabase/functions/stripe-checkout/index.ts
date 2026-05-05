import Stripe from "npm:stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user's JWT with Supabase
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

    const body = await req.json();
    const { organization_id, customer_email } = body;

    if (!organization_id || !customer_email) {
      return new Response(JSON.stringify({ error: "Missing organization_id or customer_email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Require admin membership for billing operations.
    const membershipRes = await fetch(
      `${supabaseUrl}/rest/v1/memberships?user_id=eq.${user.id}&organization_id=eq.${organization_id}&select=role&limit=1`,
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
      return new Response(JSON.stringify({ error: "Only organization admins can manage billing" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return new Response(JSON.stringify({ error: "Payment system is not configured. Please contact support." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Fetch existing subscription for this org using service role
    const subRes = await fetch(
      `${supabaseUrl}/rest/v1/subscriptions?organization_id=eq.${organization_id}&select=id,stripe_customer_id,plan`,
      {
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
      }
    );
    const subs = await subRes.json();

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ error: "No subscription record found for this organization" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let customerId = subs[0].stripe_customer_id;

    // Create a real Stripe customer if they only have a placeholder
    if (!customerId || customerId.startsWith("cus_free_")) {
      const customer = await stripe.customers.create({
        email: customer_email,
        metadata: { organization_id },
      });
      customerId = customer.id;

      // Update the subscription record with the real Stripe customer ID
      await fetch(`${supabaseUrl}/rest/v1/subscriptions?id=eq.${subs[0].id}`, {
        method: "PATCH",
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ stripe_customer_id: customerId }),
      });
    }

    const origin = new URL(req.headers.get("origin") || req.headers.get("referer") || `http://localhost:5173`).origin;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Pro Plan",
              description: "Unlimited team members, advanced analytics & reports, priority support, custom integrations, and audit trail.",
            },
            unit_amount: 2900, // $29.00/month
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing?checkout=cancelled`,
      metadata: { organization_id },
      subscription_data: {
        metadata: { organization_id },
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Checkout session creation failed:", err instanceof Error ? err.message : String(err));
    return new Response(
      JSON.stringify({ error: "Failed to create checkout session. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
