"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  Coins,
  FileText,
  Link2,
  Loader2,
  Mail,
  Moon,
  Send,
  Sun,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { MerchantWalletBar } from "@/components/merchant-wallet-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select } from "@/components/ui/select";
import { downloadInvoicePdf } from "@/lib/generate-invoice-pdf";
import invoiceBackground from "@/img/invoice-9d42c9a1.jpg";
import {
  INITIAL_INVOICE,
  type InvoiceData,
} from "@/lib/invoice";
import {
  invoiceParseSchema,
  type ParsedInvoice,
} from "@/lib/invoice-schema";
import {
  convertUsdToToken,
  formatTokenAmount,
  formatUsdRate,
  parseCurrencyAmount,
} from "@/lib/web3/conversion";
import { INVOICE_CHAIN_OPTIONS } from "@/lib/web3/chains";
import { cn } from "@/lib/utils";

export type { InvoiceData };

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "你好！我是你的跨境发票助手。你可以用自然语言描述这笔交易，例如：「给 john@example.com 开一张 500 USDC 的发票，用于网站开发服务」。我会帮你填写右侧的发票预览，你也可以随时手动修改。",
};

function buildAssistantMessage(
  object: Partial<ParsedInvoice> | undefined,
  isLoading: boolean,
): string {
  if (!object || Object.keys(object).length === 0) {
    return isLoading
      ? "正在解析你的发票描述..."
      : "未能解析出发票信息，请换一种说法，或直接在右侧表单中手动填写。";
  }

  const lines = ["已为你解析发票信息："];

  if (object.clientEmail) {
    lines.push(`• 客户邮箱：${object.clientEmail}`);
  }
  if (object.amountUSD != null) {
    lines.push(`• 金额：${object.amountUSD} USD`);
  }
  if (object.token) {
    lines.push(`• 代币：${object.token}`);
  }
  if (object.chain) {
    lines.push(`• 链：${object.chain}`);
  }
  if (object.description) {
    lines.push(`• 服务项目：${object.description}`);
  }

  if (isLoading) {
    lines.push("", "（正在完善解析结果...）");
  } else {
    lines.push("", "请确认右侧预览，如有误可直接修改。");
  }

  return lines.join("\n");
}

function mergeParsedInvoice(
  prev: InvoiceData,
  object: Partial<ParsedInvoice>,
): InvoiceData {
  return {
    ...prev,
    clientEmail: object.clientEmail ?? prev.clientEmail,
    amountUSD:
      object.amountUSD != null ? String(object.amountUSD) : prev.amountUSD,
    chain: object.chain ?? prev.chain,
    token: object.token ?? prev.token,
    description: object.description ?? prev.description,
    quantity: prev.quantity || "1",
  };
}

