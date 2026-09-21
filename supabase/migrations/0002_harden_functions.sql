-- Hardening n.a.v. Supabase security advisors:
-- 1. finalize_invoice() is SECURITY DEFINER en omzeilt dus RLS -- zonder
--    expliciete grants is hij ook aanroepbaar door de 'anon' rol via
--    PostgREST. Dat mag niet: alleen ingelogde gebruikers mogen facturen
--    finaliseren.
-- 2. touch_updated_at() had geen vast search_path.

revoke execute on function finalize_invoice(uuid) from public;
revoke execute on function finalize_invoice(uuid) from anon;
grant execute on function finalize_invoice(uuid) to authenticated;

alter function touch_updated_at() set search_path = public;
