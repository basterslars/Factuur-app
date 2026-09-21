-- De status 'te_laat' heeft een vervaldatum nodig om ergens tegen af te
-- zetten. Voeg een betalingstermijn toe aan de instellingen en een
-- vervaldatum aan de factuur, ingevuld op het moment van finaliseren.
alter table company_settings
  add column if not exists payment_term_days integer not null default 14;

alter table invoices
  add column if not exists due_date date;

create or replace function finalize_invoice(p_invoice_id uuid)
returns invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings company_settings%rowtype;
  v_customer customers%rowtype;
  v_invoice invoices%rowtype;
  v_number text;
begin
  select * into v_invoice from invoices where id = p_invoice_id for update;
  if not found then
    raise exception 'Factuur niet gevonden';
  end if;

  if v_invoice.status <> 'concept' then
    return v_invoice;
  end if;

  select * into v_settings from company_settings for update limit 1;
  if not found then
    raise exception 'Bedrijfsinstellingen ontbreken';
  end if;

  select * into v_customer from customers where id = v_invoice.customer_id;
  if not found then
    raise exception 'Klant niet gevonden';
  end if;

  v_number := coalesce(v_settings.invoice_prefix, '') || lpad(v_settings.next_invoice_number::text, 4, '0');

  update company_settings
  set next_invoice_number = next_invoice_number + 1,
      updated_at = now()
  where id = v_settings.id;

  update invoices
  set invoice_number = v_number,
      sequence_number = v_settings.next_invoice_number,
      status = 'verstuurd',
      sent_at = now(),
      due_date = v_invoice.invoice_date + v_settings.payment_term_days,
      issuer_snapshot = jsonb_build_object(
        'business_name', v_settings.business_name,
        'address_line', v_settings.address_line,
        'postal_code', v_settings.postal_code,
        'city', v_settings.city,
        'country', v_settings.country,
        'kvk_number', v_settings.kvk_number,
        'vat_number', v_settings.vat_number,
        'iban', v_settings.iban,
        'email', v_settings.email,
        'phone', v_settings.phone,
        'logo_url', v_settings.logo_url
      ),
      customer_snapshot = jsonb_build_object(
        'name', v_customer.name,
        'address_line', v_customer.address_line,
        'postal_code', v_customer.postal_code,
        'city', v_customer.city,
        'country', v_customer.country,
        'email', v_customer.email,
        'phone', v_customer.phone
      ),
      updated_at = now()
  where id = p_invoice_id
  returning * into v_invoice;

  return v_invoice;
end;
$$;

revoke execute on function finalize_invoice(uuid) from public;
revoke execute on function finalize_invoice(uuid) from anon;
grant execute on function finalize_invoice(uuid) to authenticated;
