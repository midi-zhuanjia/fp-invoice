"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Building2 } from "lucide-react";
import { useEffect } from "react";
import { useAccount } from "wagmi";

import { Input } from "@/components/ui/input";
import { WALLET_LOGIN_DISABLED } from "@/lib/wagmi";

interface MerchantWalletBarProps {
  merchantAddress: string;
  onAddressChange: (address: string) => void;
}

function formatAddress(address: string) {
  return address;
}

export function MerchantWalletBar({
  merchantAddress,
  onAddressChange,
}: MerchantWalletBarProps) {
  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (WALLET_LOGIN_DISABLED) return;
    if (address && address !== merchantAddress) {
      onAddressChange(address);
    }
  }, [address, merchantAddress, onAddressChange]);

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          商家收款地址
        </label>
        {!WALLET_LOGIN_DISABLED ? (
          <ConnectButton chainStatus="none" showBalance={false} />
        ) : (
          <button
            type="button"
            disabled
            className="rounded-md border border-input bg-background px-3 py-2 text-xs text-muted-foreground"
          >
            钱包登录已停用
          </button>
        )}
      </div>

      <div className="rounded-md border border-dashed bg-muted/30 px-3 py-3">
        {WALLET_LOGIN_DISABLED ? (
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>钱包登录功能已暂时停用，请手动填写商家地址。</p>
            <Input
              value={merchantAddress}
              onChange={(e) => onAddressChange(e.target.value)}
              placeholder="0x1234..."
              className="w-full"
            />
          </div>
        ) : isConnected && merchantAddress ? (
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">已连接，请核对：</span>
            <span
              className="font-mono text-foreground break-all"
              title={merchantAddress}
            >
              {formatAddress(merchantAddress)}
            </span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            请使用 MetaMask / OKX / Bitget 等钱包连接，地址将自动填入
          </p>
        )}
      </div>
    </div>
  );
}
