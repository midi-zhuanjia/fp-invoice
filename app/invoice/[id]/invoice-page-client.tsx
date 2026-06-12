"use client";

import confetti from "canvas-confetti";
import { CheckCircle2, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useWaitForTransactionReceipt } from "wagmi";

import { InvoiceReadonlyCard } from "@/components/invoice-readonly-card";
import type { InvoiceData } from "@/lib/invoice";
import { cn } from "@/lib/utils";
import { resolveChainId } from "@/lib/web3/chains";

import { PaymentPanel } from "./payment-panel";

interface InvoicePageClientProps {
  invoiceId: string;
  invoice: InvoiceData;
}

function fireConfetti() {
  const duration = 2500;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: ["#22c55e", "#16a34a", "#facc15", "#3b82f6"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: ["#22c55e", "#16a34a", "#facc15", "#3b82f6"],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.55 },
    colors: ["#22c55e", "#16a34a", "#86efac", "#facc15"],
  });
  frame();
}

export function InvoicePageClient({
  invoiceId,
  invoice,
}: InvoicePageClientProps) {
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const receiptSentRef = useRef(false);

  const targetChainId = resolveChainId(invoice.chain);

  const { isSuccess, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: targetChainId,
  });

  // immediate success flag: if txHash exists, after 15s treat as successful (do not wait on-chain)
  const [immediateSuccess, setImmediateSuccess] = useState(false);

  if (process.env.NODE_ENV !== "production") {
    console.debug("[InvoicePageClient] targetChainId:", targetChainId);
    console.debug("[InvoicePageClient] txHash:", txHash);
    console.debug("[InvoicePageClient] isConfirming:", isConfirming, "isSuccess:", isSuccess);
  }

  const today = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const invoiceNumber = `INV-${invoiceId.slice(0, 8).toUpperCase()}`;

  // When a txHash appears, start a 15s timer and then mark success and send receipt
  useEffect(() => {
    if (!txHash || receiptSentRef.current) return;

    let cancelled = false;
    const id = window.setTimeout(async () => {
      if (cancelled || receiptSentRef.current) return;
      receiptSentRef.current = true;
      setImmediateSuccess(true);
      fireConfetti();

      try {
        const res = await fetch("/api/send-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invoiceId, invoiceData: invoice, txHash }),
        });

        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error ?? "收据邮件发送失败");
        }

        toast.success("支付成功！收据邮件已发送给买家。");
      } catch (err) {
        const message = err instanceof Error ? err.message : "收据邮件发送失败";
        toast.error(message);
      }
    }, 15000);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [txHash, invoiceId, invoice]);

  // removed polling fallback: we now send receipt after 15s regardless of on-chain confirmation

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background/80 px-4 py-4 backdrop-blur-sm md:px-8">
        <div className="mx-auto flex max-w-lg items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight md:text-base">
              对账与支付
            </h1>
            <p className="text-xs text-muted-foreground">
              请核对发票信息后完成链上支付
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-lg flex-col gap-6 p-4 md:p-8">
        {isSuccess && (
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-green-500 bg-green-50 px-6 py-8 text-center shadow-sm",
              "animate-in fade-in zoom-in-95 duration-500 dark:bg-green-950/30",
            )}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white shadow-lg">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-green-700 dark:text-green-400">
              支付成功！
            </p>
            <p className="text-sm text-green-800/80 dark:text-green-300/80">
              链上交易已确认，结算收据正在发送至买卖双方邮箱。
            </p>
            {txHash && (
              <p className="mt-1 max-w-full break-all font-mono text-xs text-green-700/70 dark:text-green-400/70">
                Tx Hash: {txHash}
              </p>
            )}
          </div>
        )}

        <InvoiceReadonlyCard
          invoiceNumber={invoiceNumber}
          invoiceDate={today}
          invoice={invoice}
        />

        <PaymentPanel
          invoice={invoice}
          txHash={txHash}
          onTxHash={setTxHash}
          isConfirming={isConfirming}
          paymentSuccess={isSuccess}
        />
      </main>
    </div>
  );
}
