"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useAssignRider, useDeleteOrder, useOrder, useOrderFormOptions, useUpdateOrderStatus } from "@/src/api/orders";
import { formatDate, formatNaira, statusLabel } from "@/src/helpers/format";
import { errorMessage } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import StatusBadge from "@/src/components/atoms/StatusBadge";
import { OrderStatus } from "@/src/types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 break-words">{value}</p>
    </div>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const notify = useNotify();
  const { data: order, isLoading, isError } = useOrder(id);
  const { data: options } = useOrderFormOptions();
  const updateStatus = useUpdateOrderStatus(id);
  const assignRider = useAssignRider(id);
  const deleteOrder = useDeleteOrder();

  if (isLoading) return <LoadingSpinner />;
  if (isError || !order) {
    return (
      <div className="card p-8 text-center text-gray-600 dark:text-gray-300">
        Order not found. <Link href="/dashboard/orders" className="text-primary hover:underline">Back to orders</Link>
      </div>
    );
  }

  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
      notify.success(message);
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete order #${order.order_number}? This cannot be undone.`)) return;
    await run(() => deleteOrder.mutateAsync(order.id), "Order deleted");
    router.replace("/dashboard/orders");
  };

  const images = ["package_image_1", "package_image_2", "package_image_3", "package_image_4"].map((k) => order.files[k]).filter(Boolean) as string[];
  const attachments = ["additional_file_1", "additional_file_2", "additional_file_3"].map((k) => order.files[k]).filter(Boolean) as string[];
  const stockDeducted = order.stock_items?.some((item) => item.deducted_at);

  return (
    <div className="space-y-6">
      <DocumentTitle title={`Order #${order.order_number}`} />
      <Link href="/dashboard/orders" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order #{order.order_number}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Created by {order.creator ?? "System"} on {formatDate(order.created_at, true)}
              </p>
              {order.source && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Source: <span className="font-medium capitalize">{order.source}</span>
                  {order.source_contact && <span className="ml-2 text-gray-500">{order.source_contact}</span>}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={order.status} />
              {order.is_failed_delivery && <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Failed Delivery</span>}
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <Section title="Pickup Information">
              <Field label="Sender" value={order.sender_name} />
              <Field label="Phone" value={order.sender_phone} />
              <Field label="Email" value={order.sender_email} />
              <Field label="Pickup Address" value={order.pickup_address} />
              <Field label="Pickup Zone" value={order.pickup_zone} />
              <Field label="Pickup Date" value={order.pickup_date ? formatDate(order.pickup_date, true) : null} />
            </Section>

            <Section title="Drop-off Information">
              <Field label="Receiver" value={order.receiver_name} />
              <Field label="Phone" value={order.receiver_phone} />
              <Field label="Drop-off Address" value={order.delivery_address} />
              <Field label="Delivery Zone" value={order.delivery_zone} />
              <Field label="Drop-off Date" value={order.delivery_date ? formatDate(order.delivery_date, true) : null} />
            </Section>

            <Section title="Package Details">
              <Field label="Item Description" value={order.item_description} />
              <div className="grid grid-cols-3 gap-4">
                <Field label="Size" value={order.item_size} />
                <Field label="Weight" value={order.weight ? `${order.weight} kg` : null} />
                <Field label="Quantity" value={order.quantity} />
              </div>
            </Section>

            <Section title="Pricing & Payment">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Price</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{formatNaira(order.price)}</p>
              </div>
              <Field label="Payment Method" value={order.payment_method ? statusLabel(order.payment_method) : null} />
              {order.amount_received !== null && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount Received</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{formatNaira(order.amount_received)}</p>
                  <p className="text-xs text-gray-500">
                    To remit: <span className="font-medium text-primary">{formatNaira(order.to_remit)}</span>
                  </p>
                  {order.remitted_at && <p className="text-xs text-green-600">Remitted on {formatDate(order.remitted_at)}</p>}
                </div>
              )}
              <Field label="Distance" value={order.distance ? `${order.distance} km` : null} />
              <Field label="Priority" value={order.priority_level ? statusLabel(order.priority_level) : null} />
            </Section>

            {order.stock_items && order.stock_items.length > 0 && (
              <Section title="Products Going Out">
                {order.stock_items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm text-gray-900 dark:text-gray-100">
                    <span>{item.product_name}</span>
                    <span>{item.quantity}</span>
                  </div>
                ))}
                <p className="text-xs text-gray-500">
                  {stockDeducted ? "Deducted from client stock" : "Will be deducted from client stock once remitted"}
                </p>
              </Section>
            )}

            {order.notes && (
              <Section title="Notes">
                <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-line">{order.notes}</p>
              </Section>
            )}
          </div>

          {(images.length > 0 || attachments.length > 0) && (
            <div className="px-6 pb-6 space-y-4">
              {images.length > 0 && (
                <Section title="Package Images">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {images.map((src) => (
                      <a key={src} href={src} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="Package" className="w-full h-28 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                      </a>
                    ))}
                  </div>
                </Section>
              )}
              {attachments.length > 0 && (
                <Section title="Attachments">
                  {attachments.map((src, i) => (
                    <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="block text-sm text-primary hover:underline">
                      Attachment {i + 1}
                    </a>
                  ))}
                </Section>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Actions</h2>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={order.status}
                disabled={updateStatus.isPending}
                onChange={(e) => run(() => updateStatus.mutateAsync(e.target.value as OrderStatus), "Status updated")}
              >
                {(options?.statuses ?? [order.status]).map((status) => (
                  <option key={status} value={status}>{statusLabel(status)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Rider</label>
              <select
                className="input"
                value={order.rider_id ?? ""}
                disabled={assignRider.isPending}
                onChange={(e) => run(() => assignRider.mutateAsync(e.target.value ? Number(e.target.value) : null), "Rider updated")}
              >
                <option value="">Unassigned</option>
                {options?.riders.map((rider) => (
                  <option key={rider.id} value={rider.id}>{rider.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Link href={`/dashboard/orders/${order.id}/edit`} className="btn-primary flex-1">
                <Pencil className="w-4 h-4" /> Edit
              </Link>
              <button onClick={handleDelete} className="btn-secondary text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {order.client && (
            <div className="card p-6 space-y-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Client</h2>
              <p className="text-sm text-gray-900 dark:text-gray-100">{order.client.name}</p>
              {order.client.company_name && <p className="text-sm text-gray-500">{order.client.company_name}</p>}
              {order.client.pod_remittance_enabled && (
                <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary">Daily remittance</span>
              )}
            </div>
          )}

          {order.rider && (
            <div className="card p-6 space-y-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Assigned Rider</h2>
              <p className="text-sm text-gray-900 dark:text-gray-100">{order.rider.name}</p>
              {order.rider.phone && (
                <a href={`tel:${order.rider.phone}`} className="text-sm text-primary hover:underline">{order.rider.phone}</a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
