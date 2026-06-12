import { decodeInvoicePayload, type InvoiceData } from "@/lib/invoice";
import { getInvoice } from "@/lib/invoice-store";

import { InvoicePageClient } from "./invoice-page-client";

interface InvoicePageProps {
  params: { id: string };
  searchParams: { data?: string };
}

async function resolveInvoice(
  id: string,
  encodedData?: string,
): Promise<InvoiceData | null> {
  if (encodedData) {
    const decoded = decodeInvoicePayload(encodedData);
    if (decoded) return decoded;
  }

  const stored = getInvoice(id);
  if (stored) {
    const { id: _id, createdAt: _createdAt, ...invoice } = stored;
    return invoice;
  }

  return null;
}

export default async function InvoicePage({
  params,
  searchParams,
}: InvoicePageProps) {
  const invoice = await resolveInvoice(params.id, searchParams.data);

  if (!invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <div className="max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold">发票不存在</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            该链接可能已失效，请联系商家重新发送账单邮件。
          </p>
        </div>
      </div>
    );
  }

  return <InvoicePageClient invoiceId={params.id} invoice={invoice} />;
}
