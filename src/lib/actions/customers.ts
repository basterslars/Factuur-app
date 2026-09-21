"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CustomerFormState = { error: string | null };

function readCustomerFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    address_line: String(formData.get("address_line") ?? "").trim(),
    postal_code: String(formData.get("postal_code") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
  };
}

export async function createCustomer(
  _prevState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const fields = readCustomerFields(formData);
  if (!fields.name) {
    return { error: "Naam is verplicht." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .insert(fields)
    .select("id")
    .single();

  if (error || !data) {
    return { error: `Aanmaken mislukt: ${error?.message ?? "onbekende fout"}` };
  }

  revalidatePath("/klanten");
  redirect(`/klanten/${data.id}`);
}

export async function updateCustomer(
  customerId: string,
  _prevState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const fields = readCustomerFields(formData);
  if (!fields.name) {
    return { error: "Naam is verplicht." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("customers").update(fields).eq("id", customerId);

  if (error) {
    return { error: `Opslaan mislukt: ${error.message}` };
  }

  revalidatePath("/klanten");
  revalidatePath(`/klanten/${customerId}`);
  return { error: null };
}

export async function deleteCustomer(customerId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("customers").delete().eq("id", customerId);

  if (error) {
    // Meestal: klant heeft nog facturen (ON DELETE RESTRICT).
    redirect(`/klanten/${customerId}?deleteError=1`);
  }

  revalidatePath("/klanten");
  redirect("/klanten");
}

export async function quickCreateCustomer(name: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .insert({ name: name.trim() })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/klanten");
  return data;
}
