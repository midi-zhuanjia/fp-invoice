export interface InvoiceData {
  clientEmail: string;
  amountUSD: string;
  tokenAmount: string;
  tokenUsdRate: string;
  rateUpdatedAt: string;
  chain: string;
  token: string;
  description: string;
  quantity: string;
  merchantAddress: string;
}

export interface StoredInvoice extends InvoiceData {
  id: string;
  createdAt: string;
}

export const INITIAL_INVOICE: InvoiceData = {
  clientEmail: "",
  amountUSD: "",
  tokenAmount: "",
  tokenUsdRate: "",
  rateUpdatedAt: "",
  chain: "Ethereum",
  token: "USDC",
  description: "",
  quantity: "1",
  merchantAddress: "",
};

export function encodeInvoicePayload(invoice: InvoiceData): string {
  return Buffer.from(JSON.stringify(invoice), "utf-8").toString("base64url");
}

export function decodeInvoicePayload(encoded: string): InvoiceData | null {
  try {
    const json = Buffer.from(encoded, "base64url").toString("utf-8");
    const parsed = JSON.parse(json) as Partial<InvoiceData>;
    return {
      ...INITIAL_INVOICE,
      ...parsed,
      quantity: parsed.quantity ?? "1",
      tokenAmount: parsed.tokenAmount ?? "",
      tokenUsdRate: parsed.tokenUsdRate ?? "",
      rateUpdatedAt: parsed.rateUpdatedAt ?? "",
    };
  } catch {
    return null;
  }
}
