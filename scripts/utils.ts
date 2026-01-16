import * as anchor from "@coral-xyz/anchor";
import { OnchainXyberPointsSDK } from "../ts-sdk/src";
import fs from "fs";

export function initializeSdk() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.OnchainXyberPoints;
  const sdk = OnchainXyberPointsSDK.create(provider, program);
  return { provider, sdk, program };
}

function getCluster(provider: anchor.AnchorProvider): string {
  const endpoint = provider.connection.rpcEndpoint;
  if (endpoint.includes('devnet')) return 'devnet';
  if (endpoint.includes('testnet')) return 'testnet';
  if (endpoint.includes('localhost') || endpoint.includes('127.0.0.1')) {
    return 'custom&customUrl=' + encodeURIComponent(endpoint);
  }
  return 'mainnet-beta';
}

export function getExplorerUrl(provider: anchor.AnchorProvider, signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${getCluster(provider)}`;
}

export function getAccountUrl(provider: anchor.AnchorProvider, address: anchor.web3.PublicKey): string {
  return `https://explorer.solana.com/address/${address.toString()}?cluster=${getCluster(provider)}`;
}

export async function runWithSdk(
  fn: (ctx: {
    provider: anchor.AnchorProvider;
    sdk: ReturnType<typeof OnchainXyberPointsSDK.create>;
    program: any;
  }) => Promise<void>
): Promise<void> {
  try {
    const { provider, sdk, program } = initializeSdk();
    await fn({ provider, sdk, program });
  } catch (error: any) {
    console.error("❌ Transaction failed:");
    console.error(error);
    if (error.logs) {
      console.error("Program logs:");
      error.logs.forEach((log: string) => console.error(log));
    }
    process.exit(1);
  }
}

export function loadKeypair(path: string): anchor.web3.Keypair {
  const secretKey = JSON.parse(fs.readFileSync(path, 'utf-8'));
  return anchor.web3.Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

export function toPublicKey(acc: unknown): anchor.web3.PublicKey {
  if (!acc) throw new Error("Cannot convert null/undefined to PublicKey");
  if ((acc as any)._bn) return acc as anchor.web3.PublicKey;
  if ((acc as any).pubkey) return new anchor.web3.PublicKey((acc as any).pubkey);
  if ((acc as any).address) return new anchor.web3.PublicKey((acc as any).address);
  if (typeof acc === "string") return new anchor.web3.PublicKey(acc);
  return new anchor.web3.PublicKey(acc as any);
}
