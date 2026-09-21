import { PageHeader } from "@/components/page-header";
import { CustomerForm } from "@/components/customer-form";
import { createCustomer } from "@/lib/actions/customers";

export default function NieuweKlantPage() {
  return (
    <>
      <PageHeader title="Nieuwe klant" backHref="/klanten" />
      <CustomerForm action={createCustomer} submitLabel="Klant toevoegen" />
    </>
  );
}
