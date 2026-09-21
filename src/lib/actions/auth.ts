"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = { error: string | null };

export async function login(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Vul e-mailadres en wachtwoord in." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Inloggen mislukt. Controleer je e-mailadres en wachtwoord." };
  }

  redirect("/");
}

export async function signup(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordRepeat = String(formData.get("passwordRepeat") ?? "");

  if (!email || !password) {
    return { error: "Vul e-mailadres en wachtwoord in." };
  }
  if (password.length < 8) {
    return { error: "Wachtwoord moet minimaal 8 tekens zijn." };
  }
  if (password !== passwordRepeat) {
    return { error: "Wachtwoorden komen niet overeen." };
  }

  const supabase = await createClient();

  const { data: alreadyExists } = await supabase.rpc("has_any_account");
  if (alreadyExists) {
    return { error: "Er bestaat al een account. Log in op /login." };
  }

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return { error: `Aanmaken account mislukt: ${error.message}` };
  }

  redirect("/login?created=1");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
