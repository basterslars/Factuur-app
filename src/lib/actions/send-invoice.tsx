"use server";

import { Resend } from "resend";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { finalizeInvoice } from "@/lib/actions/invoices";
import { InvoicePdfDocument } from "@/lib/pdf/invoice-document";
import { formatCurrency } from "@/lib/format";
import type { Invoice, InvoiceLine } from "@/lib/types";

export type SendInvoiceResult = { success: true } | { success: false; error: string };

export async function sendInvoiceEmail(invoiceId: string): Promise<SendInvoiceResult> {
  const supabase = await createClient();

  const { data: before } = await supabase
    .from("invoices")
    .select("status")
    .eq("id", invoiceId)
    .single();

  if (!before) return { success: false, error: "Factuur niet gevonden." };

  if (before.status === "concept") {
    const result = await finalizeInvoice(invoiceId);
    if (result.error) return { success: false, error: result.error };
  }

  const [{ data: invoice }, { data: lines }] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", invoiceId).single<Invoice>(),
    supabase
      .from("invoice_lines")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("position")
      .returns<InvoiceLine[]>(),
  ]);

  if (!invoice || !invoice.issuer_snapshot || !invoice.customer_snapshot) {
    return { success: false, error: "Factuurgegevens konden niet worden opgehaald." };
  }

  const customerEmail = invoice.customer_snapshot.email;
  if (!customerEmail) {
    return {
      success: false,
      error:
        "Deze klant heeft geen e-mailadres. Vul dit aan bij de klant, of download de pdf en verstuur hem zelf.",
    };
  }

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return {
      success: false,
      error: `E-mail versturen is nog niet ingesteld (RESEND_API_KEY/RESEND_FROM_EMAIL ontbreken). Factuur ${invoice.invoice_number} is al aangemaakt -- download de pdf en verstuur hem zelf.`,
    };
  }

  const pdfBuffer = await renderToBuffer(
    <InvoicePdfDocument invoice={invoice} lines={lines ?? []} />,
  );

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: customerEmail,
    subject: `Factuur ${invoice.invoice_number} van ${invoice.issuer_snapshot.business_name}`,
    html: `<p>Beste ${invoice.customer_snapshot.name},</p><p>Hierbij factuur ${invoice.invoice_number} voor een totaalbedrag van ${formatCurrency(invoice.total)}.</p><p>Met vriendelijke groet,<br/>${invoice.issuer_snapshot.business_name}</p>`,
    attachments: [
      { filename: `factuur-${invoice.invoice_number}.pdf`, content: pdfBuffer },
    ],
  });

  if (error) {
    return {
      success: false,
      error: `Versturen mislukt: ${error.message}. Factuur ${invoice.invoice_number} is al aangemaakt -- download de pdf en verstuur hem handmatig.`,
    };
  }

  return { success: true };
}
