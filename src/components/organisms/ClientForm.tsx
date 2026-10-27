"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { useClientFormOptions, useSaveClient } from "@/src/api/clients";
import { ApiError, errorMessage } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import { ClientDetail } from "@/src/types";

const TEXT_FIELDS = [
  "name", "company_name", "contact_person", "phone", "alternate_phone", "email", "alternate_email",
  "pickup_address", "business_address", "city", "state", "business_type", "tax_id", "website",
  "payment_terms", "notes", "special_instructions", "onboarded_date",
  "bank_name", "bank_account_name", "bank_account_number",
] as const;

type TextField = (typeof TEXT_FIELDS)[number];

type ClientFormValues = Record<TextField, string> & {
  credit_limit: string;
  is_active: boolean;
  zone_rates: Record<string, string>;
};

const BUSINESS_TYPES = ["E-commerce", "Retail", "Restaurant", "Pharmacy", "Fashion", "Electronics", "Logistics", "Individual", "Other"];

const valuesFromClient = (client?: ClientDetail): ClientFormValues => {
  const values = Object.fromEntries(TEXT_FIELDS.map((field) => [field, (client?.[field] as string | null) ?? ""])) as Record<TextField, string>;
  return {
    ...values,
    payment_terms: client?.payment_terms ?? "prepaid",
    onboarded_date: client?.onboarded_date ?? new Date().toISOString().slice(0, 10),
    credit_limit: client?.credit_limit !== null && client?.credit_limit !== undefined ? String(client.credit_limit) : "",
    is_active: client?.is_active ?? true,
    zone_rates: Object.fromEntries(Object.entries(client?.zone_rates ?? {}).map(([zone, rate]) => [zone, String(rate)])),
  };
};

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="md:col-span-2 mt-6 first:mt-0">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white pb-2 border-b-2 border-gray-200 dark:border-gray-700">{children}</h3>
      {hint && <p className="text-sm text-gray-500 mt-2">{hint}</p>}
    </div>
  );
}

export default function ClientForm({ client }: { client?: ClientDetail }) {
  const router = useRouter();
  const notify = useNotify();
  const { data: options } = useClientFormOptions();
  const saveClient = useSaveClient(client?.id);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ClientFormValues>({ defaultValues: valuesFromClient(client) });

  const onSubmit = async (values: ClientFormValues) => {
    const payload: Record<string, unknown> = { ...values, credit_limit: values.credit_limit === "" ? null : values.credit_limit };
    TEXT_FIELDS.forEach((field) => {
      if (payload[field] === "") payload[field] = null;
    });
    payload.zone_rates = Object.fromEntries(Object.entries(values.zone_rates ?? {}).filter(([, rate]) => rate !== "" && rate !== null));

    try {
      const res = await saveClient.mutateAsync(payload);
      notify.success(client ? "Client updated successfully" : "Client created successfully");
      router.push(`/dashboard/clients/${res.data.id}`);
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        Object.entries(e.errors).forEach(([field, messages]) => setError(field as keyof ClientFormValues, { message: messages[0] }));
      }
      notify.error(errorMessage(e));
    }
  };

  const input = (name: TextField, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, required = false) => (
    <div>
      <label className="label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input className="input" {...props} {...register(name, required ? { required: `${label} is required` } : {})} />
      {errors[name]?.message && <p className="mt-1 text-xs text-red-600">{String(errors[name]?.message)}</p>}
    </div>
  );

  const textarea = (name: TextField, label: string, required = false, hint?: string) => (
    <div className="md:col-span-2">
      <label className="label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea rows={2} className="input" {...register(name, required ? { required: `${label} is required` } : {})} />
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {errors[name]?.message && <p className="mt-1 text-xs text-red-600">{String(errors[name]?.message)}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionTitle>Basic Information</SectionTitle>
        {input("name", "Client Name", {}, true)}
        {input("company_name", "Company Name")}
        {input("contact_person", "Contact Person")}
        <div>
          <label className="label">Business Type</label>
          <select className="input" {...register("business_type")}>
            <option value="">Select type</option>
            {BUSINESS_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <SectionTitle>Contact Information</SectionTitle>
        {input("phone", "Phone", { type: "tel" }, true)}
        {input("alternate_phone", "Alternate Phone", { type: "tel" })}
        {input("email", "Email", { type: "email" })}
        {input("alternate_email", "Alternate Email", { type: "email" })}
        {input("website", "Website", { type: "url", placeholder: "https://example.com" })}

        <SectionTitle>Address Information</SectionTitle>
        {textarea("pickup_address", "Pickup Address", true)}
        {textarea("business_address", "Business Address")}
        {input("city", "City")}
        {input("state", "State")}

        <SectionTitle>Billing & Account</SectionTitle>
        {input("tax_id", "Tax ID / Business Registration Number")}
        <div>
          <label className="label">Payment Terms</label>
          <select className="input" {...register("payment_terms")}>
            {(options?.payment_terms ?? []).map((term) => (
              <option key={term.value} value={term.value}>{term.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Credit Limit (₦)</label>
          <input type="number" step="0.01" min={0} className="input" {...register("credit_limit")} />
          <p className="mt-1 text-xs text-gray-500">Maximum credit allowed for this client</p>
        </div>
        {input("onboarded_date", "Onboarded Date", { type: "date" })}

        <SectionTitle hint="Used when sending this client's daily remittance.">Bank Details</SectionTitle>
        {input("bank_name", "Bank Name")}
        {input("bank_account_number", "Account Number")}
        <div className="md:col-span-2">{input("bank_account_name", "Account Name")}</div>

        <SectionTitle>Additional Information</SectionTitle>
        {textarea("notes", "Internal Notes", false, "Internal notes about this client (not visible to client)")}
        {textarea("special_instructions", "Special Instructions", false, "Any special handling or delivery instructions for this client's orders")}

        <SectionTitle hint="Set fixed delivery fees per destination zone for this client. Leave blank to use the standard distance-based pricing.">
          Zone Pricing (Fixed Rates)
        </SectionTitle>
        {(options?.zones ?? []).map((zone) => (
          <div key={zone.key}>
            <label className="label">{zone.label}</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-sm text-gray-400">₦</span>
              <input type="number" step="0.01" min={0} className="input pl-7" placeholder="Standard pricing" {...register(`zone_rates.${zone.key}`)} />
            </div>
          </div>
        ))}

        <div className="md:col-span-2 mt-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-primary" {...register("is_active")} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Active Client</span>
          </label>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-end gap-3">
        <Link href={client ? `/dashboard/clients/${client.id}` : "/dashboard/clients"} className="btn-secondary px-6">
          Cancel
        </Link>
        <button type="submit" disabled={saveClient.isPending} className="btn-primary px-6">
          {saveClient.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {client ? "Update Client" : "Create Client"}
        </button>
      </div>
    </form>
  );
}
