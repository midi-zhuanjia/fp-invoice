const STABLE_USD_TOKENS = new Set(["USDC", "USDT"]);

const COINGECKO_IDS: Record<string, string> = {
  ETH: "ethereum",
};

export interface TokenConversionResult {
  tokenAmount: string;
  tokenUsdRate: string;
  rateUpdatedAt: string;
}

export function normalizeTokenSymbol(tokenSymbol: string): string {
  return tokenSymbol.trim().toUpperCase();
}

export function parseCurrencyAmount(value: string): number | null {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return null;

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return parsed;
}

export function trimDecimal(value: string): string {
  return value.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

export function formatTokenAmount(value: string): string {
  const parsed = parseCurrencyAmount(value);
  if (parsed == null) return value || "0";

  const maximumFractionDigits = parsed >= 1 ? 6 : 8;

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(parsed);
}

export function formatUsdRate(value: string): string {
  const parsed = parseCurrencyAmount(value);
  if (parsed == null) return value || "0";

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: parsed >= 1 ? 2 : 4,
    maximumFractionDigits: parsed >= 1 ? 2 : 8,
  }).format(parsed);
}

export function calculateTokenAmount(
  amountUSD: string,
  tokenUsdRate: string,
): string {
  const amount = parseCurrencyAmount(amountUSD);
  const rate = parseCurrencyAmount(tokenUsdRate);

  if (amount == null || rate == null) return "";

  return trimDecimal((amount / rate).toFixed(8));
}

export function clampTokenAmountDecimals(
  tokenAmount: string,
  decimals: number,
): string {
  const normalized = tokenAmount.replace(/,/g, "").trim();
  if (!normalized.includes(".")) return normalized;

  const [whole, fraction = ""] = normalized.split(".");
  return trimDecimal(`${whole}.${fraction.slice(0, decimals)}`);
}

export async function fetchTokenUsdRate(
  tokenSymbol: string,
): Promise<string | null> {
  const normalized = normalizeTokenSymbol(tokenSymbol);

  if (STABLE_USD_TOKENS.has(normalized)) {
    return "1";
  }

  const coingeckoId = COINGECKO_IDS[normalized];
  if (!coingeckoId) {
    return null;
  }

  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error("获取代币汇率失败");
  }

  const data = (await response.json()) as Record<
    string,
    { usd?: number | string }
  >;
  const usd = data[coingeckoId]?.usd;
  const rate = typeof usd === "number" ? usd : Number(usd);

  if (!Number.isFinite(rate) || rate <= 0) {
    return null;
  }

  return trimDecimal(rate.toFixed(8));
}

export async function convertUsdToToken(
  amountUSD: string,
  tokenSymbol: string,
): Promise<TokenConversionResult | null> {
  const tokenUsdRate = await fetchTokenUsdRate(tokenSymbol);
  if (!tokenUsdRate) return null;

  const tokenAmount = calculateTokenAmount(amountUSD, tokenUsdRate);
  if (!tokenAmount) return null;

  return {
    tokenAmount,
    tokenUsdRate,
    rateUpdatedAt: new Date().toISOString(),
  };
}
