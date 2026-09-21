import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { finalizeInvoice } from "@/lib/actions/invoices";
import { InvoicePdfDocument } from "@/lib/pdf/invoice-document";
import type { Invoice, InvoiceLine } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: invoiceBefore } = await supabase
    .from("invoices")
    .select("status")
    .eq("id", id)
    .single();

  if (!invoiceBefore) {
    return NextResponse.json({ error: "Factuur niet gevonden" }, { status: 404 });
  }

  // Downloaden is een manier om een factuur uit te reiken (naast e-mail), dus
  // net als bij versturen wordt hier -- indien nog niet gebeurd -- het
  // definitieve, opeenvolgende factuurnummer toegekend.
  if (invoiceBefore.status === "concept") {
    const result = await finalizeInvoice(id);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  }

  const [{ data: invoice }, { data: lines }] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", id).single<Invoice>(),
    supabase
      .from("invoice_lines")
      .select("*")
      .eq("invoice_id", id)
      .order("position")
      .returns<InvoiceLine[]>(),
  ]);

  if (!invoice || !invoice.issuer_snapshot || !invoice.customer_snapshot) {
    return NextResponse.json({ error: "Factuur kon niet worden opgehaald" }, { status: 500 });
  }

  const pdfBuffer = await renderToBuffer(
    <InvoicePdfDocument invoice={invoice} lines={lines ?? []} />,
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="factuur-${invoice.invoice_number}.pdf"`,
    },
  });
}
