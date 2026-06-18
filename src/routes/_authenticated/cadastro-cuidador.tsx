import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Heart, Info, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { createConnectAccount } from "@/lib/stripe.functions";

export const Route = createFileRoute("/_authenticated/cadastro-cuidador")({
  component: CadastroCuidador,
});

function CadastroCuidador() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // step 1
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");

  // step 2
  const [category, setCategory] = useState<"profissional" | "acompanhante">("profissional");
  const [hourlyRate, setHourlyRate] = useState(40);
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [certificateUrl, setCertificateUrl] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);

  const connect = useServerFn(createConnectAccount);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: p } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      if (p) {
        setFullName(p.full_name ?? "");
        setCpf(p.cpf ?? "");
        setRg(p.rg ?? "");
        setPhone(p.phone ?? "");
        setAvatarUrl(p.avatar_url ?? "");
      }
      const { data: cd } = await supabase.from("caregiver_details").select("*").eq("id", u.user.id).maybeSingle();
      if (cd) {
        setCategory(cd.category);
        setHourlyRate(Number(cd.hourly_rate));
        setCity(cd.city);
        setNeighborhood(cd.neighborhood);
        setAge(cd.age ?? "");
        setBio(cd.bio ?? "");
        setCertificateUrl(cd.certificate_url ?? "");
      }
    })();
  }, []);

  const uploadCertificate = async (file: File) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const path = `${u.user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("certificates").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    setCertificateUrl(path);
    toast.success("Certificado enviado.");
  };

  const saveStep1 = async () => {
    if (!fullName || !cpf || !phone) return toast.error("Preencha nome, CPF e telefone.");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName, cpf, rg, phone, avatar_url: avatarUrl || null, role: "caregiver",
    }).eq("id", u.user.id);
    setLoading(false);
    if (error) return toast.error(error.message);
    setStep(2);
  };

  const saveStep2 = async () => {
    if (category === "profissional" && !certificateUrl) return toast.error("Envie seu certificado/COREN.");
    if (!city || !neighborhood || !bio) return toast.error("Preencha cidade, bairro e descrição.");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setLoading(true);
    const { error } = await supabase.from("caregiver_details").upsert({
      id: u.user.id, category, bio, hourly_rate: hourlyRate,
      certificate_url: certificateUrl || null, city, neighborhood,
      age: age === "" ? null : Number(age), is_active: true,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSavedId(u.user.id);
    setStep(3);
  };

  const conectarStripe = async () => {
    setLoading(true);
    try {
      const res = await connect({ data: {} });
      if (res?.url) window.location.href = res.url;
      else toast.error("Não foi possível iniciar a conexão Stripe.");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao conectar Stripe.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-warm">
              <Heart className="h-5 w-5 text-white animate-heart-pulse" fill="currentColor" />
            </span>
            <span className="font-extrabold">Cuidar<span className="text-primary">Já</span></span>
          </Link>
          <div className="text-xs text-muted-foreground">Passo {step} de 3</div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Cadastro de Cuidador</h1>
        <p className="mt-1 text-sm text-muted-foreground">Quanto mais completo seu perfil, mais famílias confiam em você.</p>

        <Alert className="mt-6 border-primary/20 bg-primary/5">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <AlertTitle>Taxa de intermediação de 20%</AlertTitle>
          <AlertDescription>
            A plataforma retém uma taxa de 20% sobre o valor do serviço para garantir seguro, validações e suporte 24h. Você recebe 80% líquido em cada contrato.
          </AlertDescription>
        </Alert>

        {step === 1 && (
          <section className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold">Dados básicos</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label>Nome completo *</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
              <div className="space-y-2"><Label>CPF *</Label><Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" /></div>
              <div className="space-y-2"><Label>RG</Label><Input value={rg} onChange={(e) => setRg(e.target.value)} /></div>
              <div className="space-y-2"><Label>Telefone (WhatsApp) *</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 90000-0000" /></div>
              <div className="space-y-2"><Label>Foto de perfil (URL)</Label><Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." /></div>
            </div>
            <div className="flex justify-end">
              <Button onClick={saveStep1} disabled={loading} className="bg-gradient-warm text-white">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />} Próximo <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold">Categoria & preço</h2>
            <div className="space-y-2">
              <Label>Categoria de atuação *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="profissional">Profissional de Saúde / Cuidador</SelectItem>
                  <SelectItem value="acompanhante">Somente Acompanhante</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {category === "acompanhante" && (
              <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                <Info className="h-4 w-4" />
                <AlertTitle>⚠️ Olá! Sobre o papel de Acompanhante</AlertTitle>
                <AlertDescription>
                  Como Acompanhante, seu papel fundamental é fazer companhia, trazer alegria e alertar a família em caso de qualquer mudança.
                  Esta categoria é voltada ao suporte social e afetivo, <strong>não incluindo procedimentos técnicos de enfermagem</strong>. Obrigado por cuidar com o coração!
                </AlertDescription>
              </Alert>
            )}

            {category === "profissional" && (
              <div className="space-y-2">
                <Label>Certificado / COREN *</Label>
                <Input type="file" accept="image/*,application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCertificate(f); }} />
                {certificateUrl && <p className="text-xs text-muted-foreground">✓ Arquivo enviado: {certificateUrl}</p>}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Valor por hora (R$) *</Label><Input type="number" min={15} value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} /></div>
              <div className="space-y-2"><Label>Idade</Label><Input type="number" value={age} onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))} /></div>
              <div className="space-y-2"><Label>Cidade *</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
              <div className="space-y-2"><Label>Bairro *</Label><Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} /></div>
            </div>

            <div className="space-y-2"><Label>Sobre mim *</Label><Textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Conte sua experiência, especialidades e como você cuida." /></div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
              <Button onClick={saveStep2} disabled={loading} className="bg-gradient-warm text-white">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />} Próximo <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold">Conta de recebimento (Stripe Connect)</h2>
            <p className="text-sm text-muted-foreground">
              Para receber pagamentos, conecte sua conta Stripe. O split de 80% do valor de cada contrato é depositado automaticamente em sua conta.
            </p>
            <Button onClick={conectarStripe} disabled={loading} className="bg-gradient-warm text-white" size="lg">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Conectar conta de recebimento
            </Button>
            <p className="text-xs text-muted-foreground">
              Você pode finalizar depois — seu perfil já está ativo na vitrine. Caso o Stripe ainda não esteja configurado, fale com o suporte.
            </p>
            <div className="flex justify-end pt-3">
              <Button variant="outline" onClick={() => navigate({ to: "/carteira" })}>Ir para minha carteira</Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}