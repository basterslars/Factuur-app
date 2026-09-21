"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { sendInvoiceEmail } from "@/lib/actions/send-invoice";

export function SendEmailButton({
  invoiceId,
  hasCustomerEmail,
}: {
  invoiceId: string;
  hasCustomerEmail: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const triggered = useRef(false);

  async function handleSend() {
    setStatus("sending");
    setErrorMsg(null);
    const result = await sendInvoiceEmail(invoiceId);
    if (result.success) {
      setStatus("sent");
    } else {
      setStatus("error");
      setErrorMsg(result.error);
    }
    router.refresh();
  }

  useEffect(() => {
    if (searchParams.get("autosend") === "1" && !triggered.current) {
      triggered.current = true;
      router.replace(pathname);
      handleSend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleSend}
        disabled={status === "sending" || !hasCustomerEmail}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-base font-semibold text-white disabled:opacity-60"
      >
        {status === "sending"
          ? "Bezig met versturen..."
          : status === "sent"
            ? "Opnieuw versturen per e-mail"
            : "Versturen per e-mail"}
      </button>
      {!hasCustomerEmail && (
        <p className="text-sm text-amber-700">
          Deze klant heeft geen e-mailadres. Vul dit aan bij de klant, of download de pdf.
        </p>
      )}
      {status === "sent" && <p className="text-sm text-green-600">Verstuurd.</p>}
      {status === "error" && errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
    </div>
  );
}
