"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { updateCompanySettings, type SettingsFormState } from "@/lib/actions/settings";
import type { CompanySettings } from "@/lib/types";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white active:bg-blue-700 disabled:opacity-60"
    >
      {pending ? "Opslaan..." : "Opslaan"}
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
  defaultValue?: string;
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
        defaultValue={defaultValue}
        required={required}
        className="rounded-xl border border-gray-300 px-4 py-3 text-base"
      />
    </label>
  );
}

export function SettingsForm({ settings }: { settings: CompanySettings }) {
  const [state, formAction] = useActionState<SettingsFormState, FormData>(
    updateCompanySettings,
    { error: null, success: false },
  );
  const [logoUrl, setLogoUrl] = useState(settings.logo_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("logos").upload(path, file, {
        upsert: true,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("logos").getPublicUrl(path);
      setLogoUrl(data.publicUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Uploaden mislukt");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 p-4">
      <input type="hidden" name="logo_url" value={logoUrl} />

      <div className="flex items-center gap-4">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt="Logo"
            width={64}
            height={64}
            className="h-16 w-16 rounded-lg border border-gray-200 object-contain"
            unoptimized
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400">
            Logo
          </div>
        )}
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium disabled:opacity-60"
          >
            {uploading ? "Uploaden..." : "Logo kiezen"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="hidden"
          />
          {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
          <p className="mt-1 text-xs text-gray-400">Optioneel, verschijnt op je facturen</p>
        </div>
      </div>

      <Field label="Bedrijfsnaam" name="business_name" defaultValue={settings.business_name} required />
      <Field label="Adres" name="address_line" defaultValue={settings.address_line} />
      <div className="flex gap-3">
        <div className="flex-1">
          <Field label="Postcode" name="postal_code" defaultValue={settings.postal_code} />
        </div>
        <div className="flex-[2]">
          <Field label="Plaats" name="city" defaultValue={settings.city} />
        </div>
      </div>
      <Field label="KVK-nummer" name="kvk_number" defaultValue={settings.kvk_number} required />
      <Field label="Btw-identificatienummer" name="vat_number" defaultValue={settings.vat_number} required />
      <Field label="IBAN" name="iban" defaultValue={settings.iban} />
      <Field label="E-mailadres" name="email" defaultValue={settings.email} type="email" />
      <Field label="Telefoonnummer" name="phone" defaultValue={settings.phone} type="tel" />
      <Field label="Factuurprefix" name="invoice_prefix" defaultValue={settings.invoice_prefix} />
      <Field
        label="Betalingstermijn (dagen)"
        name="payment_term_days"
        defaultValue={String(settings.payment_term_days)}
        type="number"
        required
      />
      <p className="-mt-2 text-xs text-gray-400">
        Volgende factuurnummer: {settings.invoice_prefix}
        {String(settings.next_invoice_number).padStart(4, "0")} (wordt automatisch beheerd)
      </p>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">Opgeslagen.</p>}
      <SaveButton />
    </form>
  );
}
