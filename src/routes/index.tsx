import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Search, ShieldCheck, Phone, BookHeart, Lock, Star, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Index,
});

type PublicCaregiver = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  category: "profissional" | "acompanhante";
  hourly_rate: number;
  city: string;
  neighborhood: string;
  avg_rating: number;
  reviews_count: number;
};

function HeartLogo({ onClick, className = "" }: { onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={"group inline-flex items-center gap-2 " + className}
      aria-label="Ir para profissionais"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-warm shadow-warm">
        <Heart className="h-5 w-5 text-white animate-heart-pulse" fill="currentColor" />
      </span>
      <span className="text-2xl font-extrabold tracking-tight text-foreground">
        Cuidar<span className="text-primary">Já</span>
      </span>
    </button>
  );
}

function Header({ onScrollToList }: { onScrollToList: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <HeartLogo onClick={onScrollToList} />
        <nav className="flex items-center gap-2">
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Quero trabalhar</Button>
          </Link>
          <Link to="/buscar">
            <Button className="rounded-full bg-gradient-warm text-white hover:opacity-95" size="sm">Buscar Cuidador</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={"h-3.5 w-3.5 " + (i < full ? "fill-primary text-primary" : "text-muted-foreground/30")} />
      ))}
    </div>
  );
}

function Index() {
  const [city, setCity] = useState("");
  const [pros, setPros] = useState<PublicCaregiver[]>([]);
  const listRef = useRef<HTMLElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("public_caregivers").select("*").limit(4);
      if (data) setPros(data as PublicCaregiver[]);
    })();
  }, []);

  const scrollToList = () => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/buscar", search: { cidade: city } as any });
  };

  const seguranca = [
    { icon: ShieldCheck, title: "Validação de documentos", desc: "RG, CPF e certificado profissional são verificados antes do cuidador aparecer na vitrine." },
    { icon: Phone, title: "Suporte a emergências 24h", desc: "Canal direto para a família acionar nossa equipe em qualquer hora do dia ou da noite." },
    { icon: BookHeart, title: "Dicas de cuidado com idosos", desc: "Conteúdo curado por enfermeiros: prevenção de quedas, medicação, alimentação e bem-estar emocional." },
    { icon: Lock, title: "Pagamento seguro com split", desc: "O valor fica retido até a confirmação. 80% vai ao cuidador, 20% para garantia e suporte da plataforma." },
  ];

  const depoimentos = [
    { nome: "Maria Carmo", papel: "Filha da Sra. Nair", texto: "O CuidarJá salvou nossa semana. Encontramos a Ana em menos de 2 horas para acompanhar minha mãe no hospital. Muito seguro!" },
    { nome: "Roberto Souza", papel: "Neto do Sr. Geraldo", texto: "Excelente plataforma. O processo de pagamento com divisão clara nos deu muita confiança e o cuidador foi impecável." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header onScrollToList={scrollToList} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 pt-12 pb-16 text-center sm:px-6 sm:pt-20 sm:pb-24">
          <button
            type="button"
            onClick={scrollToList}
            className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-4 py-1.5 text-xs font-semibold text-primary shadow-sm transition hover:shadow-warm"
          >
            <Heart className="h-3.5 w-3.5 animate-heart-pulse" fill="currentColor" />
            Toque para ver cuidadores prontos para ajudar
          </button>
          <h1 className="text-balance text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
            O carinho e a segurança que{" "}
            <span className="bg-gradient-warm bg-clip-text text-transparent">quem você ama</span> merece.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-foreground/70 sm:text-lg">
            Conectamos famílias a cuidadores profissionais e acompanhantes verificados e avaliados —
            atenção de verdade, todos os dias, com pagamento seguro.
          </p>

          <form
            onSubmit={onSearch}
            className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-warm sm:flex-row sm:items-center"
          >
            <div className="flex flex-1 items-center gap-2 px-3">
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Em qual cidade você precisa de um cuidador?"
                className="border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
              />
            </div>
            <Button type="submit" size="lg" className="rounded-xl bg-gradient-warm text-white hover:opacity-95 sm:w-auto">
              Buscar
            </Button>
          </form>

          <p className="mt-4 text-xs text-foreground/60">
            Mais de 8.000 famílias atendidas em todo o Brasil
          </p>
        </div>
      </section>

      {/* Segurança */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Confiança em primeiro lugar
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Segurança que abraça sua família</h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Cuidar de quem amamos exige rigor. Veja como protegemos cada contrato.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {seguranca.map((s) => (
            <div key={s.title} className="rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40 hover:shadow-warm">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-warm text-white shadow-warm">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Depoimentos */}
      <section className="bg-gradient-hero/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Famílias que já confiaram</h2>
            <p className="mt-2 text-sm text-muted-foreground">Histórias reais de quem encontrou cuidado de verdade.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {depoimentos.map((d) => (
              <article key={d.nome} className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
                <Stars value={5} />
                <p className="mt-3 text-base leading-relaxed text-foreground/85">"{d.texto}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-warm text-base font-bold text-white">
                    {d.nome.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{d.nome}</div>
                    <div className="text-xs text-muted-foreground">{d.papel}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Profissionais em destaque */}
      <section ref={listRef} className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mb-8 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Profissionais em destaque</h2>
            <p className="mt-1 text-sm text-muted-foreground">Verificados, avaliados e prontos para acolher.</p>
          </div>
          <Link to="/buscar">
            <Button variant="ghost" className="text-primary">Ver todos <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
        {pros.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Carregando profissionais...
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pros.map((p) => (
              <Link
                key={p.id}
                to="/cuidador/$id"
                params={{ id: p.id }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-warm"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-secondary">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt={p.full_name} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-primary">{p.full_name.charAt(0)}</div>
                  )}
                  <span className="absolute left-3 top-3 inline-flex items-center rounded-full border border-primary/20 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    {p.category === "profissional" ? "Profissional" : "Acompanhante"}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-sm font-semibold leading-tight">{p.full_name}</h3>
                  <div className="mt-1 text-xs text-muted-foreground">{p.neighborhood}, {p.city}</div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Stars value={Number(p.avg_rating)} />
                    <span className="text-xs text-muted-foreground">({p.reviews_count})</span>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <span className="text-base font-bold">R$ {Number(p.hourly_rate).toFixed(0)}<span className="text-xs font-normal text-muted-foreground">/h</span></span>
                    <span className="text-xs font-semibold text-primary">Ver perfil →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-border/60 bg-card/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" fill="currentColor" />
            CuidarJá © {new Date().getFullYear()}
          </div>
          <div>Feito com cuidado, para quem cuida.</div>
        </div>
      </footer>
    </div>
  );
}