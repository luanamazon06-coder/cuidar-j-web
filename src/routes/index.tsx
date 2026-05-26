import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Search, ShieldCheck, CreditCard, Users, Stethoscope } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Heart className="h-5 w-5" fill="currentColor" />
      </div>
      <span className="text-xl font-bold tracking-tight text-foreground">
        Cuidar<span className="text-primary">Já</span>
      </span>
    </Link>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <Button variant="ghost" className="hidden sm:inline-flex">Quero trabalhar</Button>
          <Button variant="outline" className="sm:hidden" size="sm">Trabalhar</Button>
          <Link to="/buscar">
            <Button className="rounded-full" size="sm">Buscar Cuidador</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Index() {
  const [city, setCity] = useState("");
  const navigate = useNavigate();

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/buscar", search: { cidade: city } as any });
  };

  const benefits = [
    {
      icon: ShieldCheck,
      title: "Segurança e antecedentes checados",
      desc: "Todos os cuidadores passam por verificação de identidade e antecedentes antes de aparecer na plataforma.",
    },
    {
      icon: CreditCard,
      title: "Pagamento direto no app",
      desc: "Transparência total: contrate, pague e avalie em um só lugar, sem intermediários ou surpresas.",
    },
    {
      icon: Users,
      title: "Profissionais e acompanhantes",
      desc: "Encontre desde enfermeiros certificados até acompanhantes para companhia e tarefas do dia a dia.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-secondary/40 via-background to-background" />
        <div className="mx-auto max-w-4xl px-4 pt-12 pb-16 text-center sm:px-6 sm:pt-20 sm:pb-24">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Cuidado verificado, perto de você
          </div>
          <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
            O carinho e a segurança que{" "}
            <span className="text-primary">quem você ama</span> merece.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Conectamos famílias a cuidadores profissionais e acompanhantes
            práticos, verificados e avaliados — para que seu idoso receba
            atenção de verdade, todos os dias.
          </p>

          {/* Search */}
          <form
            onSubmit={onSearch}
            className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-lg shadow-primary/5 sm:flex-row sm:items-center"
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
            <Button type="submit" size="lg" className="rounded-xl sm:w-auto">
              Buscar
            </Button>
          </form>

          <p className="mt-4 text-xs text-muted-foreground">
            Mais de 8.000 famílias atendidas em todo o Brasil
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Por que famílias escolhem o CuidarJá
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tudo o que você precisa para contratar com tranquilidade.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <b.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 bg-card/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            CuidarJá © {new Date().getFullYear()}
          </div>
          <div>Feito com cuidado, para quem cuida.</div>
        </div>
      </footer>
    </div>
  );
}
