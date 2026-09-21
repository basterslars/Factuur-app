"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createInvoice, updateInvoiceDraft, type InvoiceInput } from "@/lib/actions/invoices";
import { computeInvoiceTotals } from "@/lib/invoice-calc";
import { formatCurrency, UNIT_LABELS } from "@/lib/format";
import { CustomerPicker, type CustomerSelection } from "@/components/customer-picker";
import type { Customer, LineTemplate, Unit } from "@/lib/types";

type LineItem = {
  localId: string;
  description: string;
  quantity: string;
  unit: Unit;
  unitPrice: string;
  vatRate: number;
};

type DraftState = {
  customer: CustomerSelection | null;
  invoiceDate: string;
  deliveryDate: string | null;
  notes: string;
  lines: LineItem[];
};

function newLine(overrides: Partial<LineItem> = {}): LineItem {
  return {
    localId: crypto.randomUUID(),
    description: "",
    quantity: "1",
    unit: "uur",
    unitPrice: "",
    vatRate: 21,
    ...overrides,
  };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyDraft(): DraftState {
  return {
    customer: null,
    invoiceDate: todayISO(),
    deliveryDate: null,
    notes: "",
    lines: [newLine()],
  };
}

export function InvoiceForm({
  customers,
  templates,
  draftKey,
  mode,
  invoiceId,
  initial,
}: {
  customers: Customer[];
  templates: LineTemplate[];
  draftKey: string;
  mode: "create" | "edit";
  invoiceId?: string;
  initial?: DraftState;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftState>(() => initial ?? emptyDraft());
  const [restoredNotice, setRestoredNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineNotice, setOfflineNotice] = useState(false);
  const [saving, setSaving] = useState<"concept" | "send" | null>(null);
  const hydrated = useRef(false);

  // Bij openen: probeer een lokaal opgeslagen concept te herstellen (bv. na
  // een crash of internetuitval) zodat er nooit werk verloren gaat. Dit moet
  // na mount (niet in een lazy useState-initializer) omdat localStorage op
  // de server niet bestaat -- anders zou de server-render niet overeenkomen
  // met de client-render en een hydration-mismatch geven.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw) as DraftState;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- synct bewust eenmalig vanuit localStorage na mount, geen afgeleide state
        setDraft(parsed);
        setRestoredNotice(true);
      }
    } catch {
      // corrupte of onbeschikbare localStorage: negeren, gewoon leeg starten
    } finally {
      hydrated.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Elke wijziging lokaal bewaren zodat een concept nooit verloren gaat als
  // het internet wegvalt voordat er is opgeslagen.
  useEffect(() => {
    if (!hydrated.current) return;
    const hasContent = draft.customer || draft.lines.some((l) => l.description.trim());
    try {
      if (hasContent) {
        window.localStorage.setItem(draftKey, JSON.stringify(draft));
      } else {
        window.localStorage.removeItem(draftKey);
      }
    } catch {
      // localStorage niet beschikbaar (bv. privénavigatie): geen probleem,
      // dan werkt de app gewoon zonder lokaal vangnet.
    }
  }, [draft, draftKey]);

  const totals = useMemo(
    () =>
      computeInvoiceTotals(
        draft.lines.map((l) => ({
          quantity: Number(l.quantity) || 0,
          unitPrice: Number(l.unitPrice) || 0,
          vatRate: l.vatRate,
        })),
      ),
    [draft.lines],
  );

  function updateLine(localId: string, patch: Partial<LineItem>) {
    setDraft((d) => ({
      ...d,
      lines: d.lines.map((l) => (l.localId === localId ? { ...l, ...patch } : l)),
    }));
  }

  function removeLine(localId: string) {
    setDraft((d) => ({ ...d, lines: d.lines.filter((l) => l.localId !== localId) }));
  }

  function addTemplateLine(template: LineTemplate) {
    setDraft((d) => ({
      ...d,
      lines: [
        ...d.lines,
        newLine({
          description: template.description,
          unit: template.unit,
          unitPrice: String(template.unit_price),
          vatRate: template.vat_rate,
        }),
      ],
    }));
  }

  async function handleSubmit(autosend: boolean) {
    setError(null);
    setOfflineNotice(false);

    if (!draft.customer) {
      setError("Kies een klant.");
      return;
    }

    const input: InvoiceInput = {
      customer: draft.customer,
      invoiceDate: draft.invoiceDate,
      deliveryDate: draft.deliveryDate,
      notes: draft.notes.trim() || null,
      lines: draft.lines
        .filter((l) => l.description.trim())
        .map((l) => ({
          description: l.description,
          quantity: Number(l.quantity) || 0,
          unit: l.unit,
          unitPrice: Number(l.unitPrice) || 0,
          vatRate: l.vatRate,
        })),
    };

    setSaving(autosend ? "send" : "concept");
    try {
      const result =
        mode === "edit" && invoiceId
          ? await updateInvoiceDraft(invoiceId, input)
          : await createInvoice(input);

      if (result.error) {
        setError(result.error);
        return;
      }

      try {
        window.localStorage.removeItem(draftKey);
      } catch {
        // niets te doen: het opslaan zelf is al gelukt
      }

      router.push(`/facturen/${result.id}${autosend ? "?autosend=1" : ""}`);
    } catch {
      // Netwerkfout (bv. geen bereik op locatie): het concept blijft lokaal
      // bewaard (zie useEffect hierboven) en gaat dus niet verloren.
      setOfflineNotice(true);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {restoredNotice && (
        <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Een lokaal bewaard concept is hersteld.
        </p>
      )}
      {offlineNotice && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Geen internetverbinding. Dit concept is lokaal op je telefoon bewaard en gaat niet
          verloren — probeer opnieuw op te slaan zodra je weer bereik hebt.
        </p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Klant</label>
        <CustomerPicker
          customers={customers}
          selection={draft.customer}
          onSelect={(customer) => setDraft((d) => ({ ...d, customer }))}
        />
      </div>

      <div className="flex gap-3">
        <label className="flex-1">
          <span className="mb-1 block text-sm font-medium text-gray-700">Factuurdatum</span>
          <input
            type="date"
            value={draft.invoiceDate}
            onChange={(e) => setDraft((d) => ({ ...d, invoiceDate: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base"
          />
        </label>
        <label className="flex-1">
          <span className="mb-1 block text-sm font-medium text-gray-700">Leverdatum</span>
          <input
            type="date"
            value={draft.deliveryDate ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, deliveryDate: e.target.value || null }))
            }
            placeholder="Zelfde als factuurdatum"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base"
          />
        </label>
      </div>

      {templates.length > 0 && (
        <div>
          <p className="mb-1 text-sm font-medium text-gray-700">Sjablonen</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => addTemplateLine(template)}
                className="shrink-0 whitespace-nowrap rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700"
              >
                + {template.description}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-gray-700">Regels</p>
        {draft.lines.map((line) => (
          <div key={line.localId} className="rounded-xl border border-gray-200 bg-white p-3">
            <input
              value={line.description}
              onChange={(e) => updateLine(line.localId, { description: e.target.value })}
              placeholder="Omschrijving"
              className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={line.quantity}
                onChange={(e) => updateLine(line.localId, { quantity: e.target.value })}
                className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-base"
              />
              <select
                value={line.unit}
                onChange={(e) => updateLine(line.localId, { unit: e.target.value as Unit })}
                className="rounded-lg border border-gray-300 px-2 py-2 text-base"
              >
                {Object.entries(UNIT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <span className="text-gray-400">×</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={line.unitPrice}
                onChange={(e) => updateLine(line.localId, { unitPrice: e.target.value })}
                placeholder="prijs"
                className="w-20 flex-1 rounded-lg border border-gray-300 px-2 py-2 text-base"
              />
              <button
                type="button"
                onClick={() => removeLine(line.localId)}
                aria-label="Regel verwijderen"
                className="px-2 text-red-500"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setDraft((d) => ({ ...d, lines: [...d.lines, newLine()] }))}
          className="rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600"
        >
          + Regel toevoegen
        </button>
      </div>

      <label>
        <span className="mb-1 block text-sm font-medium text-gray-700">Notitie (optioneel)</span>
        <textarea
          value={draft.notes}
          onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          rows={2}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base"
        />
      </label>

      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
        <div className="flex justify-between py-0.5">
          <span className="text-gray-500">Subtotaal</span>
          <span>{formatCurrency(totals.subtotal)}</span>
        </div>
        {totals.vatBreakdown.map((entry) => (
          <div key={entry.rate} className="flex justify-between py-0.5">
            <span className="text-gray-500">Btw {entry.rate}%</span>
            <span>{formatCurrency(entry.vat)}</span>
          </div>
        ))}
        <div className="mt-1 flex justify-between border-t border-gray-100 pt-1 text-base font-semibold">
          <span>Totaal</span>
          <span>{formatCurrency(totals.total)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-col gap-2 pb-4">
        <button
          type="button"
          disabled={saving !== null}
          onClick={() => handleSubmit(true)}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white active:bg-blue-700 disabled:opacity-60"
        >
          {saving === "send" ? "Bezig..." : "Direct versturen"}
        </button>
        <button
          type="button"
          disabled={saving !== null}
          onClick={() => handleSubmit(false)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base font-semibold text-gray-700 disabled:opacity-60"
        >
          {saving === "concept" ? "Bezig..." : "Opslaan als concept"}
        </button>
      </div>
    </div>
  );
}
