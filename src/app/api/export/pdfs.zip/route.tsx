import { NextResponse } from "next/server";
import JSZip from "jszip";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { InvoicePdfDocument } from "@/lib/pdf/invoice-document";
import type { Invoice, InvoiceLine } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();

  const [{ data: invoices }, { data: allLines }] = await Promise.all([
    supabase
      .from("invoices")
      .select("*")
      .neq("status", "concept")
      .order("invoice_number")
      .returns<Invoice[]>(),
    supabase.from("invoice_lines").select("*").order("position").returns<InvoiceLine[]>(),
  ]);

  const zip = new JSZip();

  for (const invoice of invoices ?? []) {
    const lines = (allLines ?? []).filter((l) => l.invoice_id === invoice.id);
    const pdfBuffer = await renderToBuffer(
      <InvoicePdfDocument invoice={invoice} lines={lines} />,
    );
    zip.file(`factuur-${invoice.invoice_number}.pdf`, pdfBuffer);
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="facturen-pdfs.zip"',
    },
  });
}
