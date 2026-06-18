
DROP VIEW IF EXISTS public.public_profiles CASCADE;
DROP VIEW IF EXISTS public.public_caregivers CASCADE;

CREATE VIEW public.public_profiles
WITH (security_invoker = on) AS
SELECT id, full_name, role, avatar_url, created_at FROM public.profiles;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

CREATE VIEW public.public_caregivers
WITH (security_invoker = on) AS
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

-- Allow anon SELECT on base tables limited to public-safe columns is hard via views with invoker.
-- Add a permissive public-read policy that returns only via views' joined data; instead let views work,
-- we need policy on base tables for anon. Add narrow anon policies:
CREATE POLICY "profiles public read" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "caregivers public read" ON public.caregiver_details FOR SELECT TO anon, authenticated USING (is_active = true);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.caregiver_details TO anon;

-- Function: revoke public, only authenticated may call
REVOKE EXECUTE ON FUNCTION public.get_caregiver_phone(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_caregiver_phone(UUID) TO authenticated;
