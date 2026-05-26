import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Heart, MapPin, SlidersHorizontal, Star } from "lucide-react";

type SearchParams = { cidade?: string };

export const Route = createFileRoute("/buscar")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    cidade: typeof s.cidade === "string" ? s.cidade : "",
  }),
  component: BuscarPage,
});

type Tipo = "Enfermeiro" | "Cuidador Certificado" | "Acompanhante";

type Pro = {
  id: number;
  nome: string;
  idade: number;
  tipo: Tipo;
  rating: number;
  reviews: number;
  preco: number;
  cidade: string;
  bairro: string;
  foto: string;
  bio: string;
};

const PROS: Pro[] = [
  { id: 1, nome: "Ana Beatriz", idade: 34, tipo: "Enfermeiro", rating: 4.9, reviews: 47, preco: 55, cidade: "São Paulo", bairro: "Pinheiros", foto: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80", bio: "Enfermeira há 10 anos, especialista em geriatria." },
  { id: 2, nome: "Carlos Henrique", idade: 41, tipo: "Cuidador Certificado", rating: 4.8, reviews: 32, preco: 30, cidade: "São Paulo", bairro: "Vila Mariana", foto: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80", bio: "Cuidador certificado pelo SENAC, experiência com Alzheimer." },
  { id: 3, nome: "Mariana Souza", idade: 28, tipo: "Acompanhante", rating: 4.9, reviews: 12, preco: 22, cidade: "Rio de Janeiro", bairro: "Copacabana", foto: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80", bio: "Acompanhante carinhosa, ótima companhia para passeios." },
  { id: 4, nome: "José Ricardo", idade: 52, tipo: "Cuidador Certificado", rating: 4.7, reviews: 88, preco: 28, cidade: "São Paulo", bairro: "Tatuapé", foto: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&q=80", bio: "Mais de 15 anos cuidando de idosos com mobilidade reduzida." },
  { id: 5, nome: "Luciana Pereira", idade: 36, tipo: "Enfermeiro", rating: 5.0, reviews: 19, preco: 65, cidade: "Belo Horizonte", bairro: "Savassi", foto: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80", bio: "Enfermeira hospitalar com foco em cuidados pós-cirúrgicos." },
  { id: 6, nome: "Fernanda Lima", idade: 30, tipo: "Acompanhante", rating: 4.6, reviews: 8, preco: 20, cidade: "Rio de Janeiro", bairro: "Tijuca", foto: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80", bio: "Estudante de enfermagem, paciente e atenciosa." },
  { id: 7, nome: "Roberto Alves", idade: 45, tipo: "Cuidador Certificado", rating: 4.8, reviews: 54, preco: 32, cidade: "Curitiba", bairro: "Batel", foto: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&q=80", bio: "Cuidador noturno disponível, experiência com diabetes." },
  { id: 8, nome: "Patrícia Gomes", idade: 39, tipo: "Enfermeiro", rating: 4.9, reviews: 71, preco: 60, cidade: "São Paulo", bairro: "Moema", foto: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&q=80", bio: "Enfermeira domiciliar, atendimento humanizado." },
];

function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            "h-3.5 w-3.5 " +
            (i < full ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")
          }
        />
      ))}
    </div>
  );
}

function tagClasses(t: Tipo) {
  switch (t) {
    case "Enfermeiro":
      return "bg-primary/10 text-primary border-primary/20";
    case "Cuidador Certificado":
      return "bg-secondary text-secondary-foreground border-secondary";
    case "Acompanhante":
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
}

function Filters({
  cidade, setCidade, tipo, setTipo, preco, setPreco,
}: {
  cidade: string; setCidade: (v: string) => void;
  tipo: string; setTipo: (v: string) => void;
  preco: [number, number]; setPreco: (v: [number, number]) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="cidade">Cidade</Label>
        <Input id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex: São Paulo" />
      </div>
      <div className="space-y-2">
        <Label>Tipo de cuidador</Label>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="Enfermeiro">Enfermeiro</SelectItem>
            <SelectItem value="Cuidador Certificado">Cuidador Certificado</SelectItem>
            <SelectItem value="Acompanhante">Acompanhante Informal</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Faixa de preço por hora</Label>
          <span className="text-xs text-muted-foreground">R${preco[0]} – R${preco[1]}</span>
        </div>
        <Slider
          min={15}
          max={100}
          step={5}
          value={preco}
          onValueChange={(v) => setPreco([v[0], v[1]] as [number, number])}
        />
      </div>
    </div>
  );
}

function BuscarPage() {
  const { cidade: cidadeInicial } = Route.useSearch();
  const [cidade, setCidade] = useState(cidadeInicial ?? "");
  const [tipo, setTipo] = useState<string>("todos");
  const [preco, setPreco] = useState<[number, number]>([15, 100]);

  const results = useMemo(
    () =>
      PROS.filter((p) => {
        const cityOk = cidade.trim() === "" || p.cidade.toLowerCase().includes(cidade.toLowerCase());
        const tipoOk = tipo === "todos" || p.tipo === tipo;
        const priceOk = p.preco >= preco[0] && p.preco <= preco[1];
        return cityOk && tipoOk && priceOk;
      }),
    [cidade, tipo, preco],
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Heart className="h-5 w-5" fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Cuidar<span className="text-primary">Já</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="mt-6 px-4">
                  <Filters cidade={cidade} setCidade={setCidade} tipo={tipo} setTipo={setTipo} preco={preco} setPreco={setPreco} />
                </div>
              </SheetContent>
            </Sheet>
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Quero trabalhar</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Filtros</h2>
            <Filters cidade={cidade} setCidade={setCidade} tipo={tipo} setTipo={setTipo} preco={preco} setPreco={setPreco} />
          </div>
        </aside>

        {/* Results */}
        <main>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {results.length} cuidador{results.length === 1 ? "" : "es"} disponíve{results.length === 1 ? "l" : "is"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {cidade ? `Resultados para "${cidade}"` : "Mostrando profissionais em todo o Brasil"}
              </p>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Nenhum cuidador encontrado com esses filtros. Tente ampliar a busca.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((p) => (
                <article
                  key={p.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
                    <img
                      src={p.foto}
                      alt={`Foto de ${p.nome}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <span
                      className={`absolute left-3 top-3 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${tagClasses(p.tipo)}`}
                    >
                      {p.tipo}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold leading-tight">
                          {p.nome}, <span className="text-muted-foreground">{p.idade}</span>
                        </h3>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {p.bairro}, {p.cidade}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground">R$ {p.preco}</div>
                        <div className="text-[11px] text-muted-foreground">/hora</div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <Stars value={p.rating} />
                      <span className="text-xs font-medium">{p.rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({p.reviews} avaliações)</span>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{p.bio}</p>

                    <Button className="mt-4 w-full rounded-xl">Ver Perfil e Contratar</Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}