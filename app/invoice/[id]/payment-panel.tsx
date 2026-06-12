"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Bot, ExternalLink, Loader2, Wallet } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  erc20Abi,
  formatEther,
  formatUnits,
  isAddress,
  parseEther,
  parseUnits,
} from "viem";
import {
  useAccount,
  useBalance,
  useSendTransaction,
  useSwitchChain,
  useWriteContract,
} from "wagmi";

import { Button } from "@/components/ui/button";
import type { InvoiceData } from "@/lib/invoice";
import { getChainLabel, resolveChain, resolveChainId } from "@/lib/web3/chains";
import { getGasFundingUrl, MIN_GAS_ETH } from "@/lib/web3/gas";
import { getTokenConfig, isNativeToken } from "@/lib/web3/tokens";

interface PaymentPanelProps {
  invoice: InvoiceData;
  txHash?: `0x${string}`;
  onTxHash: (hash: `0x${string}` | undefined) => void;
  isConfirming: boolean;
  paymentSuccess: boolean;
}

export function PaymentPanel({
  invoice,
  txHash,
  onTxHash,
  isConfirming,
  paymentSuccess,
}: PaymentPanelProps) {
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();

  const targetChain = resolveChain(invoice.chain);
  const targetChainId = resolveChainId(invoice.chain);
  const chainLabel = getChainLabel(invoice.chain);
  const tokenSymbol = invoice.token.trim().toUpperCase();
  const isNative = isNativeToken(invoice.token);
  const tokenConfig =
    targetChainId && !isNative
      ? getTokenConfig(invoice.token, targetChainId)
      : undefined;

  const { data: nativeBalance, isLoading: isLoadingNative } = useBalance({
    address,
    chainId: targetChainId,
    query: { enabled: isConnected && targetChainId != null },
  });

  const { data: tokenBalance, isLoading: isLoadingToken } = useBalance({
    address,
    chainId: targetChainId,
    token: tokenConfig?.address,
    query: {
      enabled: isConnected && targetChainId != null && tokenConfig != null,
    },
  });

  const {
    writeContractAsync,
    data: erc20Hash,
    isPending: isWritingContract,
    error: writeContractError,
    reset: resetWriteContract,
  } = useWriteContract();

  const {
    sendTransactionAsync,
    data: nativeHash,
    isPending: isSendingNative,
    error: sendTransactionError,
    reset: resetSendTransaction,
  } = useSendTransaction();

  // normalize pending hash: wagmi hooks may return a string or a transaction object
  const rawPending = erc20Hash ?? nativeHash;
  const pendingHash =
    typeof rawPending === "string"
      ? rawPending
      : rawPending && typeof rawPending === "object"
      ? (rawPending as any).hash ?? (rawPending as any).transactionHash
      : undefined;

  // debug logs to help diagnose missing confirmations
  if (process.env.NODE_ENV !== "production") {
    console.debug("[PaymentPanel] rawPending:", rawPending);
    console.debug("[PaymentPanel] pendingHash:", pendingHash);
  }
  const tokenAmount = invoice.tokenAmount.trim();
  const requiredTokenAmount =
    tokenConfig && tokenAmount && !Number.isNaN(Number(tokenAmount))
      ? parseUnits(tokenAmount, tokenConfig.decimals)
      : undefined;

  const isCheckingBalances =
    isConnected && (isLoadingNative || (!isNative && isLoadingToken));

  const hasInsufficientGas =
    nativeBalance !== undefined && nativeBalance.value < MIN_GAS_ETH;

  const hasInsufficientToken =
    !isNative &&
    requiredTokenAmount !== undefined &&
    tokenBalance !== undefined &&
    tokenBalance.value < requiredTokenAmount;

  const gasFundingUrl = getGasFundingUrl(invoice.chain);

  useEffect(() => {
    if (pendingHash && pendingHash !== txHash) {
      if (process.env.NODE_ENV !== "production") {
        console.debug("[PaymentPanel] emitting txHash ->", pendingHash);
      }
      onTxHash(pendingHash);
    }
  }, [pendingHash, txHash, onTxHash]);

  useEffect(() => {
    if (writeContractError) {
      toast.error(writeContractError.message.split("\n")[0] ?? "支付失败");
      resetWriteContract();
    }
  }, [writeContractError, resetWriteContract]);

  useEffect(() => {
    if (sendTransactionError) {
      toast.error(sendTransactionError.message.split("\n")[0] ?? "支付失败");
      resetSendTransaction();
    }
  }, [sendTransactionError, resetSendTransaction]);

  const canPay =
    isConnected &&
    isAddress(invoice.merchantAddress) &&
    tokenAmount !== "" &&
    !Number.isNaN(Number(tokenAmount)) &&
    Number(tokenAmount) > 0 &&
    targetChainId != null &&
    (isNative || tokenConfig != null) &&
    !hasInsufficientGas &&
    !hasInsufficientToken &&
    !isCheckingBalances;

  const handlePay = async () => {
    if (!targetChainId || !targetChain) {
      toast.error(`暂不支持网络：${invoice.chain}`);
      return;
    }

    if (!isAddress(invoice.merchantAddress)) {
      toast.error("商家收款地址无效，请联系商家确认");
      return;
    }

    if (!tokenAmount || Number.isNaN(Number(tokenAmount)) || Number(tokenAmount) <= 0) {
      toast.error("发票金额无效");
      return;
    }

    try {
      if (chainId !== targetChainId) {
        await switchChainAsync({ chainId: targetChainId });
      }

      if (isNative) {
        await sendTransactionAsync({
          to: invoice.merchantAddress as `0x${string}`,
          value: parseEther(tokenAmount),
          chainId: targetChainId,
        });
        return;
      }

      if (!tokenConfig) {
        toast.error(
          `暂不支持在 ${invoice.chain} 上使用 ${invoice.token} 支付`,
        );
        return;
      }

      await writeContractAsync({
        address: tokenConfig.address,
        abi: erc20Abi,
        functionName: "transfer",
        args: [
          invoice.merchantAddress as `0x${string}`,
          parseUnits(tokenAmount, tokenConfig.decimals),
        ],
        chainId: targetChainId,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("User rejected")) {
        toast.error("你已取消支付");
        return;
      }

      if (error instanceof Error) {
        toast.error(error.message.split("\n")[0] ?? "支付失败");
      }
    }
  };

  const payLabel = `一键支付 ${tokenAmount || "0"} ${tokenSymbol}`;
  const isSubmitting =
    isWritingContract || isSendingNative || isSwitchingChain;
  const isBusy = isSubmitting || isConfirming;
  const displayHash = txHash ?? pendingHash;

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm md:p-8">
      <div className="mb-6 flex items-center gap-2">
        <Wallet className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Web3 支付</h2>
      </div>

      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        请连接钱包并切换到{" "}
        <span className="font-medium text-foreground">{chainLabel}</span>
        ，确认后将向商家地址转账{" "}
        <span className="font-medium text-foreground">
          {tokenAmount} {tokenSymbol}
        </span>
        （相当于 ${invoice.amountUSD} USD）。
      </p>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ConnectButton />

        {isConnected && (
          <Button
            size="lg"
            className="h-12 w-full font-semibold sm:w-auto"
            onClick={handlePay}
            disabled={!canPay || isBusy || paymentSuccess}
          >
            {isBusy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : paymentSuccess ? (
              "支付完成"
            ) : isCheckingBalances ? (
              "检查余额中..."
            ) : (
              payLabel
            )}
          </Button>
        )}
      </div>

      {isConnected && !isCheckingBalances && (
        <div className="mt-4 space-y-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
          <p>
            {tokenSymbol} 余额：
            <span className="ml-1 font-medium text-foreground">
              {isNative
                ? nativeBalance
                  ? `${formatEther(nativeBalance.value)} ETH`
                  : "—"
                : tokenBalance
                  ? `${formatUnits(tokenBalance.value, tokenConfig?.decimals ?? 6)} ${tokenSymbol}`
                  : "—"}
            </span>
          </p>
          <p>
            {chainLabel} ETH（Gas）：
            <span className="ml-1 font-medium text-foreground">
              {nativeBalance
                ? `${formatEther(nativeBalance.value)} ETH`
                : "—"}
            </span>
          </p>
        </div>
      )}

      {isConnected && hasInsufficientGas && !paymentSuccess && (
        <div className="mt-4 flex gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950/40">
          <Bot className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-100">
            钱包没有手续费。您可以点击这里
            <a
              href={gasFundingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-1 inline-flex items-center gap-0.5 font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
            >
              前往官方跨链桥/买币
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            ，为钱包充值少量 ETH 以支付 Gas 费。
          </p>
        </div>
      )}

      {isConnected &&
        hasInsufficientToken &&
        !hasInsufficientGas &&
        !paymentSuccess && (
          <p className="mt-4 text-sm text-destructive">
            {tokenSymbol} 余额不足，无法完成 {tokenAmount}{" "}
            {tokenSymbol} 的支付。
          </p>
        )}

      {isConnected &&
        !canPay &&
        !paymentSuccess &&
        !hasInsufficientGas &&
        !hasInsufficientToken &&
        !isCheckingBalances && (
          <p className="mt-4 text-sm text-destructive">
            {!isAddress(invoice.merchantAddress)
              ? "商家尚未填写有效收款地址，无法发起支付。"
              : !targetChainId
                ? `当前不支持 ${invoice.chain} 网络，请联系商家。`
                : !isNative && !tokenConfig
                  ? `当前网络暂不支持 ${tokenSymbol} 代币支付。`
                  : "请检查发票金额后重试。"}
          </p>
        )}

      {displayHash && (
        <p className="mt-4 break-all font-mono text-xs text-muted-foreground">
          交易哈希：{displayHash}
          {isConfirming && !paymentSuccess && (
            <span className="ml-2 text-amber-600">（等待链上确认…）</span>
          )}
        </p>
      )}
    </section>
  );
}
