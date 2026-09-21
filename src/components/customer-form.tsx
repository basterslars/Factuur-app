"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { CustomerFormState } from "@/lib/actions/customers";
import type { Customer } from "@/lib/types";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white active:bg-blue-700 disabled:opacity-60"
    >
      {pending ? "Opslaan..." : label}
    </button>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="rounded-xl border border-gray-300 px-4 py-3 text-base"
      />
    </label>
  );
}

export function CustomerForm({
  customer,
  action,
  submitLabel,
}: {
  customer?: Customer;
  action: (state: CustomerFormState, formData: FormData) => Promise<CustomerFormState>;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState<CustomerFormState, FormData>(action, {
    error: null,
  });

  return (
    <form action={formAction} className="flex flex-col gap-4 p-4">
      <Field label="Naam" name="name" defaultValue={customer?.name} required />
      <Field label="Adres" name="address_line" defaultValue={customer?.address_line} />
      <div className="flex gap-3">
        <div className="flex-1">
          <Field label="Postcode" name="postal_code" defaultValue={customer?.postal_code} />
        </div>
        <div className="flex-[2]">
          <Field label="Plaats" name="city" defaultValue={customer?.city} />
        </div>
      </div>
      <Field label="E-mailadres" name="email" defaultValue={customer?.email} type="email" />
      <Field label="Telefoonnummer" name="phone" defaultValue={customer?.phone} type="tel" />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton label={submitLabel} />
    </form>
  );
}
