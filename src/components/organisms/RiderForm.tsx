"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useRiderFormOptions, useSaveRider } from "@/src/api/riders";
import { ApiError, errorMessage } from "@/src/helpers/request";
import { toDateInput } from "@/src/helpers/format";
import { RiderDetail } from "@/src/types";
import useNotify from "@/src/hooks/useNotify";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";

interface RiderFormValues {
  name: string;
  email: string;
  phone: string;
  age: string;
  vehicle_type: string;
  vehicle_number: string;
  license_number: string;
  status: string;
  address: string;
  witness_full_name: string;
  witness_phone: string;
  witness_address: string;
  witness_date: string;
  [key: string]: string;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:col-span-2 mt-6 first:mt-0">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white pb-2 border-b-2 border-gray-200 dark:border-gray-700">{children}</h3>
    </div>
  );
}

const DOCUMENTS: [string, string][] = [
  ["rider_photo", "Rider Photo"],
  ["rider_id_document", "ID Document"],
  ["driver_license_doc", "Driver's License"],
  ["vehicle_registration", "Vehicle Registration"],
  ["vehicle_insurance", "Vehicle Insurance"],
];

const GUARANTOR_DOCS: [string, string][] = [
  ["id_document", "ID Document"],
  ["proof_of_address", "Proof of Address"],
  ["employment_letter", "Employment Letter"],
  ["additional_doc", "Additional Document"],
];

const guarantorField = (n: number, key: string) => `guarantor${n}_${key}`;

