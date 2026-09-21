import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";
import { STATUS_LABELS } from "@/lib/format";
import type { Customer, Invoice } from "@/lib/types";

export async function GET() {
  const supabase = await createClient();
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, customer:customers(*)")
    .order("created_at")
    .returns<(Invoice & { customer: Customer | null })[]>();

  const rows = [
    [
      "Factuurnummer",
      "Status",
      "Klant",
      "Factuurdatum",
      "Leverdatum",
      "Vervaldatum",
      "Subtotaal (excl. btw)",
      "Btw-bedrag",
      "Totaal (incl. btw)",
      "Verstuurd op",
      "Betaald op",
    ],
    ...(invoices ?? []).map((i) => [
      i.invoice_number ?? "(concept)",
      STATUS_LABELS[i.status] ?? i.status,
      i.customer_snapshot?.name ?? i.customer?.name ?? "",
      i.invoice_date,
      i.delivery_date ?? "",
      i.due_date ?? "",
      i.subtotal,
      i.vat_amount,
      i.total,
      i.sent_at ? i.sent_at.slice(0, 10) : "",
      i.paid_at ? i.paid_at.slice(0, 10) : "",
    ]),
  ];

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="facturen.csv"',
    },
  });
}
