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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey || !webhookSecret) {
      console.error("Stripe environment variables not configured");
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const headers = {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    };

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organization_id;

        if (organizationId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

          await fetch(`${supabaseUrl}/rest/v1/subscriptions?organization_id=eq.${organizationId}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({
              plan: "pro",
              status: subscription.status,
              stripe_subscription_id: subscription.id,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            }),
          });

          // Log the upgrade
          await fetch(`${supabaseUrl}/rest/v1/activity_logs`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              organization_id: organizationId,
              user_id: "system",
              action: "subscription_updated",
              details: { plan: "pro", status: subscription.status, source: "stripe_webhook" },
            }),
          });

          console.log(`Subscription activated for org ${organizationId}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const subRes = await fetch(
          `${supabaseUrl}/rest/v1/subscriptions?stripe_customer_id=eq.${customerId}&select=organization_id,plan`,
          { headers }
        );
        const subs = await subRes.json();

        if (subs.length > 0) {
          const orgId = subs[0].organization_id;
          // If subscription is still active, keep pro; otherwise revert
          const newPlan = subscription.status === "active" ? "pro" : "free";

          await fetch(`${supabaseUrl}/rest/v1/subscriptions?organization_id=eq.${orgId}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({
              plan: newPlan,
              status: subscription.status,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            }),
          });

          console.log(`Subscription updated for org ${orgId}: plan=${newPlan}, status=${subscription.status}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const subRes = await fetch(
          `${supabaseUrl}/rest/v1/subscriptions?stripe_customer_id=eq.${customerId}&select=organization_id`,
          { headers }
        );
        const subs = await subRes.json();

        if (subs.length > 0) {
          const orgId = subs[0].organization_id;

          await fetch(`${supabaseUrl}/rest/v1/subscriptions?organization_id=eq.${orgId}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({
              plan: "free",
              status: "canceled",
              stripe_subscription_id: null,
              current_period_end: null,
            }),
          });

          // Log the cancellation
          await fetch(`${supabaseUrl}/rest/v1/activity_logs`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              organization_id: orgId,
              user_id: "system",
              action: "subscription_canceled",
              details: { plan: "free", status: "canceled", source: "stripe_webhook" },
            }),
          });

          console.log(`Subscription canceled for org ${orgId}, downgraded to free`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const subRes = await fetch(
          `${supabaseUrl}/rest/v1/subscriptions?stripe_customer_id=eq.${customerId}&select=organization_id`,
          { headers }
        );
        const subs = await subRes.json();

        if (subs.length > 0) {
          const orgId = subs[0].organization_id;

          await fetch(`${supabaseUrl}/rest/v1/subscriptions?organization_id=eq.${orgId}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ status: "past_due" }),
          });

          console.log(`Payment failed for org ${orgId}, status set to past_due`);
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook processing failed:", err instanceof Error ? err.message : String(err));
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
