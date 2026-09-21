import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { CustomerForm } from "@/components/customer-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { createClient } from "@/lib/supabase/server";
import { updateCustomer, deleteCustomer } from "@/lib/actions/customers";
import { formatCurrency, formatDate, STATUS_LABELS, STATUS_STYLES } from "@/lib/format";
import type { Customer, Invoice } from "@/lib/types";

export default async function KlantDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ deleteError?: string }>;
}) {
  const { id } = await params;
  const { deleteError } = await searchParams;
  const supabase = await createClient();

  const [{ data: customer }, { data: invoices }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).single<Customer>(),
    supabase
      .from("invoices")
      .select("*")
      .eq("customer_id", id)
      .order("created_at", { ascending: false })
      .returns<Invoice[]>(),
  ]);

  if (!customer) notFound();

  const updateAction = updateCustomer.bind(null, id);
  const deleteAction = deleteCustomer.bind(null, id);

  return (
    <>
      <PageHeader title={customer.name} backHref="/klanten" />

      {deleteError && (
        <p className="mx-4 mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          Deze klant heeft nog facturen en kan niet verwijderd worden.
        </p>
      )}

      <CustomerForm customer={customer} action={updateAction} submitLabel="Opslaan" />

      <div className="px-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Facturen</h2>
        {!invoices || invoices.length === 0 ? (
          <p className="pb-4 text-sm text-gray-400">Nog geen facturen voor deze klant.</p>
        ) : (
          <ul className="flex flex-col gap-2 pb-4">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <Link
                  href={`/facturen/${invoice.id}`}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 active:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">
                      {invoice.invoice_number ?? "Concept"}
                    </p>
                    <p className="text-sm text-gray-500">{formatDate(invoice.invoice_date)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-medium">{formatCurrency(invoice.total)}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[invoice.status]}`}
                    >
                      {STATUS_LABELS[invoice.status]}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="px-4 pb-8">
        <form action={deleteAction}>
          <ConfirmSubmitButton
            confirmMessage={`${customer.name} verwijderen? Dit kan niet ongedaan gemaakt worden.`}
            className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center font-medium text-red-700"
          >
            Klant verwijderen
          </ConfirmSubmitButton>
        </form>
      </div>
    </>
  );
}
