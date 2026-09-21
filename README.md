# Factuur-app

Snel een wettelijk geldige factuur opstellen en versturen vanaf je telefoon,
op locatie. Gebouwd voor zzp'ers en kleine bedrijven in de schilder-/
stukadoorsbranche: één bedrijf per installatie (single-tenant), mobiel-eerst,
zo min mogelijk stappen tussen "klaar met de klus" en "factuur verstuurd".

## Kernfunctionaliteit

- **Snelle factuur-flow**: klant kiezen via autocomplete (of meteen een
  nieuwe naam intypen), regels toevoegen via opgeslagen sjablonen of
  handmatig, live btw-berekening, opslaan als concept of direct versturen.
- **Wettelijk geldige facturen**: opeenvolgend factuurnummer zonder gaten
  (automatisch beheerd, niet handmatig aanpasbaar), volledige bedrijfs- en
  klantgegevens, KVK/btw-nummer, factuur- en leverdatum, btw-bedrag én
  -percentage apart vermeld, totaal excl./incl. btw.
- **PDF + e-mail**: professionele PDF (met logo), direct versturen per
  e-mail (Resend) of downloaden als alternatief.
- **Overzicht**: dashboard met openstaand bedrag en omzet deze maand,
  facturenlijst met status (concept/verstuurd/betaald/te laat).
- **Klantenbeheer**: CRUD + factuurgeschiedenis per klant.
- **Offline-tolerant**: elke wijziging aan een concept wordt gedebounced
  naar `localStorage` geschreven. Valt het internet weg tijdens het
  opslaan, dan blijft het concept lokaal bewaard totdat het alsnog lukt.
- **Data-eigendom**: klanten, facturen en factuurregels zijn te exporteren
  als CSV, plus een zip met alle factuur-PDF's (`/export`).

## Techniek

- **Next.js 16** (App Router, TypeScript, Tailwind CSS)
- **Supabase**: Postgres-database, Auth en Storage (logo-upload)
- **@react-pdf/renderer** voor serverside PDF-generatie
- **Resend** voor het versturen van facturen per e-mail

### Architectuurkeuzes die de moeite waard zijn om te kennen

- **Factuurnummering**: een concept krijgt pas een nummer op het moment dat
  hij daadwerkelijk wordt uitgereikt (verstuurd per e-mail óf gedownload).
  Dat gebeurt atomisch in de Postgres-functie `finalize_invoice()`, zodat
  een verlaten concept nooit een gat in de reeks veroorzaakt. Diezelfde
  functie bevriest de bedrijfs- en klantgegevens op dat moment in een
  snapshot (`issuer_snapshot`/`customer_snapshot`), zodat een latere
  adreswijziging een al verstuurde factuur niet met terugwerkende kracht
  verandert.
- **Single-tenant, wel met login**: er is maar plek voor één bedrijf
  (`company_settings` is een singleton-rij), maar de app zit toch achter
  een account (`/setup` eenmalig, daarna `/login`) omdat er anders
  bedrijfs- en klantgegevens voor iedereen met de URL zichtbaar zouden zijn.
- **"Te laat"** wordt niet door een achtergrondtaak bijgehouden, maar lui
  bijgewerkt (verstuurd + vervaldatum verstreken) telkens als het dashboard
  of het facturenoverzicht geladen wordt.

## Lokaal draaien

```bash
npm install
cp .env.example .env.local   # vul in, zie hieronder
npm run dev
```

### Environment-variabelen

| Variabele | Waar te vinden |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase-project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase-project → Settings → API (publishable/anon key) |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |
| `RESEND_FROM_EMAIL` | Een adres op een bij Resend geverifieerd domein |

Zonder `RESEND_API_KEY`/`RESEND_FROM_EMAIL` werkt alles behalve het
daadwerkelijk versturen van e-mail: de factuur wordt dan gewoon
gefinaliseerd (krijgt een nummer) en je krijgt een duidelijke melding dat je
de PDF handmatig moet versturen.

### Database-schema

De migraties staan in `supabase/migrations/` en zijn al toegepast op het
gekoppelde Supabase-project. Voor een nieuw project: draai ze in volgorde
via de Supabase SQL-editor, of met de Supabase CLI:

```bash
supabase link --project-ref <jouw-project-ref>
supabase db push
```

### Eerste account aanmaken

Ga naar `/setup` — dit werkt precies één keer (daarna sluit de pagina
zichzelf af, want de app is single-tenant). Supabase stuurt een
bevestigingsmail; klik daarna in en log in op `/login`.

## Deployen (Vercel)

1. Importeer de repo in Vercel.
2. Zet dezelfde environment-variabelen als hierboven.
3. Deploy. Er is geen build-configuratie nodig buiten wat hier al staat.

## Bekend en bewust (nog) niet gebouwd

- Alleen 21% btw in de UI (het datamodel ondersteunt per regel een ander
  percentage, mocht btw-verlegd/9%/KOR later nodig zijn).
- Geen koppeling met boekhoudsoftware (Moneybird, e-Boekhouden) — de
  CSV/PDF-export is de ontsnappingsroute daarvoor.
- Geen automatische betalingsherinneringen.
- Single-tenant: één bedrijf per installatie, geen multi-user rollen.
