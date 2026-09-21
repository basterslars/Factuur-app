import Link from "next/link";
import { signup } from "@/lib/actions/auth";
import { SignupForm } from "@/components/auth-form";
import { createClient } from "@/lib/supabase/server";

export default async function SetupPage() {
  const supabase = await createClient();
  const { data: alreadyExists } = await supabase.rpc("has_any_account");

  if (alreadyExists) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-6 py-10 text-center">
        <h1 className="text-2xl font-bold">Er bestaat al een account</h1>
        <p className="text-sm text-gray-500">
          Deze app is single-tenant: er is maar plek voor één bedrijf. Log in met het
          bestaande account.
        </p>
        <Link href="/login" className="font-medium text-blue-600">
          Naar inloggen
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold">Account aanmaken</h1>
        <p className="mt-1 text-sm text-gray-500">
          Dit is eenmalig: het eerste (en enige) account voor jouw bedrijf.
        </p>
      </div>
      <SignupForm action={signup} />
      <p className="text-center text-sm text-gray-500">
        Al een account?{" "}
        <Link href="/login" className="font-medium text-blue-600">
          Inloggen
        </Link>
      </p>
    </main>
  );
}
