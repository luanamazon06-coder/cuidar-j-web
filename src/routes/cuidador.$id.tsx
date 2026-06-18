import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Heart, MapPin, Star, Lock } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { createCheckoutForContract } from "@/lib/stripe.functions";

export const Route = createFileRoute("/cuidador/$id")({
  component: PerfilCuidador,
});

type Pub = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  category: "profissional" | "acompanhante";
  bio: string;
  hourly_rate: number;
  city: string;
  neighborhood: string;
  age: number | null;
  avg_rating: number;
  reviews_count: number;
};

type Review = { id: string; client_name: string; rating: number; comment: string; created_at: string };

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const full = Math.round(value);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} style={{ width: size, height: size }} className={i < full ? "fill-primary text-primary" : "text-muted-foreground/30"} />
      ))}
    </div>
  );
}

function PerfilCuidador() {
  const { id } = Route.useParams();
  const [pro, setPro] = useState<Pub | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [hours, setHours] = useState(4);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const checkout = useServerFn(createCheckoutForContract);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("public_caregivers").select("*").eq("id", id).maybeSingle(),
        supabase.from("reviews").select("*").eq("caregiver_id", id).order("created_at", { ascending: false }),
      ]);
      setPro(p as Pub | null);
      setReviews((r ?? []) as Review[]);
    })();
  }, [id]);

  const onContratar = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) { navigate({ to: "/auth" }); return; }
    setLoading(true);
    try {
      const res = await checkout({ data: { caregiver_id: id, hours } });
      if (res?.url) window.location.href = res.url;
      else toast.error("Não foi possível iniciar o pagamento.");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro no pagamento.");
    } finally { setLoading(false); }
  };

  if (!pro) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando…</div>;
  }

  const total = Number(pro.hourly_rate) * hours;
  const taxa = total * 0.2;
  const cuidador = total * 0.8;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/buscar" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-warm">
              <Heart className="h-5 w-5 text-white animate-heart-pulse" fill="currentColor" />
            </span>
            <span className="font-extrabold">Cuidar<span className="text-primary">Já</span></span>
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_320px]">
        <main>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="aspect-[16/9] w-full overflow-hidden bg-secondary">
              {pro.avatar_url ? (
                <img src={pro.avatar_url} alt={pro.full_name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-6xl font-bold text-primary">{pro.full_name.charAt(0)}</div>
              )}
            </div>
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary">
                    {pro.category === "profissional" ? "Profissional / Cuidador" : "Acompanhante"}
                  </span>
                  <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{pro.full_name}{pro.age ? `, ${pro.age}` : ""}</h1>
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {pro.neighborhood}, {pro.city}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">R$ {Number(pro.hourly_rate).toFixed(0)}<span className="text-sm font-normal text-muted-foreground">/h</span></div>
                  <div className="mt-1 flex items-center justify-end gap-1.5">
                    <Stars value={Number(pro.avg_rating)} />
                    <span className="text-xs text-muted-foreground">({pro.reviews_count})</span>
                  </div>
                </div>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-foreground/80">{pro.bio}</p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-xs text-secondary-foreground">
                <Lock className="h-4 w-4" />
                Telefone e contato direto são liberados ao cliente após confirmação do pagamento.
              </div>
            </div>
          </div>

          <section className="mt-6 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold">Avaliações ({reviews.length})</h2>
            <div className="mt-4 space-y-4">
              {reviews.length === 0 && <p className="text-sm text-muted-foreground">Sem avaliações ainda.</p>}
              {reviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{r.client_name}</div>
                    <Stars value={r.rating} />
                  </div>
                  <p className="mt-2 text-sm text-foreground/80">"{r.comment}"</p>
                </div>
              ))}
            </div>
          </section>
        </main>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-warm">
            <h3 className="text-base font-bold">Contratar agora</h3>
            <p className="mt-1 text-xs text-muted-foreground">Pagamento seguro com split automático 80/20.</p>

            <div className="mt-4 space-y-2">
              <Label htmlFor="hours">Quantas horas?</Label>
              <Input id="hours" type="number" min={1} max={120} value={hours} onChange={(e) => setHours(Math.max(1, parseInt(e.target.value || "1", 10)))} />
            </div>

            <div className="mt-4 space-y-1 rounded-xl bg-muted/40 p-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Valor do serviço</span><span className="font-medium">R$ {total.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs text-muted-foreground"><span>Cuidador recebe (80%)</span><span>R$ {cuidador.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs text-muted-foreground"><span>Plataforma (20%)</span><span>R$ {taxa.toFixed(2)}</span></div>
            </div>

            <Button onClick={onContratar} disabled={loading} className="mt-5 w-full bg-gradient-warm text-white" size="lg">
              {loading ? "Processando…" : "Contratar"}
            </Button>
            <p className="mt-3 text-[11px] text-muted-foreground">
              A plataforma retém 20% sobre o valor do serviço para garantir seguro, validações e suporte 24h.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}