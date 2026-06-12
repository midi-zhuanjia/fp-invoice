import { Resend } from "resend";

import type { InvoiceData } from "@/lib/invoice";
import { buildReceiptEmailHtml } from "@/lib/receipt-email-template";

const RECEIPT_SUBJECT = "【收据】您有一笔跨境账单已结算成功";

interface SendReceiptBody {
  invoiceId: string;
  invoiceData: InvoiceData;
  txHash: string;
}

// 1. 定义统一的 CORS 响应头
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Demo 阶段允许所有源，生产环境建议替换为具体域名
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 2. 处理浏览器的 OPTIONS 预检请求（CORS 核心）
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// 3. 核心 POST 逻辑
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SendReceiptBody;
    const { invoiceId, invoiceData, txHash } = body;

    // 所有的错误返回也必须带上 corsHeaders，否则一旦报错前端依然会报 CORS 错误
    if (!invoiceId || !invoiceData || !txHash?.trim()) {
      return Response.json({ error: "缺少收据信息" }, { status: 400, headers: corsHeaders });
    }

    if (!invoiceData.clientEmail?.trim()) {
      return Response.json({ error: "买家邮箱不能为空" }, { status: 400, headers: corsHeaders });
    }

    if (!process.env.RESEND_API_KEY) {
      return Response.json(
        { error: "未配置 RESEND_API_KEY 环境变量" },
        { status: 500, headers: corsHeaders },
      );
    }

    const fromEmail =
      process.env.RESEND_FROM_EMAIL ?? "跨境发票 <onboarding@resend.dev>";
    const resend = new Resend(process.env.RESEND_API_KEY);

    const buyerHtml = buildReceiptEmailHtml({
      invoiceId,
      invoice: invoiceData,
      txHash: txHash.trim(),
      recipientRole: "buyer",
    });

    const buyerResult = await resend.emails.send({
      from: fromEmail,
      to: invoiceData.clientEmail.trim(),
      subject: RECEIPT_SUBJECT,
      html: buyerHtml,
    });

    if (buyerResult.error) {
      console.error("[send-receipt]", buyerResult.error);
      return Response.json(
        {
          error: buyerResult.error?.message ?? "收据邮件发送失败",
        },
        { status: 500, headers: corsHeaders },
      );
    }

    // 成功返回注入 corsHeaders
    return Response.json({
      success: true,
      sentTo: [invoiceData.clientEmail.trim()],
    }, {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error("[send-receipt]", error);
    return Response.json({ error: "收据邮件发送失败" }, { status: 500, headers: corsHeaders });
  }
}