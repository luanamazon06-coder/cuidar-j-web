import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, Wallet, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/carteira")({
  component: Carteira,
});

type Payment = { id: string; total_value: number; caregiver_share: number; platform_share: number; is_split_successful: boolean; created_at: string; contract_id: string };

function Carteira() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stripeId, setStripeId] = useState<string | null>(null);
  const [saldo, setSaldo] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: cd } = await supabase.from("caregiver_details").select("stripe_account_id").eq("id", u.user.id).maybeSingle();
      setStripeId(cd?.stripe_account_id ?? null);
      const { data: contracts } = await supabase.from("contracts").select("id").eq("caregiver_id", u.user.id);
      const ids = (contracts ?? []).map((c: any) => c.id);
      if (ids.length === 0) return;
      const { data: pays } = await supabase.from("payments").select("*").in("contract_id", ids).order("created_at", { ascending: false });
      const list = (pays ?? []) as Payment[];
      setPayments(list);
      setSaldo(list.reduce((s, p) => s + Number(p.caregiver_share), 0));
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-warm">
              <Heart className="h-5 w-5 text-white animate-heart-pulse" fill="currentColor" />
            </span>
            <span className="font-extrabold">Cuidar<span className="text-primary">Já</span></span>
          </Link>
          <h1 className="text-sm font-semibold text-muted-foreground">Minha carteira</h1>
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <section className="rounded-2xl border border-border bg-gradient-warm p-6 text-white shadow-warm">
          <div className="flex items-center gap-2 text-sm opacity-90"><Wallet className="h-4 w-4" /> Saldo recebido (líquido 80%)</div>
          <div className="mt-2 text-4xl font-extrabold">R$ {saldo.toFixed(2)}</div>
          <div className="mt-2 text-xs opacity-80">Transferido automaticamente para sua conta Stripe Connect.</div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Stripe Connect</div>
              <div className="text-xs text-muted-foreground">{stripeId ? `Conta vinculada: ${stripeId}` : "Conta ainda não conectada"}</div>
            </div>
            <Link to="/cadastro-cuidador">
              <Button variant="outline" size="sm">{stripeId ? "Atualizar" : "Conectar"} <ExternalLink className="h-3.5 w-3.5" /></Button>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">Histórico de pagamentos</h2>
          {payments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">Nenhum pagamento recebido ainda.</div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="px-4 py-3">Data</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Você recebeu</th><th className="px-4 py-3">Plataforma</th><th className="px-4 py-3">Split</th></tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-4 py-3">{new Date(p.created_at).toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-3">R$ {Number(p.total_value).toFixed(2)}</td>
                      <td className="px-4 py-3 font-semibold text-primary">R$ {Number(p.caregiver_share).toFixed(2)}</td>
                      <td className="px-4 py-3 text-muted-foreground">R$ {Number(p.platform_share).toFixed(2)}</td>
                      <td className="px-4 py-3">{p.is_split_successful ? "✓ ok" : "pendente"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}