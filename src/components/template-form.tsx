"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createLineTemplate, type TemplateFormState } from "@/lib/actions/templates";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white active:bg-blue-700 disabled:opacity-60"
    >
      {pending ? "Opslaan..." : "Opslaan"}
    </button>
  );
}

export function TemplateForm() {
  const [state, formAction] = useActionState<TemplateFormState, FormData>(
    createLineTemplate,
    { error: null },
  );

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <input
        name="description"
        placeholder="Omschrijving, bv. Gevel schilderen"
        required
        className="rounded-xl border border-gray-300 px-4 py-3 text-base"
      />
      <div className="flex gap-3">
        <input
          name="unit_price"
          type="number"
          step="0.01"
          min="0"
          placeholder="Prijs"
          required
          className="w-28 rounded-xl border border-gray-300 px-4 py-3 text-base"
        />
        <select
          name="unit"
          defaultValue="uur"
          className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-base"
        >
          <option value="uur">per uur</option>
          <option value="m2">per m²</option>
          <option value="stuk">per stuk</option>
        </select>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
