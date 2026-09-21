"use server";

import { createClient } from "@/lib/supabase/server";
import { computeInvoiceTotals, type CalcLine } from "@/lib/invoice-calc";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Unit } from "@/lib/types";

export type CustomerSelectionInput =
  | { type: "existing"; id: string }
  | { type: "new"; name: string };

export type InvoiceLineInput = {
  description: string;
  quantity: number;
  unit: Unit;
  unitPrice: number;
  vatRate: number;
};

export type InvoiceInput = {
  customer: CustomerSelectionInput;
  invoiceDate: string;
  deliveryDate: string | null;
  notes: string | null;
  lines: InvoiceLineInput[];
};

export type InvoiceActionResult = { id: string; error?: undefined } | { id?: undefined; error: string };

function validate(input: InvoiceInput): string | null {
  if (input.customer.type === "existing" && !input.customer.id) return "Kies een klant.";
  if (input.customer.type === "new" && !input.customer.name.trim()) return "Kies een klant.";
  if (input.lines.length === 0) return "Voeg minstens één regel toe.";
  for (const line of input.lines) {
    if (!line.description.trim()) return "Elke regel heeft een omschrijving nodig.";
    if (!Number.isFinite(line.quantity) || line.quantity <= 0) return "Ongeldig aantal op een regel.";
    if (!Number.isFinite(line.unitPrice) || line.unitPrice < 0) return "Ongeldige prijs op een regel.";
  }
  return null;
}

async function resolveCustomerId(
  supabase: SupabaseClient,
  customer: CustomerSelectionInput,
): Promise<{ id: string } | { error: string }> {
  if (customer.type === "existing") {
    return { id: customer.id };
  }
  const { data, error } = await supabase
    .from("customers")
    .insert({ name: customer.name.trim() })
    .select("id")
    .single();
  if (error || !data) {
    return { error: `Klant aanmaken mislukt: ${error?.message ?? "onbekende fout"}` };
  }
  return { id: data.id };
}

export async function createInvoice(input: InvoiceInput): Promise<InvoiceActionResult> {
  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const supabase = await createClient();

  const customerResult = await resolveCustomerId(supabase, input.customer);
  if ("error" in customerResult) return { error: customerResult.error };

  const totals = computeInvoiceTotals(
    input.lines.map((l): CalcLine => ({ quantity: l.quantity, unitPrice: l.unitPrice, vatRate: l.vatRate })),
  );

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      customer_id: customerResult.id,
      invoice_date: input.invoiceDate,
      delivery_date: input.deliveryDate,
      notes: input.notes,
      subtotal: totals.subtotal,
      vat_breakdown: totals.vatBreakdown,
      vat_amount: totals.vatAmount,
      total: totals.total,
      status: "concept",
    })
    .select("id")
    .single();

  if (invoiceError || !invoice) {
    return { error: `Factuur aanmaken mislukt: ${invoiceError?.message ?? "onbekende fout"}` };
  }

  const { error: linesError } = await supabase.from("invoice_lines").insert(
    input.lines.map((line, index) => ({
      invoice_id: invoice.id,
      position: index,
      description: line.description.trim(),
      quantity: line.quantity,
      unit: line.unit,
      unit_price: line.unitPrice,
      vat_rate: line.vatRate,
    })),
  );

  if (linesError) {
    await supabase.from("invoices").delete().eq("id", invoice.id);
    return { error: `Factuurregels opslaan mislukt: ${linesError.message}` };
  }

  return { id: invoice.id };
}

export async function updateInvoiceDraft(
  invoiceId: string,
  input: InvoiceInput,
): Promise<InvoiceActionResult> {
  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("invoices")
    .select("status")
    .eq("id", invoiceId)
    .single();

  if (!existing) return { error: "Factuur niet gevonden." };
  if (existing.status !== "concept") {
    return { error: "Deze factuur is al verstuurd en kan niet meer bewerkt worden." };
  }

  const customerResult = await resolveCustomerId(supabase, input.customer);
  if ("error" in customerResult) return { error: customerResult.error };

  const totals = computeInvoiceTotals(
    input.lines.map((l): CalcLine => ({ quantity: l.quantity, unitPrice: l.unitPrice, vatRate: l.vatRate })),
  );

  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      customer_id: customerResult.id,
      invoice_date: input.invoiceDate,
      delivery_date: input.deliveryDate,
      notes: input.notes,
      subtotal: totals.subtotal,
      vat_breakdown: totals.vatBreakdown,
      vat_amount: totals.vatAmount,
      total: totals.total,
    })
    .eq("id", invoiceId);

  if (updateError) return { error: `Opslaan mislukt: ${updateError.message}` };

  await supabase.from("invoice_lines").delete().eq("invoice_id", invoiceId);
  const { error: linesError } = await supabase.from("invoice_lines").insert(
    input.lines.map((line, index) => ({
      invoice_id: invoiceId,
      position: index,
      description: line.description.trim(),
      quantity: line.quantity,
      unit: line.unit,
      unit_price: line.unitPrice,
      vat_rate: line.vatRate,
    })),
  );

  if (linesError) return { error: `Factuurregels opslaan mislukt: ${linesError.message}` };

  return { id: invoiceId };
}

export async function finalizeInvoice(invoiceId: string): Promise<InvoiceActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("finalize_invoice", {
    p_invoice_id: invoiceId,
  });

  if (error || !data) {
    return { error: `Finaliseren mislukt: ${error?.message ?? "onbekende fout"}` };
  }

  return { id: invoiceId };
}

export async function deleteConceptInvoice(invoiceId: string) {
  const supabase = await createClient();
  await supabase.from("invoices").delete().eq("id", invoiceId).eq("status", "concept");
}

export async function markInvoicePaid(invoiceId: string) {
  const supabase = await createClient();
  await supabase
    .from("invoices")
    .update({ status: "betaald", paid_at: new Date().toISOString() })
    .eq("id", invoiceId);
}

export async function markInvoiceOverdue(invoiceId: string) {
  const supabase = await createClient();
  await supabase.from("invoices").update({ status: "te_laat" }).eq("id", invoiceId).eq("status", "verstuurd");
}
