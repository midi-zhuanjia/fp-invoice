import { z } from "zod";

export const invoiceParseSchema = z.object({
  clientEmail: z.string().describe("客户邮箱地址"),
  amountUSD: z.number().describe("美元等值金额，纯数字"),
  chain: z.string().describe("区块链网络，如 Ethereum、Polygon、Arbitrum"),
  token: z.string().describe("代币符号，如 ETH、USDC、USDT"),
  description: z.string().describe("服务或商品描述"),
});

export type ParsedInvoice = z.infer<typeof invoiceParseSchema>;
