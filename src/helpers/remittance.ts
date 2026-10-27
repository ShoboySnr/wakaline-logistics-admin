import { formatNaira } from "./format";
import { RemittanceData } from "../types";

export const signedNaira = (value: number) => (value < 0 ? `−${formatNaira(Math.abs(value))}` : formatNaira(value));

export const buildRemittanceSummary = (data: RemittanceData) => {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const lines = [`Remittance Summary — ${data.client_name}`, `Date: ${date}`, ""];
  let productCount = 0;

  data.orders.forEach((order, i) => {
    lines.push(`${i + 1}. ${order.delivery_address}${order.is_failed ? " [FAILED DELIVERY]" : ""}`);
    lines.push(
      order.is_failed
        ? `   Delivery Fee charged: ${formatNaira(order.delivery_fee)} | Deducted: −${formatNaira(Math.abs(order.to_remit))}`
        : `   Received: ${formatNaira(order.amount_received)} | Delivery Fee: ${formatNaira(order.delivery_fee)} | Remit: ${formatNaira(order.to_remit)}`,
    );
    if (order.products.length) {
      lines.push(`   Products: ${order.products.map((p) => `${p.product_name} x${p.quantity}`).join(", ")}${order.is_failed ? " (returned)" : ""}`);
      if (!order.is_failed) productCount += order.products.reduce((sum, p) => sum + Number(p.quantity), 0);
    }
  });

  const totalReceived = data.orders.reduce((sum, o) => sum + Number(o.amount_received || 0), 0);
  const totalFees = data.orders.reduce((sum, o) => sum + Number(o.delivery_fee || 0), 0);

  lines.push("", "─".repeat(40), `Total Orders: ${data.orders.length}`);
  if (productCount > 0) lines.push(`Total Products Delivered: ${productCount}`);
  lines.push(`Total Received: ${formatNaira(totalReceived)}`, `Total Delivery Fees: ${formatNaira(totalFees)}`, "", `Total to Remit: ${signedNaira(data.total_remittance)}`);

  if (data.stocks.length) {
    lines.push("", "Stock Left:");
    data.stocks.forEach((stock, i) => lines.push(`${i + 1}. ${stock.product_name}: ${stock.quantity}`));
  }

  return lines.join("\n");
};

export const buildStockSummary = (clientName: string, stocks: { product_name: string; quantity: number }[]) => {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return [`Stock Update — ${clientName}`, `Date: ${date}`, "", ...stocks.map((s, i) => `${i + 1}. ${s.product_name}: ${s.quantity}`)].join("\n");
};
