import { encodeFunctionData, type Address, type Hex } from "viem";
import { ERC20_ABI } from "./abi.js";
import type { GraderClient } from "./grader_client.js";

export interface PublicClientLike {
  waitForTransactionReceipt(args: { hash: Hex; confirmations?: number }): Promise<{ status: "success" | "reverted" | 0 | 1 }>;
}

export interface WalletClientLike {
  sendTransaction(args: { to: Address; data: Hex; value?: bigint }): Promise<Hex>;
}

export interface PayForHintResult {
  txHash: Hex;
  hint: string;
}

export interface PayForHintDeps {
  walletClient: WalletClientLike;
  publicClient: PublicClientLike;
  grader: GraderClient;
  usdtAddress: Address;
  log?: (msg: string) => void;
}

export async function payForHint(deps: PayForHintDeps): Promise<PayForHintResult> {
  const { walletClient, publicClient, grader, usdtAddress } = deps;
  const log = deps.log ?? ((m) => console.log(m));

  const quote = await grader.fetchHint402();
  if (quote.status !== 402) {
    throw new Error(`expected 402 quote, got ${quote.status}`);
  }
  const recipient = quote.body.recipient as Address | undefined;
  if (!recipient) {
    throw new Error("x402 response missing recipient");
  }
  const amountRaw = (quote.body.amount_wei ?? quote.body.amount) as string | number | undefined;
  if (amountRaw === undefined) {
    throw new Error("x402 response missing amount");
  }
  const amountWei = BigInt(amountRaw);

  const data = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [recipient, amountWei],
  });

  const txHash = await walletClient.sendTransaction({ to: usdtAddress, data });
  log(`[x402] paid ${amountWei.toString()} to ${recipient} tx: ${txHash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, confirmations: 1 });
  const ok = receipt.status === "success" || receipt.status === 1;
  if (!ok) {
    throw new Error(`x402 payment tx reverted: ${txHash}`);
  }

  const confirmed = await grader.fetchHint402({ paymentTxHash: txHash });
  if (confirmed.status !== 200) {
    throw new Error(`grader still returned 402 after payment ${txHash}`);
  }
  const hint = typeof confirmed.body.hint === "string" ? confirmed.body.hint : "";
  return { txHash, hint };
}
