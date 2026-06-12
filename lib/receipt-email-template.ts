import type { InvoiceData } from "@/lib/invoice";
import { formatTokenAmount, formatUsdRate } from "@/lib/web3/conversion";
import { getBlockExplorerUrl } from "@/lib/web3/chains";

interface ReceiptEmailParams {
  invoiceId: string;
  invoice: InvoiceData;
  txHash: string;
  recipientRole: "buyer" | "merchant";
}

export function buildReceiptEmailHtml({
  invoiceId,
  invoice,
  txHash,
  recipientRole,
}: ReceiptEmailParams): string {
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

  const blockExplorerUrl = getBlockExplorerUrl(chain, txHash);
  const transactionTime = new Date().toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const headline =
    recipientRole === "buyer"
      ? "恭喜您，账单已成功结算！"
      : "恭喜您，已收到一笔成功结算的跨境账单！";

  const intro =
    recipientRole === "buyer"
      ? "您已完成链上支付，本次跨境商业发票已正式结算。感谢您的及时付款！"
      : "买家已完成链上支付，以下账单已成功结算至您的收款地址，请查收并核对交易记录。";

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>结算收据 ${invoiceId.slice(0, 8)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
          <tr>
            <td style="padding:32px 32px 24px;background:#16a34a;color:#ffffff;">
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;opacity:0.85;">Payment Receipt</p>
              <h1 style="margin:0;font-size:24px;font-weight:700;">${headline}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3f3f46;">
                ${intro}
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 12px;font-size:13px;color:#15803d;text-transform:uppercase;letter-spacing:0.05em;">结算金额</p>
                    <p style="margin:0;font-size:32px;font-weight:700;color:#166534;">$${amount} <span style="font-size:16px;font-weight:500;color:#15803d;">USD</span></p>
                    ${tokenAmount ? `<p style="margin:8px 0 0;font-size:16px;font-weight:600;color:#166534;">≈ ${tokenAmount} ${token}</p>` : ""}
                    ${tokenRate ? `<p style="margin:6px 0 0;font-size:12px;color:#15803d;">1 ${token} = $${tokenRate}</p>` : ""}
                    <p style="margin:8px 0 0;font-size:14px;color:#15803d;">网络：${chain}</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f4f4f5;font-size:14px;color:#71717a;width:120px;">服务项目</td>
                  <td style="padding:12px 0;border-bottom:1px solid #f4f4f5;font-size:14px;color:#18181b;">${description}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f4f4f5;font-size:14px;color:#71717a;vertical-align:top;">买家邮箱</td>
                  <td style="padding:12px 0;border-bottom:1px solid #f4f4f5;font-size:14px;color:#18181b;">${invoice.clientEmail || "—"}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f4f4f5;font-size:14px;color:#71717a;vertical-align:top;">结算时间</td>
                  <td style="padding:12px 0;border-bottom:1px solid #f4f4f5;font-size:13px;color:#18181b;font-family:ui-monospace,monospace;">${transactionTime}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f4f4f5;font-size:14px;color:#71717a;vertical-align:top;">交易哈希</td>
                  <td style="padding:12px 0;border-bottom:1px solid #f4f4f5;font-size:12px;color:#18181b;font-family:ui-monospace,monospace;word-break:break-all;overflow-wrap:break-word;">${txHash}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0;font-size:14px;color:#71717a;">区块浏览器</td>
                  <td style="padding:12px 0;"><a href="${blockExplorerUrl}" style="display:inline-block;background:#18181b;color:#fafafa;text-decoration:none;font-size:13px;font-weight:600;padding:8px 16px;border-radius:4px;">查看交易详情</a></td>
                </tr>
              </table>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#3f3f46;text-align:center;">
                🎉 跨境账单结算成功，祝合作愉快！
              </p>
              <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#a1a1aa;text-align:center;">
                发票编号：${invoiceId}
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
