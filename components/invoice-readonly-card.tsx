import { Building2, Coins, Link2, Mail } from "lucide-react";

import type { InvoiceData } from "@/lib/invoice";
import { formatTokenAmount, formatUsdRate } from "@/lib/web3/conversion";
import { getChainLabel } from "@/lib/web3/chains";
import { cn } from "@/lib/utils";

interface InvoiceReadonlyCardProps {
  invoiceNumber: string;
  invoiceDate: string;
  invoice: InvoiceData;
  className?: string;
}

function ReadonlyField({
  label,
  icon: Icon,
  value,
  mono = false,
  compact = false,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  mono?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={cn("space-y-2", compact && "space-y-1")}>
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <div
        className={cn(
          "flex w-full items-center rounded-md border border-input bg-muted/40 text-sm",
          compact ? "min-h-8 px-2.5 py-1.5 text-xs" : "min-h-10 px-3 py-2",
          mono && "font-mono break-all",
        )}
      >
        {value || "—"}
      </div>
    </div>
  );
}

export function InvoiceReadonlyCard({
  invoiceNumber,
  invoiceDate,
  invoice,
  className,
}: InvoiceReadonlyCardProps) {
  const tokenSymbol = invoice.token.trim().toUpperCase();
  const serviceLine = invoice.quantity
    ? `${invoice.description || "—"} × ${invoice.quantity}`
    : invoice.description || "—";

  return (
    <article
      className={cn(
        "rounded-xl border bg-card p-6 shadow-sm md:p-8",
        className,
      )}
    >
      <div className="mb-8 flex items-start justify-between gap-4 border-b pb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Commercial Invoice
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">商业发票</h2>
        </div>
        <div className="text-right text-sm">
          <p className="font-mono text-muted-foreground">{invoiceNumber}</p>
          <p className="mt-1 text-muted-foreground">{invoiceDate}</p>
        </div>
      </div>

      <div className="mb-4">
        <ReadonlyField
          label="商家地址"
          icon={Building2}
          value={invoice.merchantAddress}
          mono
          compact
        />
      </div>

      <div className="mb-6">
        <ReadonlyField label="客户邮箱" icon={Mail} value={invoice.clientEmail} />
      </div>

      <div className="mb-6 rounded-lg border bg-muted/40 p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          服务项目
        </p>
        <p className="text-sm">{serviceLine}</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <ReadonlyField
          label="链"
          icon={Link2}
          value={getChainLabel(invoice.chain)}
        />
        <ReadonlyField label="代币" icon={Coins} value={invoice.token} />
      </div>

      <div className="flex items-end justify-between gap-4 border-t pt-6">
        <span className="text-sm font-medium text-muted-foreground">
          应付金额
        </span>
        <div className="text-right">
          <div className="flex items-center justify-end gap-2">
            <span className="text-lg text-muted-foreground">$</span>
            <span className="text-3xl font-bold">
              {invoice.amountUSD || "0.00"}
            </span>
            <span className="text-sm text-muted-foreground">USD</span>
          </div>
          {invoice.tokenAmount && (
            <p className="mt-2 text-sm text-muted-foreground">
              ≈{" "}
              <span className="font-semibold text-foreground">
                {formatTokenAmount(invoice.tokenAmount)} {tokenSymbol}
              </span>
            </p>
          )}
          {invoice.tokenUsdRate && (
            <p className="mt-1 text-xs text-muted-foreground">
              1 {tokenSymbol} = ${formatUsdRate(invoice.tokenUsdRate)}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
