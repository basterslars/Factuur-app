"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { AuthFormState } from "@/lib/actions/auth";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white active:bg-blue-700 disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function LoginForm({
  action,
}: {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
}) {
  const [state, formAction] = useActionState<AuthFormState, FormData>(action, {
    error: null,
  });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        name="email"
        type="email"
        autoComplete="email"
        placeholder="E-mailadres"
        required
        className="rounded-xl border border-gray-300 px-4 py-3 text-base"
      />
      <input
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Wachtwoord"
        required
        className="rounded-xl border border-gray-300 px-4 py-3 text-base"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton label="Inloggen" pendingLabel="Bezig..." />
    </form>
  );
}

export function SignupForm({
  action,
}: {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
}) {
  const [state, formAction] = useActionState<AuthFormState, FormData>(action, {
    error: null,
  });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        name="email"
        type="email"
        autoComplete="email"
        placeholder="E-mailadres"
        required
        className="rounded-xl border border-gray-300 px-4 py-3 text-base"
      />
      <input
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="Wachtwoord (min. 8 tekens)"
        required
        minLength={8}
        className="rounded-xl border border-gray-300 px-4 py-3 text-base"
      />
      <input
        name="passwordRepeat"
        type="password"
        autoComplete="new-password"
        placeholder="Wachtwoord herhalen"
        required
        minLength={8}
        className="rounded-xl border border-gray-300 px-4 py-3 text-base"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton label="Account aanmaken" pendingLabel="Bezig..." />
    </form>
  );
}
