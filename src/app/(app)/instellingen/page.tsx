import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "@/components/settings-form";
import { createClient } from "@/lib/supabase/server";
import type { CompanySettings } from "@/lib/types";

export default async function InstellingenPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("company_settings")
    .select("*")
    .single<CompanySettings>();

  return (
    <>
      <PageHeader title="Bedrijfsinstellingen" backHref="/meer" />
      {settings && <SettingsForm settings={settings} />}
    </>
  );
}
