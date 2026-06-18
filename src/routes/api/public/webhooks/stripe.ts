import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_SECRET_KEY;
        const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret || !whSecret) return new Response("Stripe not configured", { status: 500 });
        const sig = request.headers.get("stripe-signature") ?? "";
        const body = await request.text();
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Stripe = require("stripe");
        const stripe = new Stripe(secret, { apiVersion: "2024-12-18.acacia" as any });
        let event: any;
        try {
          event = stripe.webhooks.constructEvent(body, sig, whSecret);
        } catch (err: any) {
          return new Response(`Invalid signature: ${err?.message}`, { status: 400 });
        }

        if (event.type === "checkout.session.completed") {
          const session = event.data.object as any;
          const contractId = session.metadata?.contract_id;
          if (!contractId) return new Response("missing metadata", { status: 400 });
          const total = (session.amount_total ?? 0) / 100;
          const caregiverShare = +(total * 0.8).toFixed(2);
          const platformShare = +(total * 0.2).toFixed(2);
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("contracts").update({ status: "paid" }).eq("id", contractId);
          await supabaseAdmin.from("payments").insert({
            contract_id: contractId,
            stripe_payment_id: session.payment_intent,
            total_value: total,
            caregiver_share: caregiverShare,
            platform_share: platformShare,
            is_split_successful: true,
          });
        }
        return new Response("ok");
      },
    },
  },
});