export default function HomePage() {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(INITIAL_INVOICE);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingMessageIdRef = useRef<string | null>(null);
  const invoiceCardRef = useRef<HTMLElement>(null);

  const {
    object: parsedInvoice,
    submit,
    isLoading: isParsing,
  } = useObject({
    api: "/api/chat",
    schema: invoiceParseSchema,
    onError: (error) => {
      const assistantId = streamingMessageIdRef.current;
      if (!assistantId) return;

      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: `解析失败：${error.message}。请检查 API 配置后重试。`,
              }
            : message,
        ),
      );
    },
  });

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const assistantId = streamingMessageIdRef.current;
    if (!assistantId) return;

    const content = buildAssistantMessage(parsedInvoice, isParsing);

    setMessages((prev) =>
      prev.map((message) =>
        message.id === assistantId ? { ...message, content } : message,
      ),
    );

    if (parsedInvoice && Object.keys(parsedInvoice).length > 0) {
      setInvoiceData((prev) => mergeParsedInvoice(prev, parsedInvoice));
    }
  }, [parsedInvoice, isParsing]);

  useEffect(() => {
    let isCancelled = false;

    const amount = parseCurrencyAmount(invoiceData.amountUSD);
    const token = invoiceData.token.trim();

    if (amount == null || !token) {
      setIsConverting(false);
      setConversionError("");
      setInvoiceData((prev) =>
        prev.tokenAmount || prev.tokenUsdRate || prev.rateUpdatedAt
          ? { ...prev, tokenAmount: "", tokenUsdRate: "", rateUpdatedAt: "" }
          : prev,
      );
      return () => {
        isCancelled = true;
      };
    }

    setIsConverting(true);
    setConversionError("");

    convertUsdToToken(invoiceData.amountUSD, token)
      .then((result) => {
        if (isCancelled) return;

        if (!result) {
          setConversionError(`暂不支持 ${token.toUpperCase()} 的美元换算`);
          setInvoiceData((prev) => ({
            ...prev,
            tokenAmount: "",
            tokenUsdRate: "",
            rateUpdatedAt: "",
          }));
          return;
        }

        setInvoiceData((prev) =>
          prev.amountUSD === invoiceData.amountUSD && prev.token === invoiceData.token
            ? { ...prev, ...result }
            : prev,
        );
      })
      .catch((error: unknown) => {
        if (isCancelled) return;

        const message =
          error instanceof Error ? error.message : "获取代币汇率失败";
        setConversionError(message);
        setInvoiceData((prev) => ({
          ...prev,
          tokenAmount: "",
          tokenUsdRate: "",
          rateUpdatedAt: "",
        }));
      })
      .finally(() => {
        if (!isCancelled) {
          setIsConverting(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [invoiceData.amountUSD, invoiceData.token]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const handleReset = () => {
    setInvoiceData(INITIAL_INVOICE);
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    streamingMessageIdRef.current = null;
  };

  const updateInvoiceField = useCallback(
    (field: keyof InvoiceData, value: string) => {
      setInvoiceData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleMerchantAddressChange = useCallback(
    (address: string) => {
      updateInvoiceField("merchantAddress", address);
    },
    [updateInvoiceField],
  );

  const handleSendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed || isParsing) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    const assistantId = crypto.randomUUID();
    streamingMessageIdRef.current = assistantId;

    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "正在解析你的发票描述...",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    submit({ message: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleConfirmAndSend = async () => {
    if (isSending) return;

    if (!invoiceData.clientEmail.trim()) {
      toast.error("请先填写客户邮箱");
      return;
    }

    if (!invoiceData.amountUSD.trim()) {
      toast.error("请先填写应付金额");
      return;
    }

    if (!invoiceData.tokenAmount.trim()) {
      toast.error(conversionError || "请等待代币金额换算完成");
      return;
    }

    if (!invoiceData.merchantAddress.trim()) {
      toast.error("请先连接钱包获取商家收款地址");
      return;
    }

    if (!invoiceCardRef.current) {
      toast.error("未找到发票预览区域");
      return;
    }

    setIsSending(true);

    try {
      const invoiceId = crypto.randomUUID();
      const filename = `invoice-${invoiceId.slice(0, 8)}.pdf`;

      await downloadInvoicePdf(invoiceCardRef.current, filename, {
        invoice: invoiceData,
        invoiceNumber,
        invoiceDate: today,
        backgroundSrc: invoiceBackground.src,
      });

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          invoiceData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "邮件发送失败");
      }

      toast.success("发票已下载，账单邮件已发送给买家！");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "发送失败，请稍后重试";
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  const invoiceNumber = "INV-2026-0001";
  const today = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="flex shrink-0 items-center justify-between border-b px-4 py-3 md:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight md:text-base">
              跨境通：发票管理
            </h1>
            <p className="text-xs text-muted-foreground">AI 驱动 · 实时预览</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            aria-label="重置"
            className="text-xs"
          >
            重置
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            aria-label="切换主题"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col-reverse lg:flex-row">
        {/* 左侧 / 下侧：AI 聊天 */}
        <section className="flex min-h-0 flex-1 flex-col border-t lg:border-r lg:border-t-0">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Bot className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">AI 发票助手</span>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-4 p-4 md:p-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {message.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {message.content}
                    {message.role === "assistant" &&
                      isParsing &&
                      message.id === streamingMessageIdRef.current && (
                        <Loader2 className="mt-2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="shrink-0 border-t p-4">
            <div className="flex items-center gap-2 rounded-xl border bg-card p-2 shadow-sm">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="描述发票内容，例如金额、客户邮箱、服务项目…"
                className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!input.trim() || isParsing}
                aria-label="发送消息"
              >
                {isParsing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* 右侧 / 上侧：发票预览 */}
        <section className="flex min-h-0 w-full shrink-0 flex-col overflow-y-auto bg-muted/30 lg:w-[min(480px,42%)] xl:w-[min(520px,40%)]">
          <div className="flex items-center gap-2 border-b bg-background/80 px-4 py-3 backdrop-blur-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">发票实时预览</span>
          </div>

          <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <article
              ref={invoiceCardRef}
              className="rounded-xl border bg-card p-6 shadow-sm md:p-8 relative"
            >
              <div className="mb-8 flex items-start justify-between gap-4 border-b pb-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Commercial Invoice
                  </p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight">
                    商业发票
                  </h2>
                </div>
                <div className="text-right text-sm">
                  <p className="font-mono text-muted-foreground">
                    {invoiceNumber}
                  </p>
                  <p className="mt-1 text-muted-foreground">{today}</p>
                </div>
              </div>

              <MerchantWalletBar
                merchantAddress={invoiceData.merchantAddress}
                onAddressChange={handleMerchantAddressChange}
              />

              <div className="mb-6 space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  客户邮箱
                </label>
                <Input
                  type="email"
                  value={invoiceData.clientEmail}
                  onChange={(e) =>
                    updateInvoiceField("clientEmail", e.target.value)
                  }
                  placeholder="client@example.com"
                />
              </div>

              <div className="mb-6 rounded-lg border bg-muted/40 p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  服务项目
                </p>
                <div className="grid grid-cols-4 gap-3">
                  <Input
                    value={invoiceData.description}
                    onChange={(e) =>
                      updateInvoiceField("description", e.target.value)
                    }
                    placeholder="服务或商品描述"
                    className="col-span-3"
                  />
                  <Input
                    type="number"
                    min="1"
                    value={invoiceData.quantity}
                    onChange={(e) =>
                      updateInvoiceField("quantity", e.target.value)
                    }
                    placeholder="数量"
                    className="col-span-1"
                  />
                </div>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Link2 className="h-3.5 w-3.5" />
                    链
                  </label>
                  <Select
                    value={invoiceData.chain}
                    onChange={(value) => updateInvoiceField("chain", value)}
                    options={INVOICE_CHAIN_OPTIONS}
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Coins className="h-3.5 w-3.5" />
                    代币
                  </label>
                  <Input
                    value={invoiceData.token}
                    onChange={(e) =>
                      updateInvoiceField("token", e.target.value)
                    }
                    placeholder="USDC"
                  />
                </div>
              </div>

              <div className="flex items-end justify-between border-t pt-6">
                <span className="text-sm font-medium text-muted-foreground">
                  应付金额
                </span>
                <div className="min-w-0 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-lg text-muted-foreground">$</span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={invoiceData.amountUSD}
                      onChange={(e) =>
                        updateInvoiceField("amountUSD", e.target.value)
                      }
                      placeholder="0.00"
                      className="h-12 w-36 border-0 bg-transparent p-0 text-right text-3xl font-bold shadow-none focus-visible:ring-0"
                    />
                    <span className="text-sm text-muted-foreground">USD</span>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {isConverting ? (
                      <span className="inline-flex items-center justify-end gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        正在换算
                      </span>
                    ) : invoiceData.tokenAmount ? (
                      <>
                        ≈{" "}
                        <span className="font-semibold text-foreground">
                          {formatTokenAmount(invoiceData.tokenAmount)}{" "}
                          {invoiceData.token.trim().toUpperCase()}
                        </span>
                        {invoiceData.tokenUsdRate && (
                          <span className="block text-xs">
                            1 {invoiceData.token.trim().toUpperCase()} = $
                            {formatUsdRate(invoiceData.tokenUsdRate)}
                          </span>
                        )}
                      </>
                    ) : conversionError ? (
                      <span className="text-destructive">{conversionError}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>

            <Button
              size="lg"
              className="h-14 w-full text-base font-semibold"
              onClick={handleConfirmAndSend}
              disabled={isSending || isConverting}
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              {isSending ? "正在发送..." : "确认无误并发送"}
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
