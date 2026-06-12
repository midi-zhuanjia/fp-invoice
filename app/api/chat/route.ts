import { deepseek } from "@ai-sdk/deepseek";
import { streamObject } from "ai";

import { invoiceParseSchema } from "@/lib/invoice-schema";

const SYSTEM_PROMPT = `你是一个跨境发票解析助手。用户会用大白话描述一笔发票或账单，你必须将信息解析为严格的 JSON 对象。

请从用户描述中提取以下字段：
- clientEmail: 客户邮箱；若未提及则返回空字符串 ""
- amountUSD: 数字类型的美元等值金额（仅数值，不含货币符号）
- chain: 区块链网络，仅限 Ethereum、Base、Sepolia；未指定时默认 "Ethereum"
- token: 代币符号，如 USDC、USDT；未指定时默认 "USDC"
- description: 服务或商品描述；可包含客户名称或业务说明

重要：在新的用户消息中，如果用户没有重新指定某个字段（如金额、链、代币等），就保持之前已解析的值，只更新用户明确提到的字段。这样可以让多轮对话中的信息保持连贯。

示例输入：给客户A test@input.com 开 500 USDC 账单
示例 JSON 输出：
{
  "clientEmail": "test@input.com",
  "amountUSD": 500,
  "chain": "Ethereum",
  "token": "USDC",
  "description": "客户A 账单"
}

只输出符合 schema 的 json 数据，不要输出其他内容。`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message =
      typeof body === "string"
        ? body
        : typeof body?.message === "string"
          ? body.message
          : "";

    if (!message.trim()) {
      return Response.json({ error: "消息不能为空" }, { status: 400 });
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return Response.json(
        { error: "未配置 DEEPSEEK_API_KEY 环境变量" },
        { status: 500 },
      );
    }

    const result = streamObject({
      model: deepseek("deepseek-chat"),
      schema: invoiceParseSchema,
      system: SYSTEM_PROMPT,
      prompt: message,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[chat]", error);
    return Response.json({ error: "发票解析失败" }, { status: 500 });
  }
}
