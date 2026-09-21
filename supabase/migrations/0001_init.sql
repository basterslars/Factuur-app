-- Factuur-app: initieel schema
-- Single-tenant: 1 bedrijf, ingelogde gebruiker(s) zien allemaal dezelfde data.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- company_settings: singleton-rij met bedrijfsgegevens van de ondernemer.
-- ---------------------------------------------------------------------------
create table if not exists company_settings (
  id uuid primary key default '00000000-0000-0000-0000-000000000001',
  business_name text not null default '',
  address_line text not null default '',
  postal_code text not null default '',
  city text not null default '',
  country text not null default 'Nederland',
  kvk_number text not null default '',
  vat_number text not null default '',
  iban text not null default '',
  email text not null default '',
  phone text not null default '',
  logo_url text,
  invoice_prefix text not null default to_char(now(), 'YYYY') || '-',
  next_invoice_number integer not null default 1,
  default_vat_rate numeric(4,2) not null default 21,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_settings_singleton check (id = '00000000-0000-0000-0000-000000000001')
);

insert into company_settings (id)
values ('00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address_line text not null default '',
  postal_code text not null default '',
  city text not null default '',
  country text not null default 'Nederland',
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_name_idx on customers using gin (to_tsvector('simple', name));

-- ---------------------------------------------------------------------------
-- line_templates: opgeslagen terugkerende werkzaamheden
-- ---------------------------------------------------------------------------
create table if not exists line_templates (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  unit text not null default 'stuk' check (unit in ('uur', 'stuk', 'm2')),
  unit_price numeric(10,2) not null default 0,
  vat_rate numeric(4,2) not null default 21,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- invoices
-- Nummering: invoice_number/sequence_number blijven NULL zolang status =
-- 'concept'. Pas bij finaliseren (zie finalize_invoice()) wordt atomisch een
-- opeenvolgend nummer toegekend, zodat verlaten concepten geen gat in de
-- reeks veroorzaken. issuer_snapshot/customer_snapshot bevriezen de
-- wettelijk verplichte gegevens zoals ze waren op het moment van uitgifte.
-- ---------------------------------------------------------------------------
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique,
  sequence_number integer unique,
  customer_id uuid not null references customers(id) on delete restrict,
  invoice_date date not null default current_date,
  delivery_date date,
  status text not null default 'concept' check (status in ('concept', 'verstuurd', 'betaald', 'te_laat')),
  subtotal numeric(10,2) not null default 0,
  vat_breakdown jsonb not null default '[]'::jsonb,
  vat_amount numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  notes text,
  issuer_snapshot jsonb,
  customer_snapshot jsonb,
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_status_idx on invoices (status);
create index if not exists invoices_customer_idx on invoices (customer_id);

-- ---------------------------------------------------------------------------
-- invoice_lines
-- ---------------------------------------------------------------------------
create table if not exists invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  position integer not null default 0,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit text not null default 'stuk' check (unit in ('uur', 'stuk', 'm2')),
  unit_price numeric(10,2) not null default 0,
  vat_rate numeric(4,2) not null default 21,
  line_total numeric(10,2) generated always as (round(quantity * unit_price, 2)) stored,
  created_at timestamptz not null default now()
);

create index if not exists invoice_lines_invoice_idx on invoice_lines (invoice_id);

-- ---------------------------------------------------------------------------
-- finalize_invoice(): kent atomisch het volgende factuurnummer toe, bevriest
-- bedrijfs- en klantgegevens in een snapshot, en zet de status op
-- 'verstuurd'. Idempotent: een al-gefinaliseerde factuur wordt ongewijzigd
-- teruggegeven zodat een dubbele aanroep (bv. download na verzenden) geen
-- nummer overslaat.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- touch updated_at helper
-- ---------------------------------------------------------------------------
create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_company_settings_touch on company_settings;
create trigger trg_company_settings_touch before update on company_settings
  for each row execute function touch_updated_at();

drop trigger if exists trg_customers_touch on customers;
create trigger trg_customers_touch before update on customers
  for each row execute function touch_updated_at();

drop trigger if exists trg_invoices_touch on invoices;
create trigger trg_invoices_touch before update on invoices
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: alleen ingelogde gebruikers (single-tenant, dus geen
-- filtering op user id nodig -- iedere ingelogde gebruiker is de ondernemer
-- zelf of een medewerker van diens administratie).
-- ---------------------------------------------------------------------------
alter table company_settings enable row level security;
alter table customers enable row level security;
alter table line_templates enable row level security;
alter table invoices enable row level security;
alter table invoice_lines enable row level security;

create policy "authenticated full access" on company_settings
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on customers
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on line_templates
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on invoices
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on invoice_lines
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Storage: bucket voor logo-upload (publiek leesbaar, alleen ingelogd schrijven)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "logos publicly readable"
  on storage.objects for select
  using (bucket_id = 'logos');

create policy "authenticated users manage logos"
  on storage.objects for all to authenticated
  using (bucket_id = 'logos')
  with check (bucket_id = 'logos');
