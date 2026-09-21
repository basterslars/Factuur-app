import { PageHeader } from "@/components/page-header";
import { TemplateForm } from "@/components/template-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { createClient } from "@/lib/supabase/server";
import { deleteLineTemplate } from "@/lib/actions/templates";
import { formatCurrency, UNIT_LABELS } from "@/lib/format";
import type { LineTemplate } from "@/lib/types";

export default async function SjablonenPage() {
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("line_templates")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<LineTemplate[]>();

  return (
    <>
      <PageHeader title="Sjablonen" backHref="/meer" />
      <div className="flex flex-col gap-4 p-4">
        <p className="text-sm text-gray-500">
          Sla terugkerende werkzaamheden op, zodat je ze in het factuurregel-scherm met één
          tik kunt toevoegen.
        </p>
        <TemplateForm />

        {templates && templates.length > 0 && (
          <ul className="flex flex-col gap-2">
            {templates.map((template) => {
              const deleteAction = deleteLineTemplate.bind(null, template.id);
              return (
                <li
                  key={template.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{template.description}</p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(template.unit_price)} per {UNIT_LABELS[template.unit]}
                    </p>
                  </div>
                  <form action={deleteAction}>
                    <ConfirmSubmitButton
                      confirmMessage={`Sjabloon "${template.description}" verwijderen?`}
                      className="px-2 py-1 text-sm text-red-600"
                    >
                      Verwijderen
                    </ConfirmSubmitButton>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
