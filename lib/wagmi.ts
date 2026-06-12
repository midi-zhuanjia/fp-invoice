import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { base, mainnet, sepolia } from "wagmi/chains";

import { SUPPORTED_CHAINS } from "@/lib/web3/chains";

export const WALLET_LOGIN_DISABLED =
  process.env.NEXT_PUBLIC_DISABLE_WALLET_LOGIN === "true";

const STABLE_RPC_TRANSPORTS = {
  [mainnet.id]: http( "https://cloudflare-eth.com"),
  [base.id]: http( "https://mainnet.base.org" ),
  [sepolia.id]: http( "https://rpc.sepolia.org" ),
};

export const wagmiConfig = getDefaultConfig({
  appName: "跨境发票",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ??
    "00000000000000000000000000000000",
  chains: [...SUPPORTED_CHAINS],
  ssr: false,
  transports: STABLE_RPC_TRANSPORTS,
  wallets: WALLET_LOGIN_DISABLED ? [] : undefined,
});
