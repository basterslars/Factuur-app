import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import type { Customer } from "@/lib/types";

export default async function KlantenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("customers").select("*").order("name");
  if (q) {
    query = query.ilike("name", `%${q}%`);
  }
  const { data: customers } = await query.returns<Customer[]>();

  return (
    <>
      <PageHeader
        title="Klanten"
        action={
          <Link
            href="/klanten/nieuw"
            className="rounded-full bg-blue-600 px-3 py-1.5 text-sm font-medium text-white"
          >
            + Nieuw
          </Link>
        }
      />
      <div className="p-4">
        <form className="mb-4">
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Zoek klant..."
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base"
          />
        </form>

        {!customers || customers.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            {q ? "Geen klanten gevonden." : "Nog geen klanten. Voeg je eerste klant toe."}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {customers.map((customer) => (
              <li key={customer.id}>
                <Link
                  href={`/klanten/${customer.id}`}
                  className="block rounded-xl border border-gray-200 bg-white px-4 py-3 active:bg-gray-50"
                >
                  <p className="font-medium">{customer.name}</p>
                  {(customer.city || customer.email) && (
                    <p className="text-sm text-gray-500">
                      {[customer.city, customer.email].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
