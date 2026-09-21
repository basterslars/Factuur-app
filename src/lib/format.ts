export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium" }).format(d);
}

export const STATUS_LABELS: Record<string, string> = {
  concept: "Concept",
  verstuurd: "Verstuurd",
  betaald: "Betaald",
  te_laat: "Te laat",
};

export const STATUS_STYLES: Record<string, string> = {
  concept: "bg-gray-100 text-gray-600",
  verstuurd: "bg-blue-100 text-blue-700",
  betaald: "bg-green-100 text-green-700",
  te_laat: "bg-red-100 text-red-700",
};

export const UNIT_LABELS: Record<string, string> = {
  uur: "uur",
  stuk: "stuk",
  m2: "m²",
};
