import Link from "next/link";
import { login } from "@/lib/actions/auth";
import { LoginForm } from "@/components/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const { created } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold">Inloggen</h1>
        <p className="mt-1 text-sm text-gray-500">Factuur-app</p>
      </div>
      {created && (
        <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          Account aangemaakt. Check je mail om te bevestigen, log daarna hier in.
        </p>
      )}
      <LoginForm action={login} />
      <p className="text-center text-sm text-gray-500">
        Nog geen account?{" "}
        <Link href="/setup" className="font-medium text-blue-600">
          Eerste account aanmaken
        </Link>
      </p>
    </main>
  );
}
