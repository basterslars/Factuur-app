import { Document, Page, View, Text, StyleSheet, Image } from "@react-pdf/renderer";
import { formatCurrency, formatDate, UNIT_LABELS } from "@/lib/format";
import type { Invoice, InvoiceLine, IssuerSnapshot, CustomerSnapshot } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111827",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  logo: {
    width: 64,
    height: 64,
    objectFit: "contain",
  },
  businessBlock: {
    alignItems: "flex-end",
    textAlign: "right",
  },
  businessName: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  metaBlock: {
    maxWidth: "48%",
  },
  label: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 2,
  },
  value: {
    marginBottom: 6,
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1 solid #111827",
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #e5e7eb",
    paddingVertical: 5,
  },
  colDescription: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colUnit: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1.2, textAlign: "right" },
  colTotal: { flex: 1.2, textAlign: "right" },
  headerCell: { fontSize: 9, color: "#6b7280", fontWeight: 700 },
  totals: {
    marginTop: 16,
    alignSelf: "flex-end",
    width: "55%",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  totalsRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "1 solid #111827",
    marginTop: 4,
    paddingTop: 4,
    fontSize: 12,
    fontWeight: 700,
  },
  notes: {
    marginTop: 24,
    padding: 10,
    backgroundColor: "#f9fafb",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: "1 solid #e5e7eb",
    paddingTop: 8,
    fontSize: 8,
    color: "#6b7280",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export function InvoicePdfDocument({
  invoice,
  lines,
}: {
  invoice: Invoice;
  lines: InvoiceLine[];
}) {
  const issuer = invoice.issuer_snapshot as IssuerSnapshot;
  const customer = invoice.customer_snapshot as CustomerSnapshot;

  return (
    <Document title={`Factuur ${invoice.invoice_number ?? ""}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Factuur</Text>
            <Text style={styles.value}>{invoice.invoice_number}</Text>
          </View>
          <View style={styles.businessBlock}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image, geen HTML img */}
            {issuer.logo_url && <Image src={issuer.logo_url} style={styles.logo} />}
            <Text style={styles.businessName}>{issuer.business_name}</Text>
            <Text>{issuer.address_line}</Text>
            <Text>
              {issuer.postal_code} {issuer.city}
            </Text>
            {issuer.email && <Text>{issuer.email}</Text>}
            {issuer.phone && <Text>{issuer.phone}</Text>}
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaBlock}>
            <Text style={styles.label}>Factuur aan</Text>
            <Text style={styles.value}>{customer.name}</Text>
            {customer.address_line && <Text>{customer.address_line}</Text>}
            {(customer.postal_code || customer.city) && (
              <Text>
                {customer.postal_code} {customer.city}
              </Text>
            )}
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.label}>Factuurdatum</Text>
            <Text style={styles.value}>{formatDate(invoice.invoice_date)}</Text>
            {invoice.delivery_date && invoice.delivery_date !== invoice.invoice_date && (
              <>
                <Text style={styles.label}>Leverdatum</Text>
                <Text style={styles.value}>{formatDate(invoice.delivery_date)}</Text>
              </>
            )}
            <Text style={styles.label}>KVK-nummer</Text>
            <Text style={styles.value}>{issuer.kvk_number}</Text>
            <Text style={styles.label}>Btw-identificatienummer</Text>
            <Text style={styles.value}>{issuer.vat_number}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDescription, styles.headerCell]}>Omschrijving</Text>
            <Text style={[styles.colQty, styles.headerCell]}>Aantal</Text>
            <Text style={[styles.colUnit, styles.headerCell]}>Eenheid</Text>
            <Text style={[styles.colPrice, styles.headerCell]}>Prijs</Text>
            <Text style={[styles.colTotal, styles.headerCell]}>Totaal</Text>
          </View>
          {lines.map((line) => (
            <View key={line.id} style={styles.tableRow}>
              <Text style={styles.colDescription}>{line.description}</Text>
              <Text style={styles.colQty}>{line.quantity}</Text>
              <Text style={styles.colUnit}>{UNIT_LABELS[line.unit]}</Text>
              <Text style={styles.colPrice}>{formatCurrency(line.unit_price)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(line.line_total)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text>Subtotaal (excl. btw)</Text>
            <Text>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          {invoice.vat_breakdown.map((entry) => (
            <View key={entry.rate} style={styles.totalsRow}>
              <Text>Btw {entry.rate}%</Text>
              <Text>{formatCurrency(entry.vat)}</Text>
            </View>
          ))}
          <View style={styles.totalsRowFinal}>
            <Text>Totaal (incl. btw)</Text>
            <Text>{formatCurrency(invoice.total)}</Text>
          </View>
        </View>

        {invoice.notes && (
          <View style={styles.notes}>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>
            {issuer.business_name} · KVK {issuer.kvk_number} · Btw {issuer.vat_number}
          </Text>
          {issuer.iban && <Text>IBAN {issuer.iban}</Text>}
        </View>
      </Page>
    </Document>
  );
}
