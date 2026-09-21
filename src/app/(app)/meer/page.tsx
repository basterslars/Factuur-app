import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { logout } from "@/lib/actions/auth";

const links = [
  { href: "/sjablonen", label: "Sjablonen", desc: "Terugkerende werkzaamheden" },
  { href: "/instellingen", label: "Bedrijfsinstellingen", desc: "Naam, adres, KVK, btw, logo" },
  { href: "/export", label: "Data exporteren", desc: "CSV en PDF-bundel van al je data" },
];

export default function MeerPage() {
  return (
    <>
      <PageHeader title="Meer" />
      <div className="flex flex-col gap-3 p-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 active:bg-gray-50"
          >
            <p className="font-medium">{link.label}</p>
            <p className="text-sm text-gray-500">{link.desc}</p>
          </Link>
        ))}
        <form action={logout} className="pt-2">
          <button
            type="submit"
            className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center font-medium text-red-700"
          >
            Uitloggen
          </button>
        </form>
      </div>
    </>
  );
}
