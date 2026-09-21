-- Laat de publieke /setup-pagina weten of er al een account bestaat, zonder
-- verder iets over auth.users prijs te geven. Voorkomt dat de eerste-account
-- pagina voor altijd een open registratieformulier blijft.
create or replace function has_any_account()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from auth.users);
$$;

revoke execute on function has_any_account() from public;
grant execute on function has_any_account() to anon, authenticated;
