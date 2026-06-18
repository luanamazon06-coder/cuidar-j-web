
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_caregiver_phone(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_caregiver_phone(UUID) TO authenticated;
