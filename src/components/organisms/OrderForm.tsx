"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { Loader2, Plus, X } from "lucide-react";
import { useOrderFormOptions, useSaveOrder } from "@/src/api/orders";
import { ApiError, errorMessage } from "@/src/helpers/request";
import { statusLabel, toDateInput } from "@/src/helpers/format";
import useNotify from "@/src/hooks/useNotify";
import LoadingSpinner from "../atoms/LoadingSpinner";
import { Order } from "@/src/types";

interface StockRow {
  client_stock_id: string;
  quantity: number;
}

interface OrderFormValues {
  client_id: string;
  source: string;
  source_contact: string;
  source_notes: string;
  sender_name: string;
  sender_phone: string;
  sender_email: string;
  pickup_address: string;
  receiver_name: string;
  receiver_phone: string;
  delivery_address: string;
  item_description: string;
  quantity: string;
  item_size: string;
  weight: string;
  price: string;
  payment_method: string;
  amount_received: string;
  mark_remitted: boolean;
  is_failed_delivery: boolean;
  status: string;
  priority_level: string;
  pickup_date: string;
  delivery_date: string;
  notes: string;
  stock_items: StockRow[];
}

const FILE_INPUTS = [
  ["package_image_1", "Package Image 1", "image/*"],
  ["package_image_2", "Package Image 2", "image/*"],
  ["package_image_3", "Package Image 3", "image/*"],
  ["package_image_4", "Package Image 4", "image/*"],
  ["additional_file_1", "Additional File 1", ".pdf,.doc,.docx,image/*"],
  ["additional_file_2", "Additional File 2", ".pdf,.doc,.docx,image/*"],
  ["additional_file_3", "Additional File 3", ".pdf,.doc,.docx,image/*"],
];

const SOURCES = ["whatsapp", "instagram", "web", "phone", "walk-in", "email", "other"];

const valuesFromOrder = (order?: Order): OrderFormValues => ({
  client_id: order?.client_id ? String(order.client_id) : "",
  source: order?.source ?? "",
  source_contact: order?.source_contact ?? "",
  source_notes: order?.source_notes ?? "",
  sender_name: order?.sender_name ?? "",
  sender_phone: order?.sender_phone ?? "",
  sender_email: order?.sender_email ?? "",
  pickup_address: order?.pickup_address ?? "",
  receiver_name: order?.receiver_name ?? "",
  receiver_phone: order?.receiver_phone ?? "",
  delivery_address: order?.delivery_address ?? "",
  item_description: order?.item_description ?? "",
  quantity: order?.quantity ? String(order.quantity) : "1",
  item_size: order?.item_size ?? "",
  weight: order?.weight ? String(order.weight) : "",
  price: order ? String(order.price) : "",
  payment_method: order?.payment_method ?? "",
  amount_received: order?.amount_received !== null && order?.amount_received !== undefined ? String(order.amount_received) : "",
  mark_remitted: false,
  is_failed_delivery: order?.is_failed_delivery ?? false,
  status: order?.status ?? "pending",
  priority_level: order?.priority_level ?? "normal",
  pickup_date: toDateInput(order?.pickup_date),
  delivery_date: toDateInput(order?.delivery_date),
  notes: order?.notes ?? "",
  stock_items: (order?.stock_items ?? []).map((item) => ({
    client_stock_id: item.client_stock_id ? String(item.client_stock_id) : "",
    quantity: item.quantity,
  })),
});

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:col-span-2 mt-6 first:mt-0">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white pb-2 border-b-2 border-gray-200 dark:border-gray-700">{children}</h3>
    </div>
  );
}

