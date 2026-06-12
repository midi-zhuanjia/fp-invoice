import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import type { InvoiceData } from "@/lib/invoice";
import { formatTokenAmount, formatUsdRate } from "@/lib/web3/conversion";

interface InvoicePdfOptions {
  invoice: InvoiceData;
  invoiceNumber: string;
  invoiceDate: string;
  backgroundSrc: string;
}

function createText(
  text: string,
  style: Partial<CSSStyleDeclaration> = {},
): HTMLDivElement {
  const div = document.createElement("div");
  div.textContent = text || "—";
  Object.assign(div.style, style);
  return div;
}

function createInvoiceTemplate({
  invoice,
  invoiceNumber,
  invoiceDate,
  backgroundSrc,
}: InvoicePdfOptions): HTMLElement {
  const root = document.createElement("article");

  Object.assign(root.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: "794px",
    height: "1086px",
    overflow: "hidden",
    backgroundColor: "#ffffff",
    backgroundImage: `url("${backgroundSrc}")`,
    backgroundSize: "100% 100%",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    color: "#0f172a",
    fontFamily:
      'Inter, "Microsoft YaHei", "PingFang SC", Arial, sans-serif',
  } satisfies Partial<CSSStyleDeclaration>);

  const add = (child: HTMLElement) => root.appendChild(child);

  add(
    createText("COMMERCIAL INVOICE", {
      position: "absolute",
      left: "86px",
      top: "180px",
      fontSize: "28px",
      fontWeight: "700",
      letterSpacing: "2px",
      color: "#0f2a44",
    }),
  );

  add(
    createText(invoiceNumber, {
      position: "absolute",
      right: "88px",
      top: "180px",
      fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
      fontSize: "16px",
      fontWeight: "700",
      color: "#0f2a44",
      textAlign: "right",
    }),
  );

  add(
    createText(invoiceDate, {
      position: "absolute",
      right: "88px",
      top: "210px",
      fontSize: "14px",
      color: "#475569",
      textAlign: "right",
    }),
  );

  add(
    createText("客户邮箱", {
      position: "absolute",
      left: "86px",
      top: "285px",
      fontSize: "13px",
      fontWeight: "700",
      color: "#0f2a44",
    }),
  );

  add(
    createText(invoice.clientEmail, {
      position: "absolute",
      left: "86px",
      top: "312px",
      width: "292px",
      fontSize: "16px",
      color: "#0f172a",
      wordBreak: "break-word",
    }),
  );

  add(
    createText("商家收款地址", {
      position: "absolute",
      left: "420px",
      top: "285px",
      fontSize: "13px",
      fontWeight: "700",
      color: "#0f2a44",
    }),
  );

  add(
    createText(invoice.merchantAddress, {
      position: "absolute",
      left: "420px",
      top: "312px",
      width: "288px",
      fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
      fontSize: "12px",
      lineHeight: "1.5",
      color: "#0f172a",
      wordBreak: "break-all",
    }),
  );

  const tableTop = 450;
  const tableLeft = 86;
  const tableWidth = 622;

  add(
    createText("", {
      position: "absolute",
      left: `${tableLeft}px`,
      top: `${tableTop}px`,
      width: `${tableWidth}px`,
      height: "1px",
      backgroundColor: "#5aa7bd",
    }),
  );

  [
    ["服务项目", tableLeft, 420],
    ["数量", tableLeft + 430, 56],
    ["链", tableLeft + 496, 58],
    ["代币", tableLeft + 564, 58],
  ].forEach(([label, left, width]) => {
    add(
      createText(String(label), {
        position: "absolute",
        left: `${left}px`,
        top: `${tableTop - 30}px`,
        width: `${width}px`,
        fontSize: "12px",
        fontWeight: "700",
        color: "#0f2a44",
        textAlign: left === tableLeft ? "left" : "center",
      }),
    );
  });

  add(
    createText(invoice.description, {
      position: "absolute",
      left: `${tableLeft}px`,
      top: `${tableTop + 24}px`,
      width: "410px",
      fontSize: "16px",
      lineHeight: "1.5",
      color: "#0f172a",
      wordBreak: "break-word",
    }),
  );

  add(
    createText(invoice.quantity || "1", {
      position: "absolute",
      left: `${tableLeft + 430}px`,
      top: `${tableTop + 24}px`,
      width: "56px",
      fontSize: "16px",
      textAlign: "center",
    }),
  );

  add(
    createText(invoice.chain, {
      position: "absolute",
      left: `${tableLeft + 496}px`,
      top: `${tableTop + 24}px`,
      width: "58px",
      fontSize: "14px",
      textAlign: "center",
    }),
  );

  add(
    createText(invoice.token, {
      position: "absolute",
      left: `${tableLeft + 564}px`,
      top: `${tableTop + 24}px`,
      width: "58px",
      fontSize: "16px",
      fontWeight: "700",
      textAlign: "center",
    }),
  );

  add(
    createText("", {
      position: "absolute",
      left: `${tableLeft}px`,
      top: `${tableTop + 94}px`,
      width: `${tableWidth}px`,
      height: "1px",
      backgroundColor: "#dbe7eb",
    }),
  );

  add(
    createText("应付金额", {
      position: "absolute",
      right: "88px",
      top: "650px",
      fontSize: "13px",
      fontWeight: "700",
      color: "#0f2a44",
      textAlign: "right",
    }),
  );

  add(
    createText(`$${invoice.amountUSD || "0.00"} USD`, {
      position: "absolute",
      right: "88px",
      top: "678px",
      fontSize: "34px",
      fontWeight: "800",
      color: "#0f2a44",
      textAlign: "right",
    }),
  );

  if (invoice.tokenAmount) {
    add(
      createText(
        `≈ ${formatTokenAmount(invoice.tokenAmount)} ${invoice.token || ""}`,
        {
          position: "absolute",
          right: "88px",
          top: "724px",
          fontSize: "18px",
          fontWeight: "700",
          color: "#475569",
          textAlign: "right",
        },
      ),
    );
  }

  if (invoice.tokenUsdRate) {
    add(
      createText(
        `1 ${invoice.token || ""} = $${formatUsdRate(invoice.tokenUsdRate)}`,
        {
          position: "absolute",
          right: "88px",
          top: "752px",
          fontSize: "12px",
          color: "#64748b",
          textAlign: "right",
        },
      ),
    );
  }

  return root;
}

async function renderElementToPdf(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  pdf.addImage(
    imgData,
    "PNG",
    0,
    0,
    pdf.internal.pageSize.getWidth(),
    pdf.internal.pageSize.getHeight(),
  );

  pdf.save(filename);
}

export async function downloadInvoicePdf(
  element: HTMLElement,
  filename: string,
  options?: InvoicePdfOptions,
): Promise<void> {
  if (options) {
    const template = createInvoiceTemplate(options);
    document.body.appendChild(template);

    try {
      await renderElementToPdf(template, filename);
    } finally {
      template.remove();
    }

    return;
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * contentWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, "PNG", margin, position, contentWidth, imgHeight);
  heightLeft -= pageHeight - margin * 2;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, position, contentWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;
  }

  pdf.save(filename);
}
