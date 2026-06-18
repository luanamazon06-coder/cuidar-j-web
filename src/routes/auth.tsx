import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"client" | "caregiver">("client");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo de volta!");
    navigate({ to: role === "caregiver" ? "/carteira" : "/" });
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, role },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Cadastro feito! Você já pode entrar.");
    if (role === "caregiver") navigate({ to: "/cadastro-cuidador" });
    else navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-10">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-warm shadow-warm">
            <Heart className="h-5 w-5 text-white animate-heart-pulse" fill="currentColor" />
          </span>
          <span className="text-2xl font-extrabold">Cuidar<span className="text-primary">Já</span></span>
        </Link>
        <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-warm">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={onSignIn} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email-in">E-mail</Label>
                  <Input id="email-in" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pwd-in">Senha</Label>
                  <Input id="pwd-in" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-warm text-white">Entrar</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={onSignUp} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="nm">Nome completo</Label>
                  <Input id="nm" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-up">E-mail</Label>
                  <Input id="email-up" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pwd-up">Senha</Label>
                  <Input id="pwd-up" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Eu quero</Label>
                  <RadioGroup value={role} onValueChange={(v) => setRole(v as "client" | "caregiver")} className="grid grid-cols-2 gap-2">
                    <label className={"cursor-pointer rounded-xl border p-3 text-center text-sm " + (role === "client" ? "border-primary bg-primary/5" : "border-border")}>
                      <RadioGroupItem value="client" className="sr-only" />
                      Contratar cuidador
                    </label>
                    <label className={"cursor-pointer rounded-xl border p-3 text-center text-sm " + (role === "caregiver" ? "border-primary bg-primary/5" : "border-border")}>
                      <RadioGroupItem value="caregiver" className="sr-only" />
                      Trabalhar cuidando
                    </label>
                  </RadioGroup>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-warm text-white">Criar conta</Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}