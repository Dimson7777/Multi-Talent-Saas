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

    // Verify the user's JWT
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return new Response(JSON.stringify({ error: "Payment system is not configured. Please contact support." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const body = await req.json();
    const { customer_id, return_url, organization_id } = body;

    if (!customer_id || !organization_id) {
      return new Response(JSON.stringify({ error: "Missing customer_id or organization_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    // Ensure the provided customer_id belongs to the same organization.
    const subRes = await fetch(
      `${supabaseUrl}/rest/v1/subscriptions?organization_id=eq.${organization_id}&select=stripe_customer_id&limit=1`,
      {
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
      }
    );
    const subs = await subRes.json();
    const stripeCustomerId = Array.isArray(subs) && subs[0] ? subs[0].stripe_customer_id : null;

    if (!stripeCustomerId || stripeCustomerId !== customer_id) {
      return new Response(JSON.stringify({ error: "Invalid customer for this organization" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Guard: cannot open portal for placeholder customer IDs
    if (customer_id.startsWith("cus_free_")) {
      return new Response(JSON.stringify({ error: "No Stripe customer found. Please upgrade to Pro first." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = new URL(req.headers.get("origin") || req.headers.get("referer") || "http://localhost:5173").origin;

    const session = await stripe.billingPortal.sessions.create({
      customer: customer_id,
      return_url: return_url || `${origin}/billing?portal=returned`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Portal session creation failed:", err instanceof Error ? err.message : String(err));
    return new Response(
      JSON.stringify({ error: "Failed to open billing portal. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
