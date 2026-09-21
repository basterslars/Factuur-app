import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";
import { UNIT_LABELS } from "@/lib/format";
import type { Invoice, InvoiceLine } from "@/lib/types";

export async function GET() {
  const supabase = await createClient();
  const { data: lines } = await supabase
    .from("invoice_lines")
    .select("*, invoice:invoices(invoice_number)")
    .order("invoice_id")
    .order("position")
    .returns<(InvoiceLine & { invoice: Pick<Invoice, "invoice_number"> | null })[]>();

  const rows = [
    ["Factuurnummer", "Omschrijving", "Aantal", "Eenheid", "Prijs per eenheid", "Btw%", "Regeltotaal"],
    ...(lines ?? []).map((l) => [
      l.invoice?.invoice_number ?? "(concept)",
      l.description,
      l.quantity,
      UNIT_LABELS[l.unit] ?? l.unit,
      l.unit_price,
      l.vat_rate,
      l.line_total,
    ]),
  ];

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="facturen-regels.csv"',
    },
  });
}
