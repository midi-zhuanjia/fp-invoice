import { getInvoice } from "@/lib/invoice-store";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const invoice = getInvoice(params.id);

  if (!invoice) {
    return Response.json({ error: "发票不存在或已过期" }, { status: 404 });
  }

  return Response.json(invoice);
}
