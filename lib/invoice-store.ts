import type { StoredInvoice } from "@/lib/invoice";

const invoices = new Map<string, StoredInvoice>();

export function saveInvoice(invoice: StoredInvoice): void {
  invoices.set(invoice.id, invoice);
}

export function getInvoice(id: string): StoredInvoice | undefined {
  return invoices.get(id);
}
