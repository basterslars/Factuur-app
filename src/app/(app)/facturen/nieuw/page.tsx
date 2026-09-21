import { PageHeader } from "@/components/page-header";
import { InvoiceForm } from "@/components/invoice-form";
import { createClient } from "@/lib/supabase/server";
import type { Customer, LineTemplate } from "@/lib/types";

export default async function NieuweFactuurPage() {
  const supabase = await createClient();
  const [{ data: customers }, { data: templates }] = await Promise.all([
    supabase.from("customers").select("*").order("name").returns<Customer[]>(),
    supabase
      .from("line_templates")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<LineTemplate[]>(),
  ]);

  return (
    <>
      <PageHeader title="Nieuwe factuur" backHref="/facturen" />
      <InvoiceForm
        customers={customers ?? []}
        templates={templates ?? []}
        draftKey="factuur-nieuw-draft"
        mode="create"
      />
    </>
  );
}
