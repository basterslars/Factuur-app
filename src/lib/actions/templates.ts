"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Unit } from "@/lib/types";

export type TemplateFormState = { error: string | null };

export async function createLineTemplate(
  _prevState: TemplateFormState,
  formData: FormData,
): Promise<TemplateFormState> {
  const description = String(formData.get("description") ?? "").trim();
  const unit = String(formData.get("unit") ?? "stuk") as Unit;
  const unitPrice = Number(formData.get("unit_price"));

  if (!description) {
    return { error: "Omschrijving is verplicht." };
  }
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    return { error: "Vul een geldige prijs in." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("line_templates").insert({
    description,
    unit,
    unit_price: unitPrice,
    vat_rate: 21,
  });

  if (error) {
    return { error: `Opslaan mislukt: ${error.message}` };
  }

  revalidatePath("/sjablonen");
  return { error: null };
}

export async function deleteLineTemplate(templateId: string) {
  const supabase = await createClient();
  await supabase.from("line_templates").delete().eq("id", templateId);
  revalidatePath("/sjablonen");
}
