import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { InvoiceForm } from "@/components/invoice-form";
import { createClient } from "@/lib/supabase/server";
import type { Customer, Invoice, InvoiceLine, LineTemplate } from "@/lib/types";

export default async function FactuurBewerkenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: invoice }, { data: lines }, { data: customers }, { data: templates }] =
    await Promise.all([
      supabase.from("invoices").select("*, customer:customers(*)").eq("id", id).single<
        Invoice & { customer: Customer | null }
      >(),
      supabase
        .from("invoice_lines")
        .select("*")
        .eq("invoice_id", id)
        .order("position")
        .returns<InvoiceLine[]>(),
      supabase.from("customers").select("*").order("name").returns<Customer[]>(),
      supabase
        .from("line_templates")
        .select("*")
        .order("created_at", { ascending: false })
        .returns<LineTemplate[]>(),
    ]);

  if (!invoice) notFound();
  if (invoice.status !== "concept") redirect(`/facturen/${id}`);

  const initial = {
    customer: invoice.customer
      ? { type: "existing" as const, id: invoice.customer.id, name: invoice.customer.name }
      : null,
    invoiceDate: invoice.invoice_date,
    deliveryDate: invoice.delivery_date,
    notes: invoice.notes ?? "",
    lines: (lines ?? []).map((line) => ({
      localId: line.id,
      description: line.description,
      quantity: String(line.quantity),
      unit: line.unit,
      unitPrice: String(line.unit_price),
      vatRate: line.vat_rate,
    })),
  };

  return (
    <>
      <PageHeader title="Factuur bewerken" backHref={`/facturen/${id}`} />
      <InvoiceForm
        customers={customers ?? []}
        templates={templates ?? []}
        draftKey={`factuur-edit-draft-${id}`}
        mode="edit"
        invoiceId={id}
        initial={initial}
      />
    </>
  );
}
