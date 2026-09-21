import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { syncOverdueInvoices } from "@/lib/actions/invoices";
import { formatCurrency, formatDate, STATUS_LABELS, STATUS_STYLES } from "@/lib/format";
import type { Customer, Invoice } from "@/lib/types";

const FILTERS = [
  { value: "", label: "Alles" },
  { value: "concept", label: "Concept" },
  { value: "verstuurd", label: "Verstuurd" },
  { value: "betaald", label: "Betaald" },
  { value: "te_laat", label: "Te laat" },
];

export default async function FacturenPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  await syncOverdueInvoices();
  const supabase = await createClient();

  let query = supabase
    .from("invoices")
    .select("*, customer:customers(*)")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data: invoices } = await query.returns<(Invoice & { customer: Customer | null })[]>();

  return (
    <>
      <PageHeader
        title="Facturen"
        action={
          <Link
            href="/facturen/nieuw"
            className="rounded-full bg-blue-600 px-3 py-1.5 text-sm font-medium text-white"
          >
            + Nieuw
          </Link>
        }
      />
      <div className="p-4">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={f.value ? `/facturen?status=${f.value}` : "/facturen"}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
                (status ?? "") === f.value
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {!invoices || invoices.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            Nog geen facturen{status ? " met deze status" : ""}.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <Link
                  href={`/facturen/${invoice.id}`}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 active:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{invoice.customer?.name ?? "Onbekende klant"}</p>
                    <p className="text-sm text-gray-500">
                      {invoice.invoice_number ?? "Concept"} · {formatDate(invoice.invoice_date)}
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
    </>
  );
}
