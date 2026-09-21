import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";
import type { Customer } from "@/lib/types";

export async function GET() {
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .order("name")
    .returns<Customer[]>();

  const rows = [
    ["Naam", "Adres", "Postcode", "Plaats", "E-mailadres", "Telefoonnummer", "Notitie"],
    ...(customers ?? []).map((c) => [
      c.name,
      c.address_line,
      c.postal_code,
      c.city,
      c.email,
      c.phone,
      c.notes,
    ]),
  ];

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="klanten.csv"',
    },
  });
}