export default function OrderForm({ order, defaultClientId }: { order?: Order; defaultClientId?: string }) {
  const router = useRouter();
  const notify = useNotify();
  const isEdit = !!order;
  const { data: options, isLoading } = useOrderFormOptions();
  const saveOrder = useSaveOrder(order?.id);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { errors },
  } = useForm<OrderFormValues>({ defaultValues: valuesFromOrder(order) });

  const { fields, append, remove, replace } = useFieldArray({ control, name: "stock_items" });

  const [clientId, paymentMethod, amountReceived] = useWatch({ control, name: ["client_id", "payment_method", "amount_received"] });
  const clientStocks = useMemo(() => (clientId ? options?.stock_clients[clientId] ?? [] : []), [clientId, options]);
  const stockLocked = order?.stock_items?.some((item) => item.deducted_at) ?? false;

  useEffect(() => {
    if (!isEdit && clientStocks.length > 0 && fields.length === 0) {
      append({ client_stock_id: "", quantity: 1 });
    }
  }, [clientStocks, fields.length, append, isEdit]);

  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || isEdit || !defaultClientId || !options) return;
    prefilled.current = true;
    handleClientChange(defaultClientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, defaultClientId, isEdit]);

  const handleClientChange = (value: string) => {
    setValue("client_id", value);
    replace([]);
    const client = options?.clients.find((c) => String(c.id) === value);
    if (client) {
      setValue("sender_name", client.name);
      setValue("sender_phone", client.phone ?? "");
      setValue("sender_email", client.email ?? "");
      if (client.pickup_address) setValue("pickup_address", client.pickup_address);
    }
  };

  const onSubmit = async (values: OrderFormValues) => {
    const form = new FormData();
    const { stock_items, mark_remitted, is_failed_delivery, ...rest } = values;

    Object.entries(rest).forEach(([key, value]) => {
      if (isEdit && ["source", "source_contact", "source_notes"].includes(key)) return;
      form.append(key, value === null || value === undefined ? "" : String(value));
    });
    if (paymentMethod !== "cash") form.set("amount_received", "");
    form.append("is_failed_delivery", is_failed_delivery ? "1" : "0");
    if (mark_remitted) form.append("mark_remitted", "1");

    stock_items
      .filter((item) => item.client_stock_id)
      .forEach((item, i) => {
        form.append(`stock_items[${i}][client_stock_id]`, item.client_stock_id);
        form.append(`stock_items[${i}][quantity]`, String(item.quantity || 1));
      });

    FILE_INPUTS.forEach(([name]) => {
      const input = document.getElementById(name) as HTMLInputElement | null;
      const file = input?.files?.[0];
      if (file) form.append(name, file);
    });

    try {
      const saved = await saveOrder.mutateAsync(form);
      notify.success(isEdit ? "Order updated successfully" : "Order created successfully");
      router.push(`/dashboard/orders/${saved.id}`);
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        Object.entries(e.errors).forEach(([field, messages]) => setError(field as keyof OrderFormValues, { message: messages[0] }));
      }
      notify.error(errorMessage(e));
    }
  };

  if (isLoading) return <LoadingSpinner fullScreen={false} />;

  const fieldError = (name: keyof OrderFormValues) =>
    errors[name]?.message ? <p className="mt-1 text-xs text-red-600">{String(errors[name]?.message)}</p> : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 rounded-lg p-4 bg-primary/5 border-2 border-primary/40">
          <label className="label">Select Client (Optional)</label>
          <select className="input" value={clientId} onChange={(e) => handleClientChange(e.target.value)}>
            <option value="">-- Select a client to auto-fill pickup details --</option>
            {options?.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.company_name ? ` (${c.company_name})` : ""}{c.phone ? ` - ${c.phone}` : ""}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">Selecting a client fills in the pickup information below.</p>
        </div>

        {!isEdit && (
          <>
            <SectionTitle>Order Source</SectionTitle>
            <div>
              <label className="label">Order Source <span className="text-red-500">*</span></label>
              <select className="input" {...register("source", { required: "Order source is required" })}>
                <option value="">Select source</option>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>{statusLabel(s)}</option>
                ))}
              </select>
              {fieldError("source")}
            </div>
            <div>
              <label className="label">Source Contact</label>
              <input className="input" placeholder="Phone, handle or email" {...register("source_contact")} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Source Notes</label>
              <textarea rows={2} className="input" {...register("source_notes")} />
            </div>
          </>
        )}

        <SectionTitle>Pickup Information</SectionTitle>
        <div>
          <label className="label">Sender Name <span className="text-red-500">*</span></label>
          <input className="input" {...register("sender_name", { required: "Sender name is required" })} />
          {fieldError("sender_name")}
        </div>
        <div>
          <label className="label">Sender Phone <span className="text-red-500">*</span></label>
          <input className="input" {...register("sender_phone", { required: "Sender phone is required" })} />
          {fieldError("sender_phone")}
        </div>
        <div>
          <label className="label">Sender Email</label>
          <input type="email" className="input" {...register("sender_email")} />
          {fieldError("sender_email")}
        </div>
        <div className="md:col-span-2">
          <label className="label">Pickup Address <span className="text-red-500">*</span></label>
          <textarea rows={2} className="input" {...register("pickup_address", { required: "Pickup address is required" })} />
          {fieldError("pickup_address")}
        </div>

        <SectionTitle>Drop-off Information</SectionTitle>
        <div className="md:col-span-2">
          <label className="label">Drop-off Address <span className="text-red-500">*</span></label>
          <textarea rows={2} className="input" {...register("delivery_address", { required: "Drop-off address is required" })} />
          {fieldError("delivery_address")}
        </div>
        <div>
          <label className="label">Receiver Name <span className="text-red-500">*</span></label>
          <input className="input" {...register("receiver_name", { required: "Receiver name is required" })} />
          {fieldError("receiver_name")}
        </div>
        <div>
          <label className="label">Receiver Phone <span className="text-red-500">*</span></label>
          <input className="input" {...register("receiver_phone", { required: "Receiver phone is required" })} />
          {fieldError("receiver_phone")}
        </div>

        <SectionTitle>Package Details</SectionTitle>
        <div className="md:col-span-2">
          <label className="label">Item Description <span className="text-red-500">*</span></label>
          <textarea rows={2} className="input" {...register("item_description", { required: "Item description is required" })} />
          {fieldError("item_description")}
        </div>
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="label">Quantity</label>
            <input type="number" min={1} className="input" {...register("quantity")} />
          </div>
          <div>
            <label className="label">Size</label>
            <input className="input" placeholder="Small, Medium, Large, or dimensions" {...register("item_size")} />
          </div>
          <div>
            <label className="label">Weight (kg)</label>
            <input type="number" step="0.01" min={0} className="input" {...register("weight")} />
          </div>
        </div>

        {(clientStocks.length > 0 || stockLocked) && (
          <>
            <SectionTitle>Products Going Out</SectionTitle>
            <div className="md:col-span-2">
              {stockLocked ? (
                <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Stock has already been deducted for this order.</p>
                  <ul className="text-sm text-gray-900 dark:text-gray-100 space-y-1">
                    {order?.stock_items?.map((item) => (
                      <li key={item.id}>{item.product_name}: {item.quantity}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-3">
                        <select className="input" {...register(`stock_items.${index}.client_stock_id`)}>
                          <option value="">Select product</option>
                          {clientStocks.map((stock) => (
                            <option key={stock.id} value={stock.id}>
                              {stock.product_name} ({stock.quantity} left)
                            </option>
                          ))}
                        </select>
                        <input type="number" min={1} className="input w-28" {...register(`stock_items.${index}.quantity`, { valueAsNumber: true })} />
                        <button type="button" onClick={() => remove(index)} className="p-2 text-gray-400 hover:text-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => append({ client_stock_id: "", quantity: 1 })} className="btn-secondary mt-3">
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                  <p className="mt-1 text-xs text-gray-500">Quantities are deducted from the client&apos;s stock once the remittance is marked.</p>
                </>
              )}
            </div>
          </>
        )}

        <SectionTitle>Pricing & Payment</SectionTitle>
        <div>
          <label className="label">Price (₦) <span className="text-red-500">*</span></label>
          <input type="number" step="0.01" min={0} className="input" {...register("price", { required: "Price is required" })} />
          {fieldError("price")}
        </div>
        <div>
          <label className="label">Payment Method</label>
          <select className="input" {...register("payment_method")}>
            <option value="">Not specified</option>
            {["cash", "transfer", "pos", "online", "credit"].map((m) => (
              <option key={m} value={m}>{m === "pos" ? "POS" : statusLabel(m)}</option>
            ))}
          </select>
        </div>
        {paymentMethod === "cash" && (
          <div>
            <label className="label">Amount Received (₦)</label>
            <input type="number" step="0.01" min={0} className="input" {...register("amount_received")} />
            <p className="mt-1 text-xs text-gray-500">Cash collected from the customer on delivery</p>
          </div>
        )}
        {!isEdit && paymentMethod === "cash" && Number(amountReceived) > 0 && (
          <div className="md:col-span-2 rounded-lg p-4 bg-primary/5 border border-primary/40">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-primary" {...register("mark_remitted")} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Mark as Remitted</span>
            </label>
            <p className="mt-1 ml-7 text-xs text-gray-500">Check this if the cash has already been handed over.</p>
          </div>
        )}
        <div className="md:col-span-2 rounded-lg p-4 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-red-600" {...register("is_failed_delivery")} />
            <span className="text-sm font-medium text-red-700 dark:text-red-300">Failed Delivery</span>
          </label>
        </div>

        <SectionTitle>Status & Schedule</SectionTitle>
        <div>
          <label className="label">Status <span className="text-red-500">*</span></label>
          <select className="input" {...register("status")}>
            {(options?.statuses ?? []).map((s) => (
              <option key={s} value={s}>{statusLabel(s)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Priority Level <span className="text-red-500">*</span></label>
          <select className="input" {...register("priority_level")}>
            <option value="normal">Normal</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label className="label">Pickup Date</label>
          <input type="date" className="input" {...register("pickup_date")} />
        </div>
        <div>
          <label className="label">Drop-off Date</label>
          <input type="date" className="input" {...register("delivery_date")} />
        </div>
        <div className="md:col-span-2">
          <label className="label">Notes</label>
          <textarea rows={3} className="input" {...register("notes")} />
        </div>

        <SectionTitle>Images & Files</SectionTitle>
        {FILE_INPUTS.map(([name, label, accept]) => (
          <div key={name}>
            <label htmlFor={name} className="label">{label}</label>
            <input id={name} type="file" accept={accept} className="input file:mr-3 file:border-0 file:bg-primary/10 file:text-primary file:rounded file:px-2 file:py-1" />
            {order?.files[name] && (
              <a href={order.files[name] ?? undefined} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-primary hover:underline">
                View current file
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-end gap-3">
        <Link href={isEdit ? `/dashboard/orders/${order.id}` : "/dashboard/orders"} className="btn-secondary px-6">
          Cancel
        </Link>
        <button type="submit" disabled={saveOrder.isPending} className="btn-primary px-6">
          {saveOrder.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "Update Order" : "Create Order"}
        </button>
      </div>
    </form>
  );
}
