export type Unit = "uur" | "stuk" | "m2";
export type InvoiceStatus = "concept" | "verstuurd" | "betaald" | "te_laat";

export type CompanySettings = {
  id: string;
  business_name: string;
  address_line: string;
  postal_code: string;
  city: string;
  country: string;
  kvk_number: string;
  vat_number: string;
  iban: string;
  email: string;
  phone: string;
  logo_url: string | null;
  invoice_prefix: string;
  next_invoice_number: number;
  default_vat_rate: number;
  payment_term_days: number;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: string;
  name: string;
  address_line: string;
  postal_code: string;
  city: string;
  country: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type LineTemplate = {
  id: string;
  description: string;
  unit: Unit;
  unit_price: number;
  vat_rate: number;
  created_at: string;
};

export type InvoiceLine = {
  id: string;
  invoice_id: string;
  position: number;
  description: string;
  quantity: number;
  unit: Unit;
  unit_price: number;
  vat_rate: number;
  line_total: number;
  created_at: string;
};

export type IssuerSnapshot = {
  business_name: string;
  address_line: string;
  postal_code: string;
  city: string;
  country: string;
  kvk_number: string;
  vat_number: string;
  iban: string;
  email: string;
  phone: string;
  logo_url: string | null;
};

export type CustomerSnapshot = {
  name: string;
  address_line: string;
  postal_code: string;
  city: string;
  country: string;
  email: string | null;
  phone: string | null;
};

export type Invoice = {
  id: string;
  invoice_number: string | null;
  sequence_number: number | null;
  customer_id: string;
  invoice_date: string;
  delivery_date: string | null;
  due_date: string | null;
  status: InvoiceStatus;
  subtotal: number;
  vat_breakdown: { rate: number; base: number; vat: number }[];
  vat_amount: number;
  total: number;
  notes: string | null;
  issuer_snapshot: IssuerSnapshot | null;
  customer_snapshot: CustomerSnapshot | null;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InvoiceWithCustomer = Invoice & { customer: Customer | null };
export type InvoiceWithLines = Invoice & { invoice_lines: InvoiceLine[]; customer: Customer | null };
