import type { InvoiceData } from "@/lib/invoice";
import { formatTokenAmount, formatUsdRate } from "@/lib/web3/conversion";

interface InvoiceEmailParams {
  invoiceId: string;
  invoice: InvoiceData;
  payUrl: string;
}

export function buildInvoiceEmailHtml({
  invoiceId,
  invoice,
  payUrl,
}: InvoiceEmailParams): string {
  const amount = invoice.amountUSD || "0";
  const token = invoice.token || "USDC";
  const tokenAmount = invoice.tokenAmount
    ? formatTokenAmount(invoice.tokenAmount)
    : "";
  const tokenRate = invoice.tokenUsdRate
    ? formatUsdRate(invoice.tokenUsdRate)
    : "";
  const chain = invoice.chain || "Ethereum";
  const description = invoice.description || "—";
  const merchantAddress = invoice.merchantAddress || "—";

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>商业发票 ${invoiceId.slice(0, 8)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
          <tr>
            <td style="padding:32px 32px 24px;background:#18181b;color:#fafafa;">
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;opacity:0.7;">Commercial Invoice</p>
              <h1 style="margin:0;font-size:24px;font-weight:700;">您有一笔待支付账单</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3f3f46;">
                商家已向您发送一张跨境商业发票，请核对以下信息并完成支付。
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 12px;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">应付金额</p>
                    <p style="margin:0;font-size:32px;font-weight:700;color:#18181b;">$${amount} <span style="font-size:16px;font-weight:500;color:#71717a;">USD</span></p>
                    ${tokenAmount ? `<p style="margin:8px 0 0;font-size:16px;font-weight:600;color:#18181b;">≈ ${tokenAmount} ${token}</p>` : ""}
                    ${tokenRate ? `<p style="margin:6px 0 0;font-size:12px;color:#71717a;">1 ${token} = $${tokenRate}</p>` : ""}
                    <p style="margin:8px 0 0;font-size:14px;color:#71717a;">网络：${chain}</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f4f4f5;font-size:14px;color:#71717a;width:100px;">服务项目</td>
                  <td style="padding:12px 0;border-bottom:1px solid #f4f4f5;font-size:14px;color:#18181b;">${description}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0;font-size:14px;color:#71717a;vertical-align:top;">收款地址</td>
                  <td style="padding:12px 0;font-size:13px;color:#18181b;font-family:ui-monospace,monospace;word-break:break-all;">${merchantAddress}</td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${payUrl}" style="display:inline-block;background:#18181b;color:#fafafa;text-decoration:none;font-size:16px;font-weight:600;padding:14px 32px;border-radius:8px;">
                      查看发票并支付
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#a1a1aa;text-align:center;">
                发票编号：${invoiceId}<br />
                如按钮无法点击，请复制以下链接到浏览器打开：<br />
                <span style="word-break:break-all;">${payUrl}</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
