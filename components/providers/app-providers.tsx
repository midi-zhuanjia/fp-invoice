"use client";

import { Web3Provider } from "@/components/providers/web3-provider";

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return <Web3Provider>{children}</Web3Provider>;
}
