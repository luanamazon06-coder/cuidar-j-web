import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Heart, MapPin, SlidersHorizontal, Star } from "lucide-react";

type SearchParams = { cidade?: string };

export const Route = createFileRoute("/buscar")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    cidade: typeof s.cidade === "string" ? s.cidade : "",
  }),
  component: BuscarPage,
});

type Pro = {
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

function Filters({
  nome, setNome, cidade, setCidade, tipo, setTipo, preco, setPreco,
}: {
  nome: string; setNome: (v: string) => void;
  cidade: string; setCidade: (v: string) => void;
  tipo: string; setTipo: (v: string) => void;
  preco: [number, number]; setPreco: (v: [number, number]) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="nome">Buscar por nome</Label>
        <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Ana" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cidade">Cidade</Label>
        <Input id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex: São Paulo" />
      </div>
      <div className="space-y-2">
        <Label>Categoria</Label>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="profissional">Profissional / Cuidador</SelectItem>
            <SelectItem value="acompanhante">Acompanhante</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Faixa de preço/hora</Label>
          <span className="text-xs text-muted-foreground">R${preco[0]} – R${preco[1]}</span>
        </div>
        <Slider min={15} max={150} step={5} value={preco} onValueChange={(v) => setPreco([v[0], v[1]] as [number, number])} />
      </div>
    </div>
  );
}

function BuscarPage() {
  const { cidade: cidadeInicial } = Route.useSearch();
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState(cidadeInicial ?? "");
  const [tipo, setTipo] = useState("todos");
  const [preco, setPreco] = useState<[number, number]>([15, 150]);
  const [pros, setPros] = useState<Pro[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("public_caregivers").select("*");
      if (data) setPros(data as Pro[]);
    })();
  }, []);

  const results = useMemo(
    () => pros.filter((p) => {
      const n = nome.trim() === "" || p.full_name.toLowerCase().includes(nome.toLowerCase());
      const c = cidade.trim() === "" || p.city.toLowerCase().includes(cidade.toLowerCase());
      const t = tipo === "todos" || p.category === tipo;
      const r = Number(p.hourly_rate) >= preco[0] && Number(p.hourly_rate) <= preco[1];
      return n && c && t && r;
    }),
    [pros, nome, cidade, tipo, preco],
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-warm">
              <Heart className="h-5 w-5 text-white animate-heart-pulse" fill="currentColor" />
            </span>
            <span className="text-xl font-extrabold">Cuidar<span className="text-primary">Já</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontal className="h-4 w-4" /> Filtros
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader><SheetTitle>Filtros</SheetTitle></SheetHeader>
                <div className="mt-6 px-4">
                  <Filters nome={nome} setNome={setNome} cidade={cidade} setCidade={setCidade} tipo={tipo} setTipo={setTipo} preco={preco} setPreco={setPreco} />
                </div>
              </SheetContent>
            </Sheet>
            <Link to="/auth"><Button variant="ghost" size="sm" className="hidden sm:inline-flex">Entrar</Button></Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold">Filtros</h2>
            <Filters nome={nome} setNome={setNome} cidade={cidade} setCidade={setCidade} tipo={tipo} setTipo={setTipo} preco={preco} setPreco={setPreco} />
          </div>
        </aside>

        <main>
          <div className="mb-4">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {results.length} cuidador{results.length === 1 ? "" : "es"} disponíve{results.length === 1 ? "l" : "is"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {cidade ? `Resultados para "${cidade}"` : "Profissionais em todo o Brasil"}
            </p>
          </div>

          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Nenhum cuidador encontrado. Tente ampliar a busca.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((p) => (
                <Link
                  key={p.id}
                  to="/cuidador/$id"
                  params={{ id: p.id }}
                  className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-warm"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt={p.full_name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-primary">{p.full_name.charAt(0)}</div>
                    )}
                    <span className="absolute left-3 top-3 inline-flex items-center rounded-full border border-primary/20 bg-white/95 px-2.5 py-1 text-xs font-semibold text-primary">
                      {p.category === "profissional" ? "Profissional / Cuidador" : "Acompanhante"}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold leading-tight">
                          {p.full_name}{p.age ? <>, <span className="text-muted-foreground">{p.age}</span></> : null}
                        </h3>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" /> {p.neighborhood}, {p.city}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">R$ {Number(p.hourly_rate).toFixed(0)}</div>
                        <div className="text-[11px] text-muted-foreground">/hora</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Stars value={Number(p.avg_rating)} />
                      <span className="text-xs font-medium">{Number(p.avg_rating).toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({p.reviews_count} avaliações)</span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{p.bio}</p>
                    <Button className="mt-4 w-full rounded-xl bg-gradient-warm text-white">Ver Perfil e Contratar</Button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}