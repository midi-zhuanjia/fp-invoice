import { NextResponse } from 'next/server';

interface CheckBody {
  txHash?: string;
  chain?: string;
}

// Minimal map of chain name -> RPC URL (server-side only; avoids browser CORS)
const RPC_MAP: Record<string, string> = {
  sepolia: 'https://rpc.sepolia.org/',
  sepolia_testnet: 'https://rpc.sepolia.org/',
  ethereum: 'https://cloudflare-eth.com',
  mainnet: 'https://cloudflare-eth.com',
  base: 'https://mainnet.base.org',
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckBody;
    const { txHash, chain } = body;

    if (!txHash || !txHash.trim()) {
      return NextResponse.json({ error: '缺少 txHash' }, { status: 400 });
    }

    const normalized = (chain || '').trim().toLowerCase() || 'ethereum';
    const rpcUrl = RPC_MAP[normalized] ?? RPC_MAP['ethereum'];

    // call eth_getTransactionReceipt via server-side fetch to avoid CORS
    const payload = {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getTransactionReceipt',
      params: [txHash],
    };

    const resp = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      return NextResponse.json({ error: 'RPC 请求失败' }, { status: 502 });
    }

    const data = await resp.json();
    const receipt = data.result ?? null;

    return NextResponse.json({ confirmed: !!receipt, receipt });
  } catch (error) {
    console.error('[check-receipt]', error);
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}
