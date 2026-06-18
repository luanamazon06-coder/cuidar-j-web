
# Plano de Implementação — CuidarJá v2

Marca mantida ("CuidarJá"). Entrega única cobrindo visual, backend (Lovable Cloud), cadastro, vitrine, contratação e split de pagamento via Stripe Connect.

## 1. Identidade visual (Home + global)

- Nova paleta em `src/styles.css` (tokens HSL/oklch semânticos):
  - `--primary`: vermelho paixão vivo (~ oklch(0.58 0.22 25))
  - `--primary-glow`: coral quente para degradês
  - `--accent`: rosa suave acolhedor
  - `--gradient-hero`: linear-gradient acolhedor (vermelho → coral → creme)
  - `--shadow-warm`: sombra com primary 25%
- Tipografia: manter Inter (sistema), sem CDN externa.
- Animação `pulse-heart` (keyframes em styles.css) aplicada ao ícone de coração no header/hero.
- Home (`src/routes/index.tsx`):
  - Header centralizado "CuidarJá ❤️" (coração pulsando). Clique no nome/coração faz `scrollIntoView` da seção "Profissionais em destaque" abaixo.
  - Hero com degradê quente, frase de impacto, busca por cidade.
  - Seção **Segurança & Credibilidade**: 4 cards (Validação de Documentos, Suporte a Emergências 24h, Dicas de Cuidado com Idosos, Pagamento Seguro com Split).
  - Seção **Depoimentos** (2 cards reais do briefing: Maria Carmo, Roberto Souza) com avatar fictício, 5 estrelas.
  - Seção **Profissionais em destaque** (preview de 4 cards reais do Supabase) com link para `/buscar`.
  - Footer simples.

## 2. Backend — Lovable Cloud (Supabase)

Habilitar Lovable Cloud + Auth (somente email/senha, com auto-confirm para dev).

### Tabelas (migração única, com GRANTs)
- `app_role` enum: `client`, `caregiver`, `admin`.
- `profiles`: `id uuid PK = auth.users.id`, `full_name`, `role app_role`, `avatar_url`, `phone text` (protegido por RLS), `cpf`, `rg`, `created_at`.
- `caregiver_details`: `id uuid PK FK→profiles`, `category` (`profissional`|`acompanhante`), `bio`, `hourly_rate numeric`, `certificate_url`, `city`, `neighborhood`, `stripe_account_id`, `is_active bool`.
- `reviews`: `id`, `caregiver_id FK`, `client_id FK`, `rating int 1..5`, `comment`, `created_at`.
- `contracts`: `id`, `client_id`, `caregiver_id`, `total_amount numeric`, `hours numeric`, `status` (`pending`|`paid`|`completed`|`cancelled`), `stripe_checkout_session_id`, `created_at`.
- `payments`: `id`, `contract_id FK`, `stripe_payment_id`, `total_value`, `caregiver_share` (80%), `platform_share` (20%), `is_split_successful bool`, `created_at`.
- Trigger `handle_new_user` em `auth.users` → cria linha em `profiles` (role default `client`, lê `raw_user_meta_data`).
- Storage bucket público `avatars`, bucket privado `certificates`.

### RLS / Privacidade (regra crítica do telefone)
- `profiles`: SELECT público de colunas seguras via VIEW `public_profiles` (sem `phone`, `cpf`, `rg`). UPDATE só pelo próprio user.
- `caregiver_details`: SELECT público de colunas seguras via VIEW `public_caregivers` (sem `stripe_account_id`, sem `certificate_url`). UPDATE só pelo dono.
- `contracts`: SELECT só client_id ou caregiver_id envolvido.
- `payments`: SELECT só participantes.
- Função `public.get_caregiver_phone(caregiver_id uuid)` SECURITY DEFINER: retorna `phone` apenas se existir contrato `status='paid'` entre `auth.uid()` e `caregiver_id`. Frontend chama RPC para revelar telefone pós-pagamento.

## 3. Auth & Rotas protegidas

- `/auth`: login/cadastro email+senha, com seletor de papel (Cliente / Cuidador). `emailRedirectTo: window.location.origin`.
- Subárvore `_authenticated/` gerenciada pela integração.
- Rotas:
  - `/` (pública) — Home rebrandada.
  - `/buscar` (pública) — Vitrine + filtros (nome, categoria, cidade, preço). Dados via server fn `getPublicCaregivers` (publishable key + view pública).
  - `/cuidador/$id` (pública) — Perfil público (sem telefone), reviews, botão **Contratar** (redireciona para `/auth` se não logado, senão abre checkout).
  - `/_authenticated/cadastro-cuidador` — Wizard de cadastro do cuidador.
  - `/_authenticated/contratos` — lista contratos do cliente; quando `status='paid'`, exibe telefone (via RPC).
  - `/_authenticated/carteira` — Carteira do cuidador: saldo (soma de `caregiver_share` em `paid`), histórico, status do Stripe Connect (onboarding link).

