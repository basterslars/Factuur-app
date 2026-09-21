"use client";

import { useState } from "react";
import type { Customer } from "@/lib/types";
import type { CustomerSelectionInput } from "@/lib/actions/invoices";

export type CustomerSelection = CustomerSelectionInput & { name: string };

export function CustomerPicker({
  customers,
  selection,
  onSelect,
}: {
  customers: Customer[];
  selection: CustomerSelection | null;
  onSelect: (selection: CustomerSelection | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = (
    query.trim()
      ? customers.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()))
      : customers
  ).slice(0, 8);

  const exactMatch = customers.some(
    (c) => c.name.toLowerCase() === query.trim().toLowerCase(),
  );

  if (selection) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-gray-300 bg-white px-4 py-3">
        <div>
          <p className="font-medium">{selection.name}</p>
          {selection.type === "new" && <p className="text-xs text-blue-600">Nieuwe klant</p>}
        </div>
        <button
          type="button"
          onClick={() => {
            onSelect(null);
            setQuery("");
          }}
          className="text-sm font-medium text-blue-600"
        >
          Wijzig
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Klant zoeken of toevoegen..."
        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base"
      />
      {open && (
        <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect({ type: "existing", id: c.id, name: c.name });
                setOpen(false);
              }}
              className="block w-full px-4 py-3 text-left active:bg-gray-50"
            >
              {c.name}
              {c.city && <span className="text-sm text-gray-400"> · {c.city}</span>}
            </button>
          ))}
          {query.trim() && !exactMatch && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect({ type: "new", name: query.trim() });
                setOpen(false);
              }}
              className="block w-full border-t border-gray-100 px-4 py-3 text-left font-medium text-blue-600 active:bg-blue-50"
            >
              + Nieuwe klant &ldquo;{query.trim()}&rdquo;
            </button>
          )}
          {filtered.length === 0 && !query.trim() && (
            <p className="px-4 py-3 text-sm text-gray-400">Typ om te zoeken of toe te voegen</p>
          )}
        </div>
      )}
    </div>
  );
}
