import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { syncOverdueInvoices } from "@/lib/actions/invoices";
import { formatCurrency, formatDate, STATUS_LABELS, STATUS_STYLES } from "@/lib/format";
import type { Customer, Invoice } from "@/lib/types";

function startOfMonthISO(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  await syncOverdueInvoices();

  const supabase = await createClient();
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, customer:customers(*)")
    .neq("status", "concept")
    .order("due_date", { ascending: true })
    .returns<(Invoice & { customer: Customer | null })[]>();

  const all = invoices ?? [];
  const openstaand = all
    .filter((i) => i.status === "verstuurd" || i.status === "te_laat")
    .reduce((sum, i) => sum + i.total, 0);

  const monthStart = startOfMonthISO();
  const dezeMaand = all
    .filter((i) => i.invoice_date >= monthStart)
    .reduce((sum, i) => sum + i.total, 0);

  const teLaatCount = all.filter((i) => i.status === "te_laat").length;
  const openstaandeFacturen = all.filter(
    (i) => i.status === "verstuurd" || i.status === "te_laat",
  );

  return (
    <>
      <PageHeader title="Overzicht" />
      <div className="flex flex-col gap-4 p-4">
        <Link
          href="/facturen/nieuw"
          className="block w-full rounded-xl bg-blue-600 px-4 py-4 text-center text-lg font-semibold text-white active:bg-blue-700"
        >
          + Nieuwe factuur
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Openstaand</p>
            <p className="text-xl font-semibold">{formatCurrency(openstaand)}</p>
            {teLaatCount > 0 && (
              <p className="mt-1 text-xs text-red-600">{teLaatCount} te laat</p>
            )}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Deze maand gefactureerd</p>
            <p className="text-xl font-semibold">{formatCurrency(dezeMaand)}</p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Openstaande facturen</h2>
            <Link href="/facturen" className="text-sm text-blue-600">
              Alle facturen
            </Link>
          </div>
          {openstaandeFacturen.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              Geen openstaande facturen. 🎉
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {openstaandeFacturen.map((invoice) => (
                <li key={invoice.id}>
                  <Link
                    href={`/facturen/${invoice.id}`}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 active:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">{invoice.customer?.name ?? "Onbekende klant"}</p>
                      <p className="text-sm text-gray-500">
                        {invoice.invoice_number} · vervalt {invoice.due_date ? formatDate(invoice.due_date) : "-"}
                      </p>
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
      </div>
    </>
  );
}
