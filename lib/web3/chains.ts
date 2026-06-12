import { base, mainnet, sepolia, type Chain } from "wagmi/chains";

export const SUPPORTED_CHAINS = [mainnet, base, sepolia] as const;

export const INVOICE_CHAIN_OPTIONS = [
  { value: "Ethereum", label: "Ethereum 主网" },
  { value: "Base", label: "Base" },
  { value: "Sepolia", label: "Sepolia 测试网" },
] as const;

const CHAIN_ALIASES: Record<string, Chain> = {
  ethereum: mainnet,
  mainnet: mainnet,
  eth: mainnet,
  "ethereum 主网": mainnet,
  base: base,
  sepolia: sepolia,
  "sepolia 测试网": sepolia,
};

export function resolveChain(chainName: string): Chain | undefined {
  const normalized = chainName.trim().toLowerCase();
  return CHAIN_ALIASES[normalized];
}

export function resolveChainId(chainName: string): number | undefined {
  return resolveChain(chainName)?.id;
}

export function getChainLabel(chainName: string): string {
  const option = INVOICE_CHAIN_OPTIONS.find((item) => item.value === chainName);
  return option?.label ?? chainName;
}

export function getBlockExplorerUrl(chainName: string, txHash: string): string {
  const normalized = chainName.trim().toLowerCase();
  
  const baseUrls: Record<string, string> = {
    ethereum: "https://etherscan.io",
    mainnet: "https://etherscan.io",
    eth: "https://etherscan.io",
    "ethereum 主网": "https://etherscan.io",
    base: "https://basescan.org",
    sepolia: "https://sepolia.etherscan.io",
    "sepolia 测试网": "https://sepolia.etherscan.io",
  };
  
  const baseUrl = baseUrls[normalized] || "https://etherscan.io";
  return `${baseUrl}/tx/${txHash}`;
}