export default function RiderForm({ rider }: { rider?: RiderDetail }) {
  const router = useRouter();
  const notify = useNotify();
  const isEdit = !!rider;
  const { data: options, isLoading } = useRiderFormOptions();
  const saveRider = useSaveRider(rider?.id);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RiderFormValues>({
    defaultValues: {
      name: rider?.name ?? "",
      email: rider?.email ?? "",
      phone: rider?.phone ?? "",
      age: rider?.age != null ? String(rider.age) : "",
      vehicle_type: rider?.vehicle_type ?? "bike",
      vehicle_number: rider?.vehicle_number ?? "",
      license_number: rider?.license_number ?? "",
      status: rider?.status ?? "active",
      address: rider?.address ?? "",
      witness_full_name: rider?.witness.full_name ?? "",
      witness_phone: rider?.witness.phone ?? "",
      witness_address: rider?.witness.address ?? "",
      witness_date: toDateInput(rider?.witness.date),
      ...Object.fromEntries(
        [1, 2].flatMap((n) => {
          const g = rider?.guarantors.find((x) => x.index === n);
          return [
            [guarantorField(n, "full_name"), g?.full_name ?? ""],
            [guarantorField(n, "dob"), toDateInput(g?.dob)],
            [guarantorField(n, "nationality"), g?.nationality ?? ""],
            [guarantorField(n, "occupation"), g?.occupation ?? ""],
            [guarantorField(n, "nin"), g?.nin ?? ""],
            [guarantorField(n, "phone"), g?.phone ?? ""],
            [guarantorField(n, "relationship"), g?.relationship ?? ""],
            [guarantorField(n, "years_known"), g?.years_known != null ? String(g.years_known) : ""],
            [guarantorField(n, "residential_address"), g?.residential_address ?? ""],
          ];
        }),
      ),
    },
  });

  const fieldError = (name: string) =>
    errors[name]?.message ? <p className="mt-1 text-xs text-red-600">{String(errors[name]?.message)}</p> : null;

  const fileInputIds = [
    ...DOCUMENTS.map(([name]) => name),
    "witness_signature",
    ...([1, 2] as const).flatMap((n) => GUARANTOR_DOCS.map(([key]) => guarantorField(n, key))),
  ];

  const onSubmit = async (values: RiderFormValues) => {
    const form = new FormData();
    Object.entries(values).forEach(([key, value]) => form.append(key, value ?? ""));

    fileInputIds.forEach((name) => {
      const input = document.getElementById(name) as HTMLInputElement | null;
      const file = input?.files?.[0];
      if (file) form.append(name, file);
    });

    try {
      const saved = await saveRider.mutateAsync(form);
      notify.success(isEdit ? "Rider updated successfully" : "Rider created successfully");
      router.push(`/dashboard/riders/${saved.id}`);
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        Object.entries(e.errors).forEach(([field, messages]) => setError(field, { message: messages[0] }));
      }
      notify.error(errorMessage(e));
    }
  };

  if (isLoading) return <LoadingSpinner fullScreen={false} />;

  const fileField = (name: string, label: string) => (
    <div key={name}>
      <label htmlFor={name} className="label">{label}</label>
      <input id={name} type="file" accept=".pdf,.jpeg,.jpg,.png,.gif" className="input file:mr-3 file:border-0 file:bg-primary/10 file:text-primary file:rounded file:px-2 file:py-1" />
      {rider?.files[name] && (
        <a href={rider.files[name] ?? undefined} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-primary hover:underline">
          View current file
        </a>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionTitle>Rider Information</SectionTitle>
        <div>
          <label className="label">Full Name <span className="text-red-500">*</span></label>
          <input className="input" {...register("name", { required: "Name is required" })} />
          {fieldError("name")}
        </div>
        <div>
          <label className="label">Email <span className="text-red-500">*</span></label>
          <input type="email" className="input" {...register("email", { required: "Email is required" })} />
          {fieldError("email")}
        </div>
        <div>
          <label className="label">Phone <span className="text-red-500">*</span></label>
          <input className="input" {...register("phone", { required: "Phone is required" })} />
          {fieldError("phone")}
        </div>
        <div>
          <label className="label">Age</label>
          <input type="number" min={18} max={100} className="input" {...register("age")} />
          {fieldError("age")}
        </div>
        <div>
          <label className="label">Status <span className="text-red-500">*</span></label>
          <select className="input" {...register("status", { required: true })}>
            {options?.statuses.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Address</label>
          <input className="input" {...register("address")} />
        </div>

        <SectionTitle>Vehicle</SectionTitle>
        <div>
          <label className="label">Vehicle Type</label>
          <select className="input" {...register("vehicle_type")}>
            {options?.vehicle_types.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Vehicle Number</label>
          <input className="input" placeholder="e.g. LAG-123-XY" {...register("vehicle_number")} />
        </div>
        <div>
          <label className="label">License Number</label>
          <input className="input" {...register("license_number")} />
        </div>

        <SectionTitle>Documents</SectionTitle>
        {DOCUMENTS.map(([name, label]) => fileField(name, label))}

        {[1, 2].map((n) => (
          <GuarantorSection key={n} n={n} register={register} fileField={fileField} />
        ))}

        <SectionTitle>Witness</SectionTitle>
        <div>
          <label className="label">Witness Name</label>
          <input className="input" {...register("witness_full_name")} />
        </div>
        <div>
          <label className="label">Witness Phone</label>
          <input className="input" {...register("witness_phone")} />
        </div>
        <div>
          <label className="label">Witness Address</label>
          <input className="input" {...register("witness_address")} />
        </div>
        <div>
          <label className="label">Witness Date</label>
          <input type="date" className="input" {...register("witness_date")} />
        </div>
        {fileField("witness_signature", "Witness Signature")}
      </div>

      <div className="flex justify-end gap-3 mt-8">
        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary" disabled={isSubmitting || saveRider.isPending}>
          {isSubmitting || saveRider.isPending ? "Saving..." : isEdit ? "Update Rider" : "Create Rider"}
        </button>
      </div>
    </form>
  );
}

function GuarantorSection({
  n,
  register,
  fileField,
}: {
  n: number;
  register: ReturnType<typeof useForm<RiderFormValues>>["register"];
  fileField: (name: string, label: string) => React.ReactNode;
}) {
  return (
    <>
      <SectionTitle>Guarantor {n}</SectionTitle>
      <div>
        <label className="label">Full Name</label>
        <input className="input" {...register(guarantorField(n, "full_name"))} />
      </div>
      <div>
        <label className="label">Phone</label>
        <input className="input" {...register(guarantorField(n, "phone"))} />
      </div>
      <div>
        <label className="label">Relationship</label>
        <input className="input" {...register(guarantorField(n, "relationship"))} />
      </div>
      <div>
        <label className="label">Occupation</label>
        <input className="input" {...register(guarantorField(n, "occupation"))} />
      </div>
      <div>
        <label className="label">Nationality</label>
        <input className="input" {...register(guarantorField(n, "nationality"))} />
      </div>
      <div>
        <label className="label">NIN</label>
        <input className="input" {...register(guarantorField(n, "nin"))} />
      </div>
      <div>
        <label className="label">Date of Birth</label>
        <input type="date" className="input" {...register(guarantorField(n, "dob"))} />
      </div>
      <div>
        <label className="label">Years Known</label>
        <input type="number" className="input" {...register(guarantorField(n, "years_known"))} />
      </div>
      <div className="md:col-span-2">
        <label className="label">Residential Address</label>
        <input className="input" {...register(guarantorField(n, "residential_address"))} />
      </div>
      {GUARANTOR_DOCS.map(([key, label]) => fileField(guarantorField(n, key), `${label}`))}
    </>
  );
}
