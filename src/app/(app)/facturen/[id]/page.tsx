import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { createClient } from "@/lib/supabase/server";
import { deleteConceptInvoice, markInvoicePaid } from "@/lib/actions/invoices";
import { formatCurrency, formatDate, STATUS_LABELS, STATUS_STYLES, UNIT_LABELS } from "@/lib/format";
import type { Customer, Invoice, InvoiceLine } from "@/lib/types";

export default async function FactuurDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: invoice }, { data: lines }] = await Promise.all([
    supabase.from("invoices").select("*, customer:customers(*)").eq("id", id).single<
      Invoice & { customer: Customer | null }
    >(),
    supabase
      .from("invoice_lines")
      .select("*")
      .eq("invoice_id", id)
      .order("position")
      .returns<InvoiceLine[]>(),
  ]);

  if (!invoice) notFound();

  const deleteAction = deleteConceptInvoice.bind(null, id);
  const markPaidAction = async () => {
    "use server";
    await markInvoicePaid(id);
    redirect(`/facturen/${id}`);
  };

  return (
    <>
      <PageHeader title={invoice.invoice_number ?? "Concept"} backHref="/facturen" />
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLES[invoice.status]}`}>
            {STATUS_LABELS[invoice.status]}
          </span>
          <span className="text-sm text-gray-500">{formatDate(invoice.invoice_date)}</span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Klant</p>
          <p className="font-medium">{invoice.customer_snapshot?.name ?? invoice.customer?.name}</p>
          {invoice.customer?.id && (
            <Link href={`/klanten/${invoice.customer.id}`} className="text-sm text-blue-600">
              Bekijk klant
            </Link>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="mb-2 text-sm font-semibold text-gray-700">Regels</p>
          <ul className="flex flex-col gap-2">
            {(lines ?? []).map((line) => (
              <li key={line.id} className="flex justify-between text-sm">
                <span>
                  {line.description}
                  <span className="text-gray-400">
                    {" "}
                    ({line.quantity} {UNIT_LABELS[line.unit]} × {formatCurrency(line.unit_price)})
                  </span>
                </span>
                <span className="shrink-0 font-medium">{formatCurrency(line.line_total)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-gray-100 pt-3 text-sm">
            <div className="flex justify-between py-0.5">
              <span className="text-gray-500">Subtotaal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.vat_breakdown.map((entry) => (
              <div key={entry.rate} className="flex justify-between py-0.5">
                <span className="text-gray-500">Btw {entry.rate}%</span>
                <span>{formatCurrency(entry.vat)}</span>
              </div>
            ))}
            <div className="mt-1 flex justify-between text-base font-semibold">
              <span>Totaal</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Notitie</p>
            <p className="text-sm">{invoice.notes}</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <a
            href={`/api/invoices/${id}/pdf`}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-base font-semibold text-gray-700"
          >
            PDF downloaden
          </a>

          {invoice.status === "concept" && (
            <>
              <Link
                href={`/facturen/${id}/bewerken`}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-base font-semibold text-white"
              >
                Bewerken
              </Link>
              <form action={deleteAction}>
                <ConfirmSubmitButton
                  confirmMessage="Concept verwijderen?"
                  className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center font-medium text-red-700"
                >
                  Concept verwijderen
                </ConfirmSubmitButton>
              </form>
            </>
          )}

          {(invoice.status === "verstuurd" || invoice.status === "te_laat") && (
            <form action={markPaidAction}>
              <button
                type="submit"
                className="w-full rounded-xl bg-green-600 px-4 py-3 text-center text-base font-semibold text-white"
              >
                Markeer als betaald
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
