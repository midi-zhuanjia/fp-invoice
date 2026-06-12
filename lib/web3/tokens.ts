import { base, mainnet, sepolia } from "wagmi/chains";

export interface TokenConfig {
  address: `0x${string}`;
  decimals: number;
}

const TOKEN_BY_CHAIN: Record<string, Partial<Record<number, TokenConfig>>> = {
  USDC: {
    [mainnet.id]: {
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      decimals: 6,
    },
    [sepolia.id]: {
      address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      decimals: 6,
    },
    [base.id]: {
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      decimals: 6,
    },
  },
  USDT: {
    [mainnet.id]: {
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      decimals: 6,
    },
    [base.id]: {
      address: "0xfde4C96c8592FEe5f8ab9dF61B72b79395c9789",
      decimals: 6,
    },
  },
};

export function getTokenConfig(
  tokenSymbol: string,
  chainId: number,
): TokenConfig | undefined {
  const normalized = tokenSymbol.trim().toUpperCase();
  return TOKEN_BY_CHAIN[normalized]?.[chainId];
}

export function isNativeToken(tokenSymbol: string): boolean {
  const normalized = tokenSymbol.trim().toUpperCase();
  return normalized === "ETH";
}
