import { PageHeader } from "@/components/page-header";

const links = [
  {
    href: "/api/export/klanten.csv",
    label: "Klanten (CSV)",
    desc: "Alle klantgegevens.",
  },
  {
    href: "/api/export/facturen.csv",
    label: "Facturen (CSV)",
    desc: "Alle facturen met status, datums en bedragen.",
  },
  {
    href: "/api/export/facturen-regels.csv",
    label: "Factuurregels (CSV)",
    desc: "Elke regel van elke factuur, voor volledige reconstructie.",
  },
  {
    href: "/api/export/pdfs.zip",
    label: "Alle factuur-PDF's (zip)",
    desc: "Een zip met de PDF van elke verstuurde factuur.",
  },
];

export default function ExportPage() {
  return (
    <>
      <PageHeader title="Data exporteren" backHref="/meer" />
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm text-gray-500">
          Al je klant- en factuurdata is van jou. Download het hieronder, bijvoorbeeld om over
          te stappen naar een andere applicatie.
        </p>
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 active:bg-gray-50"
          >
            <p className="font-medium">{link.label}</p>
            <p className="text-sm text-gray-500">{link.desc}</p>
          </a>
        ))}
      </div>
    </>
  );
}
