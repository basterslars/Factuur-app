export type CalcLine = {
  quantity: number;
  unitPrice: number;
  vatRate: number;
};

export type VatBreakdownEntry = {
  rate: number;
  base: number;
  vat: number;
};

export type InvoiceTotals = {
  subtotal: number;
  vatBreakdown: VatBreakdownEntry[];
  vatAmount: number;
  total: number;
};

// Rekenen in hele centen om afrondingsverschillen door floating point te
// voorkomen; pas op de grens terug omrekenen naar euro's.
function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function lineTotalCents(line: CalcLine): number {
  return Math.round(line.quantity * toCents(line.unitPrice));
}

export function computeInvoiceTotals(lines: CalcLine[]): InvoiceTotals {
  const byRate = new Map<number, { base: number; vat: number }>();
  let subtotalCents = 0;

  for (const line of lines) {
    const baseCents = lineTotalCents(line);
    subtotalCents += baseCents;
    const vatCents = Math.round((baseCents * line.vatRate) / 100);
    const existing = byRate.get(line.vatRate) ?? { base: 0, vat: 0 };
    byRate.set(line.vatRate, {
      base: existing.base + baseCents,
      vat: existing.vat + vatCents,
    });
  }

  const vatBreakdown = [...byRate.entries()]
    .sort(([a], [b]) => b - a)
    .map(([rate, { base, vat }]) => ({
      rate,
      base: base / 100,
      vat: vat / 100,
    }));

  const vatAmountCents = vatBreakdown.reduce((sum, entry) => sum + toCents(entry.vat), 0);

  return {
    subtotal: subtotalCents / 100,
    vatBreakdown,
    vatAmount: vatAmountCents / 100,
    total: (subtotalCents + vatAmountCents) / 100,
  };
}
