import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, Phone, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/contratos")({
  component: Contratos,
});

type ContractRow = {
  id: string;
  caregiver_id: string;
  hours: number;
  total_amount: number;
  status: "pending" | "paid" | "completed" | "cancelled";
  created_at: string;
  caregiver_name?: string;
  caregiver_avatar?: string | null;
};

function Contratos() {
  const [rows, setRows] = useState<ContractRow[]>([]);
  const [phones, setPhones] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("contracts").select("*").eq("client_id", u.user.id).order("created_at", { ascending: false });
      if (!data) return;
      const caregivers = await supabase.from("public_profiles").select("id, full_name, avatar_url").in("id", data.map((d: any) => d.caregiver_id));
      const map: Record<string, any> = {};
      (caregivers.data ?? []).forEach((c: any) => { map[c.id] = c; });
      setRows(data.map((d: any) => ({ ...d, caregiver_name: map[d.caregiver_id]?.full_name, caregiver_avatar: map[d.caregiver_id]?.avatar_url })));
    })();
  }, []);

  const revealPhone = async (caregiverId: string) => {
    const { data, error } = await supabase.rpc("get_caregiver_phone", { _caregiver_id: caregiverId });
    if (error) return toast.error(error.message);
    if (!data) return toast.error("Telefone disponível apenas após pagamento confirmado.");
    setPhones((p) => ({ ...p, [caregiverId]: data as string }));
  };

  const marcarConcluido = async (id: string) => {
    const { error } = await supabase.from("contracts").update({ status: "completed" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Serviço concluído.");
    setRows((rs) => rs.map((r) => r.id === id ? { ...r, status: "completed" } : r));
  };

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
          <h1 className="text-sm font-semibold text-muted-foreground">Meus contratos</h1>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Você ainda não contratou ninguém. <Link to="/buscar" className="text-primary underline">Buscar cuidadores</Link>.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <article key={r.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  {r.caregiver_avatar
                    ? <img src={r.caregiver_avatar} className="h-12 w-12 rounded-xl object-cover" alt="" />
                    : <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary font-bold">{(r.caregiver_name ?? "C").charAt(0)}</div>}
                  <div>
                    <div className="text-sm font-semibold">{r.caregiver_name ?? "Cuidador"}</div>
                    <div className="text-xs text-muted-foreground">{r.hours}h · R$ {Number(r.total_amount).toFixed(2)} · {new Date(r.created_at).toLocaleDateString("pt-BR")}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + (r.status === "paid" ? "bg-emerald-100 text-emerald-700" : r.status === "completed" ? "bg-blue-100 text-blue-700" : r.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground")}>
                    {r.status === "pending" ? "Pagamento pendente" : r.status === "paid" ? "Pago" : r.status === "completed" ? "Concluído" : "Cancelado"}
                  </span>
                  {(r.status === "paid" || r.status === "completed") ? (
                    phones[r.caregiver_id] ? (
                      <a href={`tel:${phones[r.caregiver_id]}`} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-warm px-3 py-1.5 text-xs font-semibold text-white">
                        <Phone className="h-3.5 w-3.5" /> {phones[r.caregiver_id]}
                      </a>
                    ) : (
                      <Button size="sm" onClick={() => revealPhone(r.caregiver_id)} className="bg-gradient-warm text-white"><Phone className="h-3.5 w-3.5" /> Ver telefone</Button>
                    )
                  ) : (
                    <Button size="sm" variant="outline" disabled><Lock className="h-3.5 w-3.5" /> Liberado após pagamento</Button>
                  )}
                  {r.status === "paid" && (
                    <Button size="sm" variant="outline" onClick={() => marcarConcluido(r.id)}>Marcar concluído</Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}