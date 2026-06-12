import { parseEther } from "viem";

export const MIN_GAS_ETH = parseEther("0.0001");

export function getGasFundingUrl(chainName: string): string {
  const normalized = chainName.trim().toLowerCase();

  if (normalized === "sepolia") {
    return "https://www.alchemy.com/faucets/ethereum-sepolia";
  }

  if (normalized === "base") {
    return "https://bridge.base.org";
  }

  return "https://www.coinbase.com/";
}
