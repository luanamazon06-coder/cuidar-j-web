import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurada. Peça ao admin para adicionar via Secrets.");
  const mod = await import("stripe");
  const Stripe = (mod as any).default ?? mod;
  return new Stripe(key, {
    apiVersion: "2024-12-18.acacia" as any,
    httpClient: Stripe.createFetchHttpClient ? Stripe.createFetchHttpClient() : undefined,
  });
}

function originFromEnv(): string {
  return process.env.PUBLIC_SITE_URL || "https://example.com";
}

export const createConnectAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({}).parse(d ?? {}))
  .handler(async ({ context }) => {
    const stripe = await getStripe();
    const { data: details } = await context.supabase.from("caregiver_details").select("stripe_account_id").eq("id", context.userId).maybeSingle();
    let accountId = details?.stripe_account_id as string | undefined;
    if (!accountId) {
      const acct = await stripe.accounts.create({ type: "express", capabilities: { transfers: { requested: true } } });
      accountId = acct.id;
      await context.supabase.from("caregiver_details").update({ stripe_account_id: accountId }).eq("id", context.userId);
    }
    const origin = originFromEnv();
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/cadastro-cuidador`,
      return_url: `${origin}/carteira`,
      type: "account_onboarding",
    });
    return { url: link.url as string };
  });

export const createCheckoutForContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    caregiver_id: z.string().uuid(),
    hours: z.number().int().min(1).max(240),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const stripe = await getStripe();
    // Read public caregiver data (server side, RLS-safe via the user client)
    const { data: pro, error } = await context.supabase
      .from("public_caregivers")
      .select("id, full_name, hourly_rate")
      .eq("id", data.caregiver_id)
      .maybeSingle();
    if (error || !pro) throw new Error("Cuidador não encontrado.");

    const { data: cd } = await context.supabase
      .from("caregiver_details")
      .select("stripe_account_id")
      .eq("id", data.caregiver_id)
      .maybeSingle();
    // cd may be null due to RLS; load via admin to fetch stripe id
    let stripeAccount = cd?.stripe_account_id as string | undefined;
    if (!stripeAccount) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const r = await supabaseAdmin.from("caregiver_details").select("stripe_account_id").eq("id", data.caregiver_id).maybeSingle();
      stripeAccount = (r.data as any)?.stripe_account_id ?? undefined;
    }
    if (!stripeAccount) throw new Error("Este cuidador ainda não conectou a conta de recebimento Stripe.");

    const totalCents = Math.round(Number(pro.hourly_rate) * data.hours * 100);
    const feeCents = Math.round(totalCents * 0.2);
    const origin = originFromEnv();

    // Create pending contract (admin client to ignore client-side RLS race conditions)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: contract, error: cErr } = await supabaseAdmin.from("contracts").insert({
      client_id: context.userId,
      caregiver_id: data.caregiver_id,
      hours: data.hours,
      total_amount: totalCents / 100,
      status: "pending",
    }).select("id").single();
    if (cErr || !contract) throw new Error(cErr?.message ?? "Falha ao criar contrato.");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "brl",
          unit_amount: totalCents,
          product_data: { name: `Serviço de cuidado — ${pro.full_name} (${data.hours}h)` },
        },
      }],
      payment_intent_data: {
        application_fee_amount: feeCents,
        transfer_data: { destination: stripeAccount },
      },
      metadata: { contract_id: contract.id },
      success_url: `${origin}/contratos?ok=1`,
      cancel_url: `${origin}/cuidador/${data.caregiver_id}?cancel=1`,
    });

    await supabaseAdmin.from("contracts").update({ stripe_checkout_session_id: session.id }).eq("id", contract.id);
    return { url: session.url as string };
  });