
-- limpa qualquer estado parcial
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.contracts CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.caregiver_details CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP VIEW IF EXISTS public.public_caregivers CASCADE;
DROP VIEW IF EXISTS public.public_profiles CASCADE;
DROP FUNCTION IF EXISTS public.get_caregiver_phone(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TYPE IF EXISTS public.contract_status CASCADE;
DROP TYPE IF EXISTS public.caregiver_category CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

CREATE TYPE public.app_role AS ENUM ('client', 'caregiver', 'admin');
CREATE TYPE public.caregiver_category AS ENUM ('profissional', 'acompanhante');
CREATE TYPE public.contract_status AS ENUM ('pending', 'paid', 'completed', 'cancelled');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  role public.app_role NOT NULL DEFAULT 'client',
  avatar_url TEXT,
  phone TEXT,
  cpf TEXT,
  rg TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.caregiver_details (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  category public.caregiver_category NOT NULL DEFAULT 'acompanhante',
  bio TEXT NOT NULL DEFAULT '',
  hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  certificate_url TEXT,
  city TEXT NOT NULL DEFAULT '',
  neighborhood TEXT NOT NULL DEFAULT '',
  age INT,
  stripe_account_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.caregiver_details TO authenticated;
GRANT ALL ON public.caregiver_details TO service_role;
ALTER TABLE public.caregiver_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own caregiver select" ON public.caregiver_details FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own caregiver insert" ON public.caregiver_details FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own caregiver update" ON public.caregiver_details FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID,
  client_name TEXT NOT NULL DEFAULT 'Cliente',
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "reviews insert by client" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);

CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  caregiver_id UUID NOT NULL,
  hours NUMERIC(10,2) NOT NULL DEFAULT 1,
  total_amount NUMERIC(10,2) NOT NULL,
  status public.contract_status NOT NULL DEFAULT 'pending',
  stripe_checkout_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.contracts TO authenticated;
GRANT ALL ON public.contracts TO service_role;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contracts participant select" ON public.contracts FOR SELECT TO authenticated USING (auth.uid() = client_id OR auth.uid() = caregiver_id);
CREATE POLICY "contracts client insert" ON public.contracts FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "contracts participant update" ON public.contracts FOR UPDATE TO authenticated USING (auth.uid() = client_id OR auth.uid() = caregiver_id);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  stripe_payment_id TEXT,
  total_value NUMERIC(10,2) NOT NULL,
  caregiver_share NUMERIC(10,2) NOT NULL,
  platform_share NUMERIC(10,2) NOT NULL,
  is_split_successful BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments participant select" ON public.payments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND (c.client_id = auth.uid() OR c.caregiver_id = auth.uid()))
);

CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, full_name, role, avatar_url, created_at FROM public.profiles;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

CREATE OR REPLACE VIEW public.public_caregivers AS
SELECT
  cd.id,
  p.full_name,
  p.avatar_url,
  cd.category,
  cd.bio,
  cd.hourly_rate,
  cd.city,
  cd.neighborhood,
  cd.age,
  cd.is_active,
  COALESCE((SELECT AVG(r.rating)::numeric(3,2) FROM public.reviews r WHERE r.caregiver_id = cd.id), 0) AS avg_rating,
  (SELECT COUNT(*) FROM public.reviews r WHERE r.caregiver_id = cd.id) AS reviews_count
FROM public.caregiver_details cd
JOIN public.profiles p ON p.id = cd.id
WHERE cd.is_active = true;
GRANT SELECT ON public.public_caregivers TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_caregiver_phone(_caregiver_id UUID)
RETURNS TEXT
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_phone TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.caregiver_id = _caregiver_id AND c.client_id = auth.uid() AND c.status IN ('paid','completed')
  ) THEN RETURN NULL; END IF;
  SELECT phone INTO v_phone FROM public.profiles WHERE id = _caregiver_id;
  RETURN v_phone;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_caregiver_phone(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'client')
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DO $$
DECLARE
  ids UUID[] := ARRAY[gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid()];
  names TEXT[] := ARRAY['Ana Beatriz','Carlos Henrique','Mariana Souza','José Ricardo','Luciana Pereira','Fernanda Lima','Roberto Alves','Patrícia Gomes'];
  photos TEXT[] := ARRAY[
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80',
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80',
    'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&q=80',
    'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80',
    'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&q=80',
    'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&q=80'
  ];
  cats public.caregiver_category[] := ARRAY['profissional','profissional','acompanhante','profissional','profissional','acompanhante','profissional','profissional']::public.caregiver_category[];
  rates NUMERIC[] := ARRAY[55,30,22,28,65,20,32,60];
  ages INT[] := ARRAY[34,41,28,52,36,30,45,39];
  cities TEXT[] := ARRAY['São Paulo','São Paulo','Rio de Janeiro','São Paulo','Belo Horizonte','Rio de Janeiro','Curitiba','São Paulo'];
  hoods TEXT[] := ARRAY['Pinheiros','Vila Mariana','Copacabana','Tatuapé','Savassi','Tijuca','Batel','Moema'];
  bios TEXT[] := ARRAY[
    'Enfermeira há 10 anos, especialista em geriatria.',
    'Cuidador certificado pelo SENAC, experiência com Alzheimer.',
    'Acompanhante carinhosa, ótima companhia para passeios.',
    'Mais de 15 anos cuidando de idosos com mobilidade reduzida.',
    'Enfermeira hospitalar com foco em cuidados pós-cirúrgicos.',
    'Estudante de enfermagem, paciente e atenciosa.',
    'Cuidador noturno disponível, experiência com diabetes.',
    'Enfermeira domiciliar, atendimento humanizado.'
  ];
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    INSERT INTO public.profiles (id, full_name, role, avatar_url) VALUES (ids[i], names[i], 'caregiver', photos[i]);
    INSERT INTO public.caregiver_details (id, category, bio, hourly_rate, city, neighborhood, age) VALUES (ids[i], cats[i], bios[i], rates[i], cities[i], hoods[i], ages[i]);
  END LOOP;
  INSERT INTO public.reviews (caregiver_id, client_name, rating, comment) VALUES
    (ids[1], 'Maria Carmo (Filha da Sra. Nair)', 5, 'O CuidarJá salvou nossa semana. Encontramos a Ana em menos de 2 horas para acompanhar minha mãe no hospital. Muito seguro!'),
    (ids[2], 'Roberto Souza (Neto do Sr. Geraldo)', 5, 'Excelente plataforma. O processo de pagamento com divisão clara nos deu muita confiança e o cuidador foi impecável.'),
    (ids[1], 'João Pedro', 5, 'Profissional dedicada, super recomendo.'),
    (ids[3], 'Beatriz', 4, 'Muito atenciosa com meu avô.'),
    (ids[5], 'Luis F.', 5, 'Cuidado impecável, tranquilidade total.');
END $$;
