"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SettingsFormState = { error: string | null; success: boolean };

const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

export async function updateCompanySettings(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const businessName = String(formData.get("business_name") ?? "").trim();
  const kvkNumber = String(formData.get("kvk_number") ?? "").trim();
  const vatNumber = String(formData.get("vat_number") ?? "").trim();

  if (!businessName || !kvkNumber || !vatNumber) {
    return {
      error: "Bedrijfsnaam, KVK-nummer en btw-nummer zijn verplicht voor een geldige factuur.",
      success: false,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("company_settings")
    .update({
      business_name: businessName,
      address_line: String(formData.get("address_line") ?? "").trim(),
      postal_code: String(formData.get("postal_code") ?? "").trim(),
      city: String(formData.get("city") ?? "").trim(),
      kvk_number: kvkNumber,
      vat_number: vatNumber,
      iban: String(formData.get("iban") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      invoice_prefix: String(formData.get("invoice_prefix") ?? "").trim(),
      logo_url: String(formData.get("logo_url") ?? "") || null,
    })
    .eq("id", SETTINGS_ID);

  if (error) {
    return { error: `Opslaan mislukt: ${error.message}`, success: false };
  }

  revalidatePath("/instellingen");
  return { error: null, success: true };
}