## 4. Cadastro do cuidador (wizard 3 passos)

Step 1 — Dados básicos: nome, CPF, RG, telefone, upload de avatar (Storage `avatars`), bio.
Step 2 — Categoria + preço:
- Select "Profissional de Saúde/Cuidador" → upload obrigatório de certificado/COREN no bucket `certificates`.
- Select "Somente Acompanhante" → `<Alert>` imediato com o texto exato do briefing (mensagem social/humana).
- Campo `hourly_rate`. Banner explicando taxa de 20%: "A plataforma retém 20% do valor do serviço para garantir seguro e suporte. Você recebe 80% líquido."
Step 3 — Stripe Connect: botão "Conectar conta de recebimento" chama server fn que cria Account + AccountLink (onboarding). Salva `stripe_account_id`.

Validação com Zod (trim, limites, regex CPF). Toast via sonner.

## 5. Vitrine & Perfil

- `/buscar`: filtros (busca por nome — input com debounce; categoria — Select; cidade; faixa de preço). Cards mostram avatar, nome, idade (derivada), categoria com tag colorida, média de estrelas + nº de reviews, preço/hora, cidade/bairro, botão "Ver perfil". **Sem telefone, sem email.**
- `/cuidador/$id`: foto grande, bio, preço, média + lista de reviews (nome do cliente + estrelas + comentário). Botão grande **Contratar** → modal "Quantas horas?" → server fn cria `contract` (status pending) + Stripe Checkout Session com `payment_intent_data.application_fee_amount = 20%` e `transfer_data.destination = stripe_account_id` → redireciona ao Stripe.

## 6. Pagamento — Stripe Connect (real)

- Habilitar integração Stripe (BYOK — usuário fornece `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` via secrets).
- Server functions (`src/lib/stripe.functions.ts`):
  - `createConnectAccount` (auth) → `accounts.create({type:'express'})` + `accountLinks.create` → retorna URL onboarding.
  - `createCheckoutForContract` (auth) → cria contract pending, cria Checkout Session com split.
  - `getCaregiverPhone` (auth) → chama RPC `get_caregiver_phone`.
- Server route pública `/api/public/webhooks/stripe` (`src/routes/api/public/webhooks/stripe.ts`):
  - Verifica assinatura `STRIPE_WEBHOOK_SECRET` (raw body + timingSafeEqual).
  - Em `checkout.session.completed`: marca `contracts.status='paid'`, insere `payments` (total_value, caregiver_share=80%, platform_share=20%, is_split_successful=true), retorna 200.
- UI do cliente em `/contratos`: se contrato `paid`, mostra telefone do cuidador (via RPC) e botão "Marcar como concluído".

## 7. Detalhes técnicos

- Server fns ficam em `src/lib/*.functions.ts` (não em `src/server/`). Admin client importado dinâmico dentro do `.handler()`.
- Tabela `reviews` semeada com seed migration usando 2 depoimentos do briefing + alguns reais para os 8 cuidadores mock existentes (ou substituir mocks por seed real). Mantemos os 8 cuidadores semeados via migration para a vitrine não nascer vazia.
- Validação Zod em todos os formulários.
- Acessibilidade: aria-labels, contrast AA na nova paleta vermelha.
- SEO: head() por rota.

## 8. Riscos / dependências do usuário

- Cliente precisará fornecer `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` via tool de secrets, e configurar o webhook no Dashboard Stripe apontando para `https://project--<id>.lovable.app/api/public/webhooks/stripe`.
- Stripe Connect Express precisa estar ativado na conta Stripe do usuário.
- Sem essas chaves, o fluxo de pagamento falha (UI mostra erro claro).

## 9. Ordem de execução (build mode)

1. Migração (enums, tabelas, GRANTs, RLS, views, RPC, trigger, buckets, seeds).
2. `styles.css` + animação heart pulse.
3. Home rebrandada com seções novas.
4. Página `/auth` + integração Cloud.
5. Wizard `/cadastro-cuidador` + uploads.
6. Vitrine + perfil público (server fn publishable).
7. Server fns Stripe + route webhook.
8. `/contratos` + `/carteira`.
9. Pedir secrets do Stripe ao usuário.
10. Smoke test via curl/Playwright.
