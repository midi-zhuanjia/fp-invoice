import type { InvoiceData } from "@/lib/invoice";

export const SAMPLE_INVOICE_BASIC: InvoiceData = {
  clientEmail: "client@example.com",
  amountUSD: "1,280.00",
  tokenAmount: "",
  tokenUsdRate: "",
  rateUpdatedAt: "",
  chain: "Base",
  token: "USDC",
  description: "跨境咨询与技术服务",
  quantity: "1",
  merchantAddress: "0x1234567890abcdef1234567890abcdef12345678",
};

export const SAMPLE_INVOICE_MULTIPLE_ITEMS: InvoiceData = {
  clientEmail: "jane.doe@company.com",
  amountUSD: "4,560.00",
  tokenAmount: "",
  tokenUsdRate: "",
  rateUpdatedAt: "",
  chain: "Ethereum",
  token: "USDT",
  description: "网站开发与维护服务（含两个月支持）",
  quantity: "2",
  merchantAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
};

export const SAMPLE_INVOICE_SMALL: InvoiceData = {
  clientEmail: "sales@startup.io",
  amountUSD: "320.50",
  tokenAmount: "",
  tokenUsdRate: "",
  rateUpdatedAt: "",
  chain: "Sepolia",
  token: "USDC",
  description: "API 集成与测试支持",
  quantity: "1",
  merchantAddress: "0xfeedfacecafebeefdeadbeef1234567890abcdef",
};

export const SAMPLE_INVOICE_LIST: InvoiceData[] = [
  SAMPLE_INVOICE_BASIC,
  SAMPLE_INVOICE_MULTIPLE_ITEMS,
  SAMPLE_INVOICE_SMALL,
];
