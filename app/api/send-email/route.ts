import { Resend } from "resend";

import { buildInvoiceEmailHtml } from "@/lib/email-template";
import { encodeInvoicePayload, type InvoiceData } from "@/lib/invoice";
import { saveInvoice } from "@/lib/invoice-store";

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

interface SendEmailBody {
  invoiceId: string;
  invoiceData: InvoiceData;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SendEmailBody;
    const { invoiceId, invoiceData } = body;

    if (!invoiceId || !invoiceData) {
      return Response.json({ error: "缺少发票信息" }, { status: 400 });
    }

    if (!invoiceData.clientEmail?.trim()) {
      return Response.json({ error: "客户邮箱不能为空" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return Response.json(
        { error: "未配置 RESEND_API_KEY 环境变量" },
        { status: 500 },
      );
    }

    const fromEmail =
      process.env.RESEND_FROM_EMAIL ?? "跨境发票 <onboarding@resend.dev>";

    saveInvoice({
      id: invoiceId,
      ...invoiceData,
      createdAt: new Date().toISOString(),
    });

    const encodedData = encodeInvoicePayload(invoiceData);
    const payUrl = `${APP_BASE_URL}/invoice/${invoiceId}?data=${encodedData}`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: invoiceData.clientEmail.trim(),
      subject: `商业发票 · $${invoiceData.amountUSD || "0"} ${invoiceData.token || "USDC"}`,
      html: buildInvoiceEmailHtml({
        invoiceId,
        invoice: invoiceData,
        payUrl,
      }),
    });

    if (error) {
      console.error("[send-email]", error);
      return Response.json(
        { error: error.message ?? "邮件发送失败" },
        { status: 500 },
      );
    }

    return Response.json({ success: true, invoiceId, payUrl });
  } catch (error) {
    console.error("[send-email]", error);
    return Response.json({ error: "邮件发送失败" }, { status: 500 });
  }
}
