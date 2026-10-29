"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useBikeFormOptions, useSaveBike } from "@/src/api/bikes";
import { ApiError, errorMessage } from "@/src/helpers/request";
import { toDateInput } from "@/src/helpers/format";
import { BikeDetail } from "@/src/types";
import useNotify from "@/src/hooks/useNotify";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";

interface BikeFormValues {
  bike_number: string;
  plate_number: string;
  brand: string;
  model: string;
  color: string;
  year: string;
  engine_number: string;
  chassis_number: string;
  status: string;
  assigned_rider_id: string;
  last_maintenance_date: string;
  next_maintenance_date: string;
  notes: string;
  [key: string]: string;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:col-span-2 mt-6 first:mt-0">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white pb-2 border-b-2 border-gray-200 dark:border-gray-700">{children}</h3>
    </div>
  );
}

export default function BikeForm({ bike }: { bike?: BikeDetail }) {
  const router = useRouter();
  const notify = useNotify();
  const isEdit = !!bike;
  const { data: options, isLoading } = useBikeFormOptions();
  const saveBike = useSaveBike(bike?.id);

  const docDefaults = Object.fromEntries(
    (bike?.documents ?? []).map((doc) => [`${doc.key}_expiry_date`, toDateInput(doc.expiry_date)]),
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BikeFormValues>({
    defaultValues: {
      bike_number: bike?.bike_number ?? "",
      plate_number: bike?.plate_number ?? "",
      brand: bike?.brand ?? "",
      model: bike?.model ?? "",
      color: bike?.color ?? "",
      year: bike?.year != null ? String(bike.year) : "",
      engine_number: bike?.engine_number ?? "",
      chassis_number: bike?.chassis_number ?? "",
      status: bike?.status ?? "active",
      assigned_rider_id: bike?.assigned_rider?.id != null ? String(bike.assigned_rider.id) : "",
      last_maintenance_date: toDateInput(bike?.last_maintenance_date),
      next_maintenance_date: toDateInput(bike?.next_maintenance_date),
      notes: bike?.notes ?? "",
      ...docDefaults,
    },
  });

  const fieldError = (name: string) =>
    errors[name]?.message ? <p className="mt-1 text-xs text-red-600">{String(errors[name]?.message)}</p> : null;

  const documentKeys = options?.documents.map((d) => d.key) ?? [];

  const onSubmit = async (values: BikeFormValues) => {
    const form = new FormData();
    Object.entries(values).forEach(([key, value]) => form.append(key, value ?? ""));

    documentKeys.forEach((key) => {
      const input = document.getElementById(`${key}_document`) as HTMLInputElement | null;
      const file = input?.files?.[0];
      if (file) form.append(`${key}_document`, file);
    });

    try {
      const saved = await saveBike.mutateAsync(form);
      notify.success(isEdit ? "Bike updated successfully" : "Bike created successfully");
      router.push(`/dashboard/bikes/${saved.id}`);
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        Object.entries(e.errors).forEach(([field, messages]) => setError(field, { message: messages[0] }));
      }
      notify.error(errorMessage(e));
    }
  };

  if (isLoading) return <LoadingSpinner fullScreen={false} />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionTitle>Bike Details</SectionTitle>
        <div>
          <label className="label">Bike Number <span className="text-red-500">*</span></label>
          <input className="input" {...register("bike_number", { required: "Bike number is required" })} />
          {fieldError("bike_number")}
        </div>
        <div>
          <label className="label">Plate Number <span className="text-red-500">*</span></label>
          <input className="input" {...register("plate_number", { required: "Plate number is required" })} />
          {fieldError("plate_number")}
        </div>
        <div>
          <label className="label">Brand</label>
          <input className="input" placeholder="e.g. Bajaj" {...register("brand")} />
        </div>
        <div>
          <label className="label">Model</label>
          <input className="input" placeholder="e.g. Boxer" {...register("model")} />
        </div>
        <div>
          <label className="label">Color</label>
          <input className="input" {...register("color")} />
        </div>
        <div>
          <label className="label">Year</label>
          <input type="number" className="input" {...register("year")} />
          {fieldError("year")}
        </div>
        <div>
          <label className="label">Engine Number</label>
          <input className="input" {...register("engine_number")} />
        </div>
        <div>
          <label className="label">Chassis Number</label>
          <input className="input" {...register("chassis_number")} />
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
          <label className="label">Assigned Rider</label>
          <select className="input" {...register("assigned_rider_id")}>
            <option value="">Unassigned</option>
            {options?.riders.map((r) => (
              <option key={r.id} value={r.id}>{r.name}{r.phone ? ` - ${r.phone}` : ""}</option>
            ))}
          </select>
        </div>

        <SectionTitle>Maintenance</SectionTitle>
        <div>
          <label className="label">Last Maintenance</label>
          <input type="date" className="input" {...register("last_maintenance_date")} />
        </div>
        <div>
          <label className="label">Next Maintenance</label>
          <input type="date" className="input" {...register("next_maintenance_date")} />
        </div>

        <SectionTitle>Documents</SectionTitle>
        {options?.documents.map((doc) => (
          <div key={doc.key} className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${doc.key}_document`} className="label">{doc.label}</label>
              <input id={`${doc.key}_document`} type="file" accept=".pdf,.jpg,.jpeg,.png" className="input file:mr-3 file:border-0 file:bg-primary/10 file:text-primary file:rounded file:px-2 file:py-1" />
              {bike?.documents.find((d) => d.key === doc.key)?.url && (
                <a href={bike.documents.find((d) => d.key === doc.key)?.url ?? undefined} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-primary hover:underline">
                  View current file
                </a>
              )}
            </div>
            <div>
              <label className="label">Expiry Date</label>
              <input type="date" className="input" {...register(`${doc.key}_expiry_date`)} />
            </div>
          </div>
        ))}

        <SectionTitle>Notes</SectionTitle>
        <div className="md:col-span-2">
          <textarea rows={3} className="input" {...register("notes")} />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8">
        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary" disabled={isSubmitting || saveBike.isPending}>
          {isSubmitting || saveBike.isPending ? "Saving..." : isEdit ? "Update Bike" : "Create Bike"}
        </button>
      </div>
    </form>
  );
}